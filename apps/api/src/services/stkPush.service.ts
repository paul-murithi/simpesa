import { TransactionRepository } from "@app/db";
import { TransactionUtils } from "../utils/transaction.utils.js";
import { redisClient } from "../lib/redisClient.js";
import { randomUUID } from "crypto";
import { addPaymentJob } from "@app/queue";
import { ExternalServiceError } from "@app/utils";
import type { CreateTransactionDTO } from "@app/types";
import { logger } from "@app/utils";

export class StkPushService {
  private utils = new TransactionUtils();

  /**
   * Attempts to lock a fingerprint in Redis.
   * Returns true if successful (new), false if already exists (duplicate).
   */
  async tryLockTransaction(
    data: CreateTransactionDTO,
  ): Promise<null | { key: string; token: string }> {
    const hash = this.utils.generateRedisFingerprint(data);
    const key = `fp:${hash}`;
    const token = randomUUID();

    const result = await redisClient.set(key, token, {
      condition: "NX",
      expiration: { type: "EX", value: 60 },
    });

    if (result === null) {
      return null;
    }

    return { key, token };
  }

  /**
   * Deletes a Key from Redis in case of Transaction failure
   */
  async releaseLock(key: string, token: string): Promise<void> {
    await redisClient.eval(
      `
    if redis.call("GET", KEYS[1]) == ARGV[1] then
      return redis.call("DEL", KEYS[1])
    else
      return 0
    end
    `,
      {
        keys: [key],
        arguments: [token],
      },
    );
  }

  /**
   *Adds a new job to the queue for processing STK Push payment
   * @param data - Transaction request received from the user
   */
  async queuePaymentTask(transaction: CreateTransactionDTO) {
    const childLogger = logger.child({ checkoutId: transaction.checkout_id });
    try {
      await addPaymentJob(transaction);
      childLogger.info("[Queue] Job queued for Checkout");
    } catch (error) {
      childLogger.error({
        error: error,
        message: "Failed to queue payment job",
      });
      throw new ExternalServiceError(
        "Failed to queue payment job",
        error,
        "An error occurred while queuing the payment job.",
      );
    }
  }
}
