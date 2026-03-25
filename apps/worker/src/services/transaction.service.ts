import { TransactionRepository, Query, pool } from "@app/db";
import type { CreateTransactionDTO } from "@app/types";
import { UserStatus } from "@app/types";
import { ConflictError, NotFoundError } from "@app/utils";

const repo = new TransactionRepository();
export class TransactionService {
  /**
   * Attempts to process a transaction in multiple phases:
   * Phase 1: Lock rows and validate balance
   * Phase 2: Complete the transaction
   * @param transactionalData - Data required to process the transaction
   * @param checkoutId - Unique identifier for the transaction
   * @returns checkoutId, success - boolean
   */
  async processTransaction(transactionalData: CreateTransactionDTO) {
    // Phase 1: Lock rows and validate balance
    await repo.lockRowsValidate(transactionalData);

    // TODO: STK Push logic

    // Phase 2: Complete the transaction
    const { checkout_id, success } =
      await repo.finalizeTransaction(transactionalData);

    return {
      checkout_id,
      success,
    };
  }

  async userAndMerchantExist(short_code: string, phone_number: string) {
    const { BLOCKED, INACTIVE } = UserStatus;
    const userResult = await repo.findUserByPhoneNumber(phone_number);
    if (userResult.rowCount === 0) {
      throw new NotFoundError(
        `User with phone number ${phone_number} not found`,
      );
    }
    const accountStatus = userResult.rows[0].status;

    if (accountStatus === BLOCKED || accountStatus === INACTIVE) {
      throw new ConflictError(`
        User with phone number ${phone_number} account is not active
        `);
    }

    const merchantResult = await repo.findMerchantByShortCode(short_code);
    if (merchantResult.rowCount === 0) {
      throw new NotFoundError(
        `Merchant with short code ${short_code} not found`,
      );
    }

    return {
      user: userResult.rows[0],
      merchant: merchantResult.rows[0],
    };
  }
}
