import { TransactionRepository, Query, pool } from "@app/db";
import type { CreateTransactionDTO } from "@app/types";
import { UserStatus } from "@app/types";
import { ConflictError, NotFoundError } from "@app/utils";
import { createClient } from "redis";

const repo = new TransactionRepository();

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379");
const PROCESSING_VISIBILITY_DELAY_MS = parseInt(
  process.env.PROCESSING_VISIBILITY_DELAY_MS || "5000",
);
const redisPublisher = createClient({
  socket: { host: REDIS_HOST, port: REDIS_PORT },
});
redisPublisher.connect().catch(console.error);

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class TransactionService {
  async publish(checkout_id: string) {
    try {
      const tx = await repo.getTransactionByCheckoutId(checkout_id);
      if (tx && tx.rows && tx.rows[0]) {
        await redisPublisher.publish(
          "transactions:updates",
          JSON.stringify(tx.rows[0]),
        );
      }
    } catch (error) {
      console.error("Failed to publish transaction update", error);
    }
  }

  /**
   * Attempts to process a transaction in multiple phases:
   * Phase 1: Lock rows and validate balance
   * Phase 2: Complete the transaction
   * @param transactionalData - Data required to process the transaction
   * @param checkoutId - Unique identifier for the transaction
   * @returns checkoutId, success - boolean
   */
  async processTransaction(transactionalData: CreateTransactionDTO) {
    const { checkout_id } = transactionalData;

    // Phase 1: Lock rows and validate balance
    await repo.lockRowsValidate(transactionalData);
    await this.publish(checkout_id);

    // Keep PROCESSING visible long enough for dashboard SSE subscribers.
    await wait(PROCESSING_VISIBILITY_DELAY_MS);

    // TODO: STK Push logic

    // Phase 2: Complete the transaction
    await repo.finalizeTransaction(transactionalData);
    await this.publish(checkout_id);
  }

  async userAndMerchantExist(short_code: string, phone_number: string) {
    const user = await repo.findUserByPhoneNumber(phone_number);
    if (user.rowCount === 0) {
      throw new NotFoundError("User with given phone number not found");
    }

    const merchant = await repo.findMerchantByShortCode(short_code);
    if (merchant.rowCount === 0) {
      throw new NotFoundError("No merchant found for provided short code");
    }

    return { user: user.rows[0], merchant: merchant.rows[0] };
  }
}
