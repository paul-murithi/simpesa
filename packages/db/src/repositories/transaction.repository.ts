import { transactionQueries } from "../types/transaction.queries.js";
import { userQueries } from "../types/user.queries.js";
import { merchantQueries } from "../types/merchant.queries.js";
import db from "../client.js";
import type {
  CreateTransactionDTO,
  ProcessTransactionResult,
  TransactionStatus,
  WebHookAttempt,
  WebhookDispatch,
  WebhookJob,
} from "@app/types";
import {
  NotFoundError,
  DomainError,
  InsufficientFundsError,
  InvalidStateError,
  logger,
  ConflictError,
  RESULT_CODES,
} from "@app/utils";
import { OutboxAggregateType, TRANSACTION_STATUS } from "@app/types";
import { Query } from "../client.js";
import { webhookQueries } from "../types/webhooks.queries.js";
import { OutboxQueries } from "../types/outbox.queries.js";

export class TransactionRepository {
  /**
   * Phase 1
   * Attempts to lock the rows and validate if balance is sufficient
   * If Success, transitions the state to processing
   */
  async lockRowsValidate(transaction: CreateTransactionDTO) {
    const {
      amount: transactionAmount,
      short_code,
      phone_number,
      checkout_id,
      external_reference,
      merchant_request_id,
    } = transaction;
    const child = logger.child({ checkoutId: checkout_id });

    const { PROCESSING, PENDING, SUCCESS, FAILED } = TRANSACTION_STATUS;

    // Ensure transaction exists
    await db.query(transactionQueries.ensureTransaction, [
      checkout_id,
      external_reference,
      short_code,
      phone_number,
      transactionAmount,
      JSON.stringify({}),
      merchant_request_id || null,
    ]);

    const statusResult = await db.query(
      transactionQueries.getTransactionStatusByCheckoutId,
      [checkout_id],
    );
    const status = statusResult.rows[0]?.status;
    const currentMetadata = statusResult.rows[0]?.metadata || {};
    logger.info({ currentMetadata }, "[Phase 1 Metadata]");

    if (status === SUCCESS || status === FAILED) {
      child.error(
        `Terminal state revert attempt. Already ${status}. Ignoring.`,
      );
      return;
    }
    if (status === PROCESSING) {
      child.error(`In-flight duplicate. Currently PROCESSING. Ignoring.`);
      return;
    }

    // DB client to begin transaction
    const client = await db.connect();
    await client.query("BEGIN");
    logger.info("Started Phase-1 Database Transaction");

    try {
      // Lock and fetch user
      const userResult = await client.query(userQueries.lockUserByPhoneNumber, [
        phone_number,
      ]);

      if (userResult.rowCount === 0) {
        child.error("User with given phone number not found");
        throw new NotFoundError("User with given phone number not found");
      }

      // Check if user already has a PROCESSING transaction
      const activeTxExists = (
        await client.query(transactionQueries.hasActiveTransactionForUser, [
          phone_number,
          checkout_id,
        ])
      ).rows[0].has_active_transaction;

      if (activeTxExists) {
        child.error("User locked in another transaction request");
        throw new ConflictError(
          "User has an active transaction in PROCESSING state",
        );
      }

      const currentBalance = userResult.rows[0].balance;

      // Lock and fetch merchant
      const merchantResult = await client.query(
        merchantQueries.lockMerchantByShortCode,
        [short_code],
      );
      if (merchantResult.rowCount === 0) {
        child.error("No merchant found for provided short code");
        throw new NotFoundError("No merchant found for provided short code");
      }

      // check user balance against transaction amount
      if (currentBalance < transactionAmount) {
        child.error("User balance is less than transaction amount");
        throw new InsufficientFundsError(
          "User balance is less than transaction amount",
        );
      }

      // Transition state to processing
      const processingMetadata = JSON.stringify({
        ...currentMetadata,
        processing: {
          ...(currentMetadata.processing || {}),
          started_at: new Date().toISOString(),
          status: "PROCESSING",
        },
      });
      logger.info({ processingMetadata }, "[Phase 1 end Metadata]");
      await client.query(transactionQueries.markTransactionProcessing, [
        PROCESSING,
        checkout_id,
        PENDING,
        processingMetadata,
      ]);
      child.info(
        "Completed Phase-1 Transaction processing, Status updated to processing",
      );

      // Commit the transaction
      await client.query("COMMIT");
    } catch (error) {
      const resultCode = this.getResultCode(error);
      const errorMetadata = JSON.stringify({
        ...currentMetadata,
        error: {
          message: error instanceof Error ? error.message : "Unknown error",
          code: resultCode,
        },
        processing: {
          ...(currentMetadata.processing || {}),
          failed_at: new Date().toISOString(),
          status: "FAILED",
        },
      });
      try {
        // Rollback the transaction
        await client.query("ROLLBACK");
      } catch (error) {
        child.error({
          error: error,
          message: "CRITICAL: Failed to rollback transaction in DB",
        });
      }
      if (checkout_id)
        await this.markTransactionFailed(
          checkout_id,
          TRANSACTION_STATUS.PENDING,
          resultCode,
          errorMetadata,
        );
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Phase 2
   * Processes the transaction atomically.
   */
  async finalizeTransaction(
    transaction: CreateTransactionDTO,
  ): Promise<ProcessTransactionResult> {
    const {
      checkout_id,
      short_code,
      phone_number,
      amount: transactionAmount,
    } = transaction;
    const child = logger.child({ checkoutId: checkout_id });

    const client = await db.connect();
    let currentMetadata: any = {};

    try {
      await client.query("BEGIN");
      child.info("Started Phase-2 Database Transaction");

      // Lock and verify transaction status
      const txResult = await client.query(
        transactionQueries.lockTransactionsByCheckoutId,
        [checkout_id],
      );
      const status = txResult.rows[0]?.status;
      currentMetadata = txResult.rows[0]?.metadata || {};
      logger.info({ currentMetadata }, "[Phase 2 Metadata]");

      if (!status) {
        child.error("No transaction found for provided checkout id");
        throw new NotFoundError(
          "No transaction found for provided checkout id",
        );
      }
      if (status !== TRANSACTION_STATUS.PROCESSING) {
        child.error("Transaction is not in EXPECTED (PROCESSING) state");
        throw new InvalidStateError(
          "Transaction is not in EXPECTED (PROCESSING) state",
        );
      }

      // Lock user and check balance
      const userResult = await client.query(userQueries.lockUserByPhoneNumber, [
        phone_number,
      ]);
      const balance = userResult.rows[0]?.balance;

      if (balance === undefined) {
        child.error("No user found for provided phone number");
        throw new NotFoundError("No user found for provided phone number");
      }
      if (balance < transactionAmount) {
        child.error("User balance is less than the transaction amount");
        throw new InsufficientFundsError(
          "User balance is less than the transaction amount",
        );
      }

      // Lock merchant
      const merchantResult = await client.query(
        merchantQueries.lockMerchantByShortCode,
        [short_code],
      );
      if (merchantResult.rowCount === 0) {
        child.error("No merchant found for provided short code");
        throw new NotFoundError("No merchant found for provided short code");
      }

      // Debit and credit accounts
      await client.query(userQueries.debitUser, [
        transactionAmount,
        phone_number,
      ]);
      await client.query(merchantQueries.creditMerchant, [
        transactionAmount,
        short_code,
      ]);

      const successMetadata = JSON.stringify({
        ...currentMetadata,
        processing: {
          ...(currentMetadata.processing || {}),
          finalized_at: new Date().toISOString(),
          status: "SUCCESS",
        },
      });

      // Update status to terminal state
      await client.query(transactionQueries.markTransactionSuccess, [
        TRANSACTION_STATUS.SUCCESS,
        checkout_id,
        TRANSACTION_STATUS.PROCESSING,
        RESULT_CODES.SUCCESS,
        successMetadata,
      ]);
      child.info(
        "Completed Phase-2 Database Transaction, Status updated to terminal state SUCCESS",
      );

      await client.query("COMMIT");
      return {
        success: true,
        checkout_id,
      };
    } catch (error) {
      const resultCode = this.getResultCode(error);
      const errorMetadata = JSON.stringify({
        ...currentMetadata,
        error: {
          message: error instanceof Error ? error.message : "Unknown error",
          code: resultCode,
        },
        processing: {
          ...(currentMetadata.processing || {}),
          failed_at: new Date().toISOString(),
          status: "FAILED",
        },
      });
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        child.error({
          error: rollbackError,
          message: "Critical: Failed to rollback transaction in DB",
        });
      }

      const isTerminalBusinessError =
        error instanceof InsufficientFundsError ||
        error instanceof NotFoundError;

      const isSystemError = !(error instanceof DomainError);

      if (isTerminalBusinessError || isSystemError) {
        if (checkout_id) {
          await this.markTransactionFailed(
            checkout_id,
            TRANSACTION_STATUS.PROCESSING,
            resultCode,
            errorMetadata,
          );
          child.info("Transaction state updated to FAILED");
        }

        return {
          success: false,
          checkout_id,
        };
      }

      if (error instanceof InvalidStateError) {
        child.warn({
          error,
          message: "Transaction is in invalid state during processing",
        });
        throw error;
      }

      child.error({
        error,
        message: "Unexpected error during processing transaction.",
      });

      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Helper method to mark a transaction as failed.
   */
  async markTransactionFailed(
    checkout_id: string,
    fromStatus: TransactionStatus,
    resultCode: number,
    metadata?: string,
  ): Promise<void> {
    const child = logger.child({ checkoutId: checkout_id });
    const { FAILED } = TRANSACTION_STATUS;
    const finalMetadata =
      metadata ||
      JSON.stringify({
        processing: {
          failed_at: new Date().toISOString(),
          status: "FAILED",
        },
      });
    try {
      await db.query(transactionQueries.markTransactionFailed, [
        FAILED,
        checkout_id,
        fromStatus,
        resultCode,
        finalMetadata,
      ]);
      child.info("Transaction marked as FAILED");
    } catch (error) {
      child.error({
        error: error,
        message: "Critical: Failed to mark transaction as FAILED in DB",
      });
    }
  }

  async findUserByPhoneNumber(phone_number: string) {
    return await db.query(userQueries.findUserByPhoneNumber, [phone_number]);
  }

  async findMerchantByShortCode(short_code: string) {
    return await db.query(merchantQueries.findMerchantByShortCode, [
      short_code,
    ]);
  }

  async insertNewTransaction(
    transaction: CreateTransactionDTO,
    metadata: string,
  ) {
    const {
      checkout_id,
      external_reference,
      amount: transactionAmount,
      phone_number,
      short_code,
      merchant_request_id,
    } = transaction;

    // DB Client for transaction
    const client = await db.connect();
    let request_id = null;

    try {
      // Begin DB Transaction
      await client.query("BEGIN");

      // Insert transaction to DB
      request_id = (
        await client.query(transactionQueries.ensureTransaction, [
          checkout_id,
          external_reference,
          short_code,
          phone_number,
          transactionAmount,
          metadata,
          merchant_request_id,
        ])
      ).rows[0].request_id;

      // Insert event to outbox table
      await client.query(OutboxQueries.insertIngestionOutboxEvent, [
        OutboxAggregateType.TRANSACTION,
        checkout_id,
        transaction,
      ]);
      await client.query("COMMIT");
    } catch (error) {
      client.query("ROLLBACK");
      throw error;
    }

    return request_id;
  }

  getResultCode(error: any) {
    if (error instanceof NotFoundError) {
      return RESULT_CODES.CREDIT_ACCOUNT_INVALID;
    } else if (error instanceof InsufficientFundsError) {
      return RESULT_CODES.INSUFFICIENT_FUNDS;
    } else if (error instanceof ConflictError) {
      return RESULT_CODES.SUBSCRIBER_LOCKED;
    } else if (error instanceof InvalidStateError) {
      return RESULT_CODES.INTERNAL_FAILURE;
    } else return RESULT_CODES.GENERAL_ERROR;
  }

  async getTransactionByCheckoutId(checkout_id: string) {
    return await Query(
      transactionQueries.GetTransactionWithCallbackByCheckoutID,
      [checkout_id],
    );
  }

  async getTransactionByRequestId(request_id: string) {
    return await Query(transactionQueries.getTransactionByRequestId, [
      request_id,
    ]);
  }

  async fetchWebhookDispatch(
    data: WebhookJob,
  ): Promise<WebhookDispatch | null> {
    return (await Query(webhookQueries.fetchDispatch, [data.dispatchId]))
      .rows[0];
  }

  async insertWebHookAttempt(data: WebHookAttempt) {
    const {
      dispatch_id,
      attempt_number,
      response_status,
      response_body,
      error_message,
      duration_ms,
    } = data;
    await Query(webhookQueries.logWebhookAttempt, [
      dispatch_id,
      attempt_number,
      response_status,
      response_body,
      error_message,
      duration_ms,
    ]);
  }

  async updateTransactionMetadata(request_id: string, metadata: string) {
    return await db.query(transactionQueries.updateTransactionMetadata, [
      request_id,
      metadata,
    ]);
  }

  async listRecentTransactions(limit: number = 50) {
    const result = await db.query(transactionQueries.listRecentTransactions, [
      limit,
    ]);
    return result.rows;
  }

  async markDispatchDelivered(dispatchId: string, attemptNumber: number) {
    Query(webhookQueries.markWebhookDispatchDelivered, [
      dispatchId,
      attemptNumber,
    ]);
  }

  async markDispatchFailedPermanently(
    dispatchId: string,
    attemptNumber: number,
  ) {
    Query(webhookQueries.markWebhookDispatchFailed, [
      dispatchId,
      attemptNumber,
    ]);
  }
}
