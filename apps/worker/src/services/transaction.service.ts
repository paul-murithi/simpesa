import { TransactionRepository, Query, pool } from "@app/db";
import type { CreateTransactionDTO } from "@app/types";
import { TRANSACTION_STATUS, UserStatus } from "@app/types";
import {
  ConflictError,
  logger,
  NotFoundError,
  PIN_TIMEOUT_MS,
} from "@app/utils";
import { createClient } from "redis";
import { publishTransactionUpdate } from "../lib/redisClient.js";

const repo = new TransactionRepository();

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379");
const PROCESSING_VISIBILITY_DELAY_MS = parseInt(
  process.env.PROCESSING_VISIBILITY_DELAY_MS || "5000",
);

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class TransactionService {
  async publish(checkout_id: string) {
    try {
      const tx = await repo.getTransactionByCheckoutId(checkout_id);
      if (tx && tx.rows && tx.rows[0]) {
        await publishTransactionUpdate(tx.rows[0]);
      }
    } catch (error) {
      console.error("Failed to publish transaction update", error);
    }
  }

  private async waitForPin(
    checkout_id: string,
    timeoutMs: number,
  ): Promise<string> {
    const subscriber = createClient({
      socket: { host: REDIS_HOST, port: REDIS_PORT },
    });
    await subscriber.connect();

    return new Promise((resolve, reject) => {
      const channel = `pin:${checkout_id}`;
      let timeout: NodeJS.Timeout;

      const cleanup = async () => {
        clearTimeout(timeout);
        try {
          await subscriber.unsubscribe(channel);
          await subscriber.quit();
        } catch (err) {
          logger.error({ err }, "Error during cleanup in waitForPin");
        }
      };

      timeout = setTimeout(async () => {
        await cleanup();
        resolve("TIMEOUT");
      }, timeoutMs);

      subscriber.subscribe(channel, async (message) => {
        await cleanup();
        resolve(message);
      });
    });
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

    // Start waiting for PIN BEFORE publishing status to UI
    // to avoid race condition where UI sends PIN before worker is listening.
    const pinPromise = this.waitForPin(checkout_id, PIN_TIMEOUT_MS);

    await this.publish(checkout_id);

    // Keep PROCESSING visible long enough for dashboard SSE subscribers.
    await wait(PROCESSING_VISIBILITY_DELAY_MS);

    // Wait for PIN signal from Redis
    const pinResult = await pinPromise;

    switch (pinResult) {
      case "CORRECT":
        // Phase 2: Complete the transaction
        await repo.finalizeTransaction(transactionalData);
        break;
      case "WRONG_PIN":
        await repo.markTransactionFailed(
          checkout_id,
          TRANSACTION_STATUS.PROCESSING,
          2001,
        );
        break;
      case "CANCELLED":
        await repo.markTransactionFailed(
          checkout_id,
          TRANSACTION_STATUS.PROCESSING,
          1032,
        );
        break;
      case "TIMEOUT":
        await repo.markTransactionFailed(
          checkout_id,
          TRANSACTION_STATUS.PROCESSING,
          1037,
        );
        break;
      default:
        await repo.markTransactionFailed(
          checkout_id,
          TRANSACTION_STATUS.PROCESSING,
          1037,
        );
    }

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

  async getTransactionByCheckoutId(checkout_id: string) {
    return await repo.getTransactionByCheckoutId(checkout_id);
  }

  async updateTransactionMetadata(request_id: string, metadata: string) {
    return await repo.updateTransactionMetadata(request_id, metadata);
  }
}
