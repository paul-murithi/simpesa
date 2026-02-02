import type { Request, Response } from "express";
import { StkPushService } from "../service/stkPush.service.js";
import {
  createTransactionSchema,
  type CreateTransactionDTO,
} from "../middleware/transaction.validation.js";
import z from "zod";
import { AppError } from "../utils/errors/AppError.js";
import { TransactionUtils } from "../utils/transaction.utils.js";
import { TRANSACTION_STATUS } from "../../../../shared/db/types/base-types.js";
import { randomUUID } from "crypto";

const service = new StkPushService();
const util = new TransactionUtils();

export default async function StkPushController(req: Request, res: Response) {
  const result = createTransactionSchema.safeParse(req.body);

  if (!result.success) {
    const formattedErrors = z.treeifyError(result.error).errors;

    throw new AppError(
      400,
      "Invalid request data",
      "Check your phone_number format and ensure amount is a positive number.",
    );
  }

  const data: CreateTransactionDTO = result.data;

  // Generate Redis Fingerprint and attempt to lock
  const lock = await service.tryLockTransaction(data);

  if (!lock) {
    throw new AppError(
      429,
      "Too Many Requests",
      "Duplicate transaction detected. Please wait 60 seconds before retrying the same payload.",
    );
  }

  const checkOutId = util.generateCheckoutId();

  try {
    await service.insertTransaction(
      data,
      checkOutId,
      TRANSACTION_STATUS.PENDING,
    );
    await service.queuePaymentTask({
      checkoutId: checkOutId,
      phoneNumber: data.phone_number,
      amount: data.amount,
    });
  } catch (error) {
    // Clean up Redis key on DB failure
    if (lock) {
      await service.releaseLock(lock.key, lock.token);
    }
    console.error("Error inserting transaction:", error);
    throw new AppError(
      500,
      "Internal Server Error",
      "An error occurred while processing your transaction.",
    );
  }

  return res.json({
    MerchantRequestID: randomUUID(),
    CheckoutRequestID: checkOutId,
    ResponseCode: "0",
    ResponseDescription: "Success. Request accepted for processing",
  });
}
