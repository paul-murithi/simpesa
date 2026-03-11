import type { Request, Response } from "express";
import { StkPushService } from "../services/stkPush.service.js";
import { createTransactionSchema } from "../middleware/transaction.validation.js";
import z, { string, ZodError } from "zod";
import { ConflictError, ValidationError } from "@app/utils";
import { TransactionUtils } from "../utils/transaction.utils.js";
import { logger } from "@app/utils";
import type { CreateTransactionDTO } from "@app/types";

const service = new StkPushService();
const util = new TransactionUtils();

export default async function StkPushController(req: Request, res: Response) {
  const data = service.validateStkRequest(req.body);

  // Generate Redis Fingerprint and attempt to lock
  const lock = await service.tryLockTransaction(data);

  if (!lock) {
    throw new ConflictError(
      "Duplicate transaction detected",
      "A similar transaction is already being processed. Please wait a moment before trying again.",
    );
  }

  const checkOutId = util.generateCheckoutId();
  const merchantRequestId = util.generateMerchantRequestId();

  const child = logger.child({ checkoutId: checkOutId });

  service
    .queuePaymentTask({ ...data, checkout_id: checkOutId })
    .then(() => {
      child.info(
        {
          operation: "queuePaymentTask",
          phoneNumber: data.phone_number,
          amount: data.amount,
          short_code: data.short_code,
        },
        "Transaction queued successfully",
      );
    })
    .catch(async (error) => {
      if (lock) {
        await service.releaseLock(lock.key, lock.token);
      }

      child.error(
        { err: error, operation: "queuePaymentTask", checkOutId },
        "Failed to queue payment task",
      );
    });

  return res.status(200).json({
    MerchantRequestID: merchantRequestId,
    CheckoutRequestID: checkOutId,
    ResponseCode: "0",
    ResponseDescription: "Success. Request accepted for processing",
  });
}
