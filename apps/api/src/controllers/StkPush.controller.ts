import type { Request, Response, RequestHandler } from "express";
import { StkPushService } from "../services/stkPush.service.js";
import { ConflictError, ExternalServiceError, RESULT_CODES } from "@app/utils";
import { TransactionUtils } from "../utils/transaction.utils.js";
import { logger } from "@app/utils";
import {
  TRANSACTION_STATUS,
  type ApiMetadataIdentifiers,
  type ApiRequest,
  type PaymentJobPayload,
  type StampedRequest,
  type StkPushRequest,
  type StkPushResponse,
} from "@app/types";

const service = new StkPushService();
const util = new TransactionUtils();

export const StkPushController: RequestHandler<
  any,
  StkPushResponse,
  StkPushRequest
> = async (req: Request<StkPushRequest>, res) => {
  const validateRequest = service.validateStkRequest(req.body);
  const timestamp = req.timestamp!;

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
  const request: ApiRequest = {
    body: req.body,
    headers: req.headers,
    timestamp: timestamp,
  };
  const identifiers: ApiMetadataIdentifiers = {
    checkoutRequestId: checkOutId,
    merchantRequestId: merchantRequestId,
  };
  const apiPayLoad = service.buildApiPayload(request, identifiers);
  const metadata = JSON.stringify(apiPayLoad);

  const child = logger.child({ checkoutId: checkOutId });

  // Record transaction to the DB
  let request_id = null;
  try {
    request_id = await service.insertTransaction(
      {
        ...validateRequest,
        checkout_id: checkOutId,
        merchant_request_id: merchantRequestId,
      },
      metadata,
    );

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
    throw error;
  }

  // Enqueue transaction
  if (!request_id) {
    throw new ExternalServiceError(
      "An error occurred. Missing Transaction Request ID",
    );
  }
  try {
    const queueData: PaymentJobPayload = {
      ...validateRequest,
      checkout_id: checkOutId,
      transaction_id: request_id,
      merchant_request_id: merchantRequestId,
    };
    await service.queuePaymentTask(queueData);
    child.info(
      { operation: "queuePaymentTask" },
      "Transaction queued successfully",
    );
  } catch (error) {
    child.error(
      { err: error, operation: "queuePaymentTask" },
      "Enqueue failed — compensating",
    );

    if (lock) await service.releaseLock(lock.key, lock.token);
    throw new ExternalServiceError(
      "Redis Queue Failure",
      "The service was unable to process your request due to a downstream connection issue.",
    );
  }

  return res.status(200).json(acknowledgement);
};
