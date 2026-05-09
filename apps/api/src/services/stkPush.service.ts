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

/**
 * Service for managing STK Push transaction lifecycle, including validation,
 * database persistence, concurrency control, and job queuing.
 */
export class StkPushService {
  private utils = new TransactionUtils();
  private repo = new TransactionRepository();

  /**
   * Validates the STK Push request data against the Zod schema.
   *
   * @throws {ValidationError} If the data is invalid.
   */
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

  /**
   * Inserts a new transaction into the database and publishes the initial status update.
   *
   * @async
   * @throws {NotFoundError} If the associated merchant or user is not found.
   */
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
          throw new NotFoundError(
            "Merchant with the provided short code does not exist",
          );
        }
        if (error.detail?.includes("phone_number")) {
          throw new NotFoundError(
            "User with the provided phone number does not exist",
          );
        }
        throw new NotFoundError("Merchant or User does not exist");
      }
      throw error;
    }
  }

  /**
   * Attempts to acquire an idempotent lock for a transaction in Redis based on its fingerprint.
   *
   * @async
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
   * Releases an idempotent lock in Redis.
   *
   * @async
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
   * Adds a new transaction processing job to the BullMQ queue.
   *
   * @async
   * @throws {ExternalServiceError} If the job cannot be added to the queue.
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

  /**
   * Updates a transaction's status to 'FAILED' in the database.
   *
   * @async
   */
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

  /**
   * Constructs the acknowledgement response for an STK Push initiation.
   */
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

  /**
   * Combines the original request and system identifiers into a single metadata object.
   */
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

  /**
   * Retrieves a transaction from the database by its checkout ID.
   *
   * @async
   */
  async getTransactionByCheckoutId(checkout_id: string) {
    return await this.repo.getTransactionByCheckoutId(checkout_id);
  }

  /**
   * Retrieves a user from the database by their phone number (MSISDN).
   *
   * @async
   */
  async getUserByMsisdn(msisdn: string) {
    return await this.repo.findUserByPhoneNumber(msisdn);
  }

  /**
   * Publishes a signal (e.g., 'CORRECT', 'WRONG_PIN', 'CANCELLED') to a transaction-specific Redis channel.
   * This is used to communicate between the API (PIN entry) and the Worker.
   *
   * @async
   */
  async publishPinSignal(checkout_id: string, signal: string) {
    await redisClient.publish(`pin:${checkout_id}`, signal);
  }
}
