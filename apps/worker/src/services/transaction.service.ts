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
    await repo.finalizeTransaction(transactionalData);
  }
}
