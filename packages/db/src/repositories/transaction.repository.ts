import { transactionQueries } from "../types/transaction.queries.js";
import { userQueries } from "../types/user.queries.js";
import { merchantQueries } from "../types/merchant.queries.js";
import db from "../client.js";
import type { CreateTransactionDTO } from "@app/types";
import {
  NotFoundError,
  DomainError,
  InsufficientFundsError,
  InvalidStateError,
  ConflictError,
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

    const { PROCESSING, PENDING } = TRANSACTION_STATUS;

    // DB client to begin transaction
    const client = await db.connect();
    await client.query("BEGIN");

    try {
      // Idempotent Insert - new transaction record with PENDING status
      const txResult = await client.query(
        transactionQueries.ensureTransaction,
        [
          checkout_id,
          external_reference,
          short_code,
          phone_number,
          transactionAmount,
        ],
      );
      if (txResult.rowCount === 0) {
        await client.query("COMMIT");
        return;
      }

      // lock and fetch user
      const userResult = await client.query(userQueries.lockUserByPhoneNumber, [
        phone_number,
      ]);
      if (userResult.rowCount === 0) {
        throw new NotFoundError("User with given phone number not found");
      }

      const currentBalance = userResult.rows[0].balance;

      // Lock and fetch merchant
      const merchantResult = await client.query(
        merchantQueries.lockMerchantByShortCode,
        [short_code],
      );
      if (merchantResult.rowCount === 0) {
        throw new NotFoundError("No merchant found for provided short code");
      }

      // check user balance against transaction amount
      if (currentBalance < transactionAmount) {
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

      // Commit the transaction
      await client.query("COMMIT");
    } catch (error) {
      try {
        // Rollback the transaction
        await client.query("ROLLBACK");
      } catch (error) {
        console.error(
          `CRITICAL: Failed to rollback transaction ${checkout_id} in DB`,
          error,
        );
      }

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

    const client = await db.connect();

    try {
      await client.query("BEGIN");

      // Lock and verify transaction status
      const txResult = await client.query(
        transactionQueries.lockTransactionsByCheckoutId,
        [checkout_id],
      );
      const status = txResult.rows[0]?.status;

      if (!status) {
        throw new NotFoundError(
          "No transaction found for provided checkout id",
        );
      }
      if (status !== TRANSACTION_STATUS.PROCESSING) {
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
        throw new NotFoundError("No user found for provided phone number");
      }
      if (balance < transactionAmount) {
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
      }

      // Record FAILED state
      const isTerminalBusinessError =
        error instanceof InsufficientFundsError ||
        error instanceof NotFoundError;
      const isSystemError = !(error instanceof DomainError);

      if (isTerminalBusinessError || isSystemError) {
        if (checkout_id) {
          await this.markTransactionFailed(checkout_id);
        }
      } else if (error instanceof InvalidStateError) {
        console.warn(
          `Warning: Transaction ${checkout_id} is in invalid state during processing: ${(error as Error).message}`,
        );
      } else {
        console.error(
          `Critical: Unexpected error during processing transaction ${checkout_id}`,
          error,
        );
      }

      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Helper method to mark a transaction as failed.
   */
  private async markTransactionFailed(checkout_id: string): Promise<void> {
    try {
      await db.query(transactionQueries.markTransactionFailed, [
        TRANSACTION_STATUS.FAILED,
        checkout_id,
        TRANSACTION_STATUS.PROCESSING,
      ]);
    } catch (error) {
      console.error(
        `Critical: Failed to mark transaction ${checkout_id} as FAILED in DB`,
        error,
      );
    }
  }
}
