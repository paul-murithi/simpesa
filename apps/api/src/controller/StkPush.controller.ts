import type { Request, Response } from "express";
import { StkPushService } from "../service/stkPush.service.js";
import {
  createTransactionSchema,
  type CreateTransactionDTO,
} from "../middleware/transaction.validation.js";
import z from "zod";
import { ConflictError, ValidationError } from "../utils/errors/Errors.js";
import { TransactionUtils } from "../utils/transaction.utils.js";
import { TRANSACTION_STATUS } from "../../../../shared/db/types/base-types.js";
import { randomUUID } from "crypto";
import { logger } from "../utils/logger.js";

const service = new StkPushService();
const util = new TransactionUtils();

export default async function StkPushController(req: Request, res: Response) {
  const result = createTransactionSchema.safeParse(req.body);

  if (!result.success) {
    const formattedErrors = z.treeifyError(result.error).errors;

    throw new ValidationError(
      "Invalid request data",
      `Check your phone_number format and ensure amount is a positive number.`,
    );
  }

  const data: CreateTransactionDTO = result.data;

  // Generate Redis Fingerprint and attempt to lock
  const lock = await service.tryLockTransaction(data);

  if (!lock) {
    throw new ConflictError(
      "Duplicate transaction detected",
      "A similar transaction is already being processed. Please wait a moment before trying again.",
    );
  }

  const checkOutId = util.generateCheckoutId();
  const child = logger.child({ checkoutId: checkOutId });

  try {
    await service.insertTransaction(
      data,
      checkOutId,
      TRANSACTION_STATUS.PENDING,
    );
    await service.queuePaymentTask(checkOutId);

    // Logger - Success
    child.info(
      {
        operation: "insertTransaction and queuePaymentTask",
        phoneNumber: data.phone_number,
        amount: data.amount,
        short_code: data.short_code,
      },
      "Transaction Inserted and queued successfully",
    );
  } catch (error) {
    // Clean up Redis key on DB failure
    if (lock) {
      await service.releaseLock(lock.key, lock.token);
    }

    // logger - Error
    child.error(
      { err: error, operation: "insertTransaction or queuePaymentTask" },
      "Error inserting transaction",
    );

    throw error;
  }

  return res.json({
    MerchantRequestID: randomUUID(),
    CheckoutRequestID: checkOutId,
    ResponseCode: "0",
    ResponseDescription: "Success. Request accepted for processing",
  });
}
