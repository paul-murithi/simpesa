import { transactionQueries } from "../types/transaction.queries.js";
import { userQueries } from "../types/user.queries.js";
import { merchantQueries } from "../types/merchant.queries.js";
import db from "../client.js";
import type { CreateTransactionDTO, TransactionStatus } from "@app/types";
import {
  NotFoundError,
  DomainError,
  InsufficientFundsError,
  InvalidStateError,
  logger,
} from "@app/utils";
import { TRANSACTION_STATUS } from "@app/types";

export class TransactionRepository {
  /**
   * Phase 1
   * Attempts to lock the rows and validate if balance is sufficient
   * If Success, transitions the state to processing
   */
  async lockRowsValidate(transaction: CreateTransactionDTO) {
    const {
      amount: transactionAmount,
      external_reference,
      short_code,
      phone_number,
      checkout_id,
    } = transaction;
    const child = logger.child({ checkoutId: checkout_id });

    const { PROCESSING, PENDING, SUCCESS, FAILED } = TRANSACTION_STATUS;

    // Record transaction with idempotent insert if not exists, otherwise fetch existing record to handle idempotency for already-terminal or in-flight states
    const existing = await db.query(transactionQueries.ensureTransaction, [
      checkout_id,
      external_reference,
      short_code,
      phone_number,
      transactionAmount,
    ]);

    // Handle idempotency for already-terminal or in-flight states
    if (existing.rowCount === 0) {
      const statusResult = await db.query(
        transactionQueries.getTransactionStatusByCheckoutId,
        [checkout_id],
      );
      const existingStatus = statusResult.rows[0]?.status;
      if (existingStatus === SUCCESS || existingStatus === FAILED) {
        child.error(
          `Terminal state revert attempt. Already ${existingStatus}. Ignoring.`,
        );
        return;
      }
      if (existingStatus === PROCESSING) {
        child.error(`In-flight duplicate. Currently PROCESSING. Ignoring.`);
        return;
      }
    }

    // DB client to begin transaction
    const client = await db.connect();
    await client.query("BEGIN");
    logger.info("Started Phase-1 Database Transaction");

    try {
      // lock and fetch userh
      const userResult = await client.query(userQueries.lockUserByPhoneNumber, [
        phone_number,
      ]);
      if (userResult.rowCount === 0) {
        child.error("User with given phone number not found");
        throw new NotFoundError("User with given phone number not found");
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
      await client.query(transactionQueries.markTransactionProcessing, [
        PROCESSING,
        checkout_id,
        PENDING,
      ]);
      child.info("Status updated to processing");

      // Commit the transaction
      await client.query("COMMIT");
    } catch (error) {
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
  async finalizeTransaction(transaction: CreateTransactionDTO): Promise<void> {
    const {
      checkout_id,
      external_reference,
      short_code,
      phone_number,
      amount: transactionAmount,
    } = transaction;
    const child = logger.child({ checkoutId: checkout_id });

    const client = await db.connect();

    try {
      await client.query("BEGIN");
      child.info("Started Phase-2 Database Transaction");

      // Lock and verify transaction status
      const txResult = await client.query(
        transactionQueries.lockTransactionsByCheckoutId,
        [checkout_id],
      );
      const status = txResult.rows[0]?.status;

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

      // Update status to terminal state
      await client.query(transactionQueries.markTransactionSuccess, [
        TRANSACTION_STATUS.SUCCESS,
        checkout_id,
        TRANSACTION_STATUS.PROCESSING,
      ]);

      await client.query("COMMIT");
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error(
          `Critical: Failed to rollback transaction ${checkout_id} in DB`,
          rollbackError,
        );
        child.error({
          error: error,
          message: "Critical: Failed to rollback transaction in DB",
        });
      }

      // Record FAILED state
      const isTerminalBusinessError =
        error instanceof InsufficientFundsError ||
        error instanceof NotFoundError;
      const isSystemError = !(error instanceof DomainError);

      if (isTerminalBusinessError || isSystemError) {
        if (checkout_id) {
          await this.markTransactionFailed(
            checkout_id,
            TRANSACTION_STATUS.PROCESSING,
          );
          child.info("Transaction state updated to FAILED");
        }
      } else if (error instanceof InvalidStateError) {
        child.warn({
          error: error,
          message: "Warning: Transaction is in invalid state during processing",
        });
      } else {
        child.error({
          error: error,
          message: "Critical: Unexpected error during processing transaction.",
        });
      }

      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Helper method to mark a transaction as failed.
   */
  private async markTransactionFailed(
    checkout_id: string,
    fromStatus: TransactionStatus,
  ): Promise<void> {
    const child = logger.child({ checkoutId: checkout_id });
    const { FAILED } = TRANSACTION_STATUS;
    try {
      await db.query(transactionQueries.markTransactionFailed, [
        FAILED,
        checkout_id,
        fromStatus,
      ]);
      child.info("Transaction marked as FAILED");
    } catch (error) {
      child.error({
        error: error,
        message: "Critical: Failed to mark transaction as FAILED in DB",
      });
    }
  }
}
