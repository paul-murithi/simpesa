import { TransactionRepository } from "../../../../shared/db/repositories/transaction.repository.js";
import {
  TRANSACTION_STATUS,
  type TransactionStatus,
} from "../../../../shared/db/types/base-types.js";
import { TransactionUtils } from "../utils/transaction.utils.js";
import type { CreateTransactionDTO } from "../middleware/transaction.validation.js";
import { redisClient } from "../lib/redis/redisClient.js";
import { transactionQueries } from "../../../../shared/db/types/transaction.queries.js";
import db from "../../../../shared/db/client.js";
import { randomUUID } from "crypto";

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
}
