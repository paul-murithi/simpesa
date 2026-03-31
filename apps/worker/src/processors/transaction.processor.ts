import { UnrecoverableError, type Job } from "bullmq";
import {
  InsufficientFundsError,
  InvalidStateError,
  NotFoundError,
  getCallbackUrl,
  logger,
  payloadBuilder,
} from "@app/utils";
import type {
  CallbackPayload,
  CreateTransactionDTO,
  WebhookJob,
  WebHookJobEvent,
} from "@app/types";
import { TransactionService } from "../services/transaction.service.js";
import { addWebhookJob } from "@app/queue";
import { webhookQueries, Query } from "@app/db";
import { WebhookService } from "../services/webhook.service.js";

const service = new TransactionService();
const webHookService = new WebhookService();

export const transactionProcessor = async (
  job: Job<CreateTransactionDTO, void>,
) => {
  const transactionalData = job.data;
  const checkout_id = transactionalData.checkout_id;

  if (!checkout_id) {
    logger.error("Missing checkout_id — cannot process transaction");
    throw new UnrecoverableError(
      "[Processor] Missing checkout_id — cannot process transaction",
    );
  }

  const child = logger.child({ checkoutId: checkout_id });
  child.info("Processing transaction job");

  try {
    await service.processTransaction(transactionalData);
    const result: WebHookJobEvent = {
      checkoutId: checkout_id,
      event: "transaction.completed",
    };

    const { callback_url, payload } = await getBuiltPayload(result);

    // Insert webhook dispatch
    const dispatchId = await createWebhookDispatch(
      result,
      payload,
      callback_url,
    );

    // Enqueue
    await addWebhookJob({ dispatchId: dispatchId, event: result.event });
    child.info("[Webhook Queue] Webhook Job successfully Queued");

    child.info("Transaction processed successfully");
  } catch (error) {
    if (
      error instanceof InsufficientFundsError ||
      error instanceof NotFoundError ||
      error instanceof InvalidStateError
    ) {
      child.error({ error }, "Business error — no retry");
      const result: WebHookJobEvent = {
        checkoutId: checkout_id,
        event: "transaction.failed",
      };
      const { callback_url, payload } = await getBuiltPayload(result);

      /// Insert webhook dispatch
      const dispatchId = await createWebhookDispatch(
        result,
        payload,
        callback_url,
      );

      // Enqueue
      await addWebhookJob({ dispatchId: dispatchId, event: result.event });
      child.info("[Webhook Queue] Webhook Job successfully Queued");
      return;
    }

    child.error({ error }, "Transient error — will retry");
    throw error;
  }
};

async function getBuiltPayload(data: WebHookJobEvent) {
  const { checkoutId } = data;
  const child = logger.child({ checkoutId });

  child.info("[DB] Getting transaction Info to build Payload");
  const txResult = (await webHookService.getTransaction(data)).rows[0];

  const payload = await payloadBuilder(txResult);
  const callback_url = getCallbackUrl(txResult);
  return { payload, callback_url };
}

async function createWebhookDispatch(
  data: WebHookJobEvent,
  payload: CallbackPayload,
  callback_url: string,
) {
  const { checkoutId, event } = data;
  const child = logger.child({ checkoutId });

  child.info("[DB] Creating Webhook Dispatch");
  const dispatch_id = (
    await Query(webhookQueries.createWebhookDispatch, [
      checkoutId,
      callback_url,
      payload,
    ])
  ).rows[0].id;

  return dispatch_id;
}
