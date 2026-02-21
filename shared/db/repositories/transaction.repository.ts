import { transactionQueries } from "../types/transaction.queries.js";
import { userQueries } from "../types/user.queries.js";
import { merchantQueries } from "../types/merchant.queries.js";
import db from "../../db/client.js";
import type { Merchant, Transaction, User } from "../types/base-types.js";
import { AppError } from "../utils/AppError.js";
import { TRANSACTION_STATUS } from "../types/base-types.js";

export class TransactionRepository {
  async insertNewTransaction(params: {
    checkoutId: string;
    externalReference: string;
    shortCode: string;
    phoneNumber: string;
    amount: number;
    status: string;
  }) {
    const values = [
      params.checkoutId,
      params.externalReference,
      params.shortCode,
      params.phoneNumber,
      params.amount,
    ];

    const result = await db.query(transactionQueries.ensureTransaction, values);
    return result.rows[0];
  }

  /**
   * Phase 1
   * Attempts to lock the rows and validate if balance is sufficient
   * If Success, transitions the state to processing
   * TODO: Implement Phase 2 after PIN input and finalize payment
   */
  async lockRowsValidate(params: {
    merchant: Merchant;
    user: User;
    transaction: Transaction;
  }) {
    const { phone_number } = params.user;
    const { short_code } = params.merchant;
    const { amount: transactionAmount, checkout_id } = params.transaction;
    const { PROCESSING, PENDING } = TRANSACTION_STATUS;

    // Create the DB client and begin a transaction
    const client = await db.connect();
    await client.query("BEGIN");

    try {
      // lock and fetch user
      const userResult = await client.query(userQueries.lockUserByPhoneNumber, [
        phone_number,
      ]);
      if (userResult.rowCount === 0) {
        throw new AppError(
          404,
          "User not found",
          "No user found for provided phone number",
        );
      }

      const currentBalance = userResult.rows[0].balance;

      // Lock and fetch merchant
      const merchantResult = await client.query(
        merchantQueries.lockMerchantByShortCode,
        [short_code],
      );
      if (merchantResult.rowCount === 0) {
        throw new AppError(
          404,
          "Merchant not found",
          "No merchant found for provided short code",
        );
      }

      // check user balance against transaction amount
      if (currentBalance < transactionAmount) {
        throw new AppError(
          400,
          "Insufficient funds",
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
      // Rollback the transaction
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
