import type { Request, Response } from "express";
import { StkPushService } from "../services/stkPush.service.js";
import { ConflictError } from "@app/utils";
import { TransactionUtils } from "../utils/transaction.utils.js";
import { logger } from "@app/utils";
import { TRANSACTION_STATUS } from "@app/types";

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
  const acknowledgement = {
    MerchantRequestID: merchantRequestId,
    CheckoutRequestID: checkOutId,
    ResponseCode: "0",
    ResponseDescription: "Success. Request accepted for processing",
  };

  const child = logger.child({ checkoutId: checkOutId });

  // 1. Record transaction to the DB
  try {
    await service.insertTransaction({ ...data, checkout_id: checkOutId });
    child.info(
      { operation: "PaymentDBInsert" },
      "Transaction recorded successfully",
    );
  } catch (error) {
    child.error(
      { err: error, operation: "PaymentDBInsert" },
      "Abort: DB insert failed",
    );
    if (lock) await service.releaseLock(lock.key, lock.token);
    return res.status(200).json(acknowledgement);
  }

  // 2. Enqueue transaction
  try {
    await service.queuePaymentTask({ ...data, checkout_id: checkOutId });
    child.info(
      { operation: "queuePaymentTask" },
      "Transaction queued successfully",
    );
  } catch (error) {
    child.error(
      { err: error, operation: "queuePaymentTask" },
      "Enqueue failed — compensating",
    );

    await service.markTransactionFailed(checkOutId, TRANSACTION_STATUS.PENDING);
    if (lock) await service.releaseLock(lock.key, lock.token);
    return res.status(200).json(acknowledgement);
  }

  // 3. Always 200
  return res.status(200).json(acknowledgement);
}
