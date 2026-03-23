import type { Request, Response, RequestHandler } from "express";
import { StkPushService } from "../services/stkPush.service.js";
import { ConflictError } from "@app/utils";
import { TransactionUtils } from "../utils/transaction.utils.js";
import { logger } from "@app/utils";
import {
  TRANSACTION_STATUS,
  type StkPushRequest,
  type StkPushResponse,
} from "@app/types";

const service = new StkPushService();
const util = new TransactionUtils();

export const StkPushController: RequestHandler<
  any,
  StkPushResponse,
  StkPushRequest
> = async (req, res) => {
  const validateRequest = service.validateStkRequest(req.body);

  // Generate Redis Fingerprint and attempt to lock
  const lock = await service.tryLockTransaction(validateRequest);

  if (!lock) {
    throw new ConflictError(
      "Duplicate transaction detected",
      "A similar transaction is already being processed. Please wait a moment before trying again.",
    );
  }

  const checkOutId = util.generateCheckoutId();
  const merchantRequestId = util.generateMerchantRequestId();
  const acknowledgement = service.createStkPushResponse(
    merchantRequestId,
    checkOutId,
  );

  const child = logger.child({ checkoutId: checkOutId });

  // Record transaction to the DB
  try {
    await service.insertTransaction({
      ...validateRequest,
      checkout_id: checkOutId,
    });
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

  // Enqueue transaction
  try {
    await service.queuePaymentTask({
      ...validateRequest,
      checkout_id: checkOutId,
    });
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

  return res.status(200).json(acknowledgement);
};
