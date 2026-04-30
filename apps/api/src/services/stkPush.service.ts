import { TransactionUtils } from "../utils/transaction.utils.js";
import { redisClient, publishTransactionUpdate } from "../lib/redisClient.js";
import { randomUUID } from "crypto";
import { addPaymentJob } from "@app/queue";
import {
  ExternalServiceError,
  NotFoundError,
  ValidationError,
} from "@app/utils";
import {
  type ApiMetadataIdentifiers,
  type ApiRequest,
  type ApiTransactionMetadata,
  type CreateTransactionDTO,
  type CreateTransactionRequestDTO,
  type PaymentJobPayload,
  type StkPushResponse,
  type TransactionStatus,
} from "@app/types";
import { logger } from "@app/utils";
import { createTransactionSchema } from "../middleware/transaction.validation.js";
import { TransactionRepository } from "@app/db";

export class StkPushService {
  private utils = new TransactionUtils();
  private repo = new TransactionRepository();

  validateStkRequest(
    data: CreateTransactionRequestDTO,
  ): CreateTransactionRequestDTO {
    const result = createTransactionSchema.safeParse(data);

    if (!result.success) {
      logger.error("Invalid request data");
      throw new ValidationError("Invalid request data");
    }
    return result.data;
  }

  async insertTransaction(transaction: CreateTransactionDTO, metadata: string) {
    try {
      const request_id = await this.repo.insertNewTransaction(
        transaction,
        metadata,
      );

      // Publish the initial status
      const tx = await this.repo.getTransactionByCheckoutId(
        transaction.checkout_id,
      );
      if (tx.rows[0]) {
        await publishTransactionUpdate(tx.rows[0]);
      }

      return request_id;
    } catch (error: any) {
      if (error.code === "23503") {
        if (error.detail?.includes("short_code")) {
          throw new NotFoundError("Merchant with the provided short code does not exist");
        }
        if (error.detail?.includes("phone_number")) {
          throw new NotFoundError("User with the provided phone number does not exist");
        }
        throw new NotFoundError("Merchant or User does not exist");
      }
      throw error;
    }
  }

  /**
   * Attempts to lock a fingerprint in Redis.
   * Returns true if successful (new), false if already exists (duplicate).
   */
  async tryLockTransaction(
    data: CreateTransactionRequestDTO,
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
  async queuePaymentTask(transaction: PaymentJobPayload) {
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

  async markTransactionFailed(
    checkout_id: string,
    fromStatus: TransactionStatus,
    resultCode: number,
  ) {
    return await this.repo.markTransactionFailed(
      checkout_id,
      fromStatus,
      resultCode,
    );
  }

  createStkPushResponse(
    merchantRequestId: string,
    checkoutRequestId: string,
  ): StkPushResponse {
    return {
      MerchantRequestID: merchantRequestId,
      CheckoutRequestID: checkoutRequestId,
      ResponseCode: "0",
      ResponseDescription: "Success. Request accepted for processing",
    };
  }

  buildApiPayload(
    request: ApiRequest,
    identifiers: ApiMetadataIdentifiers,
  ): ApiTransactionMetadata {
    const metadata = {
      request: request,
      identifiers: identifiers,
    };

    return metadata;
  }

  async getTransactionByCheckoutId(checkout_id: string) {
    return await this.repo.getTransactionByCheckoutId(checkout_id);
  }

  async getUserByMsisdn(msisdn: string) {
    return await this.repo.findUserByPhoneNumber(msisdn);
  }

  async publishPinSignal(checkout_id: string, signal: string) {
    await redisClient.publish(`pin:${checkout_id}`, signal);
  }
}
