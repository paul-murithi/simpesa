import type { Job } from "bullmq";
import { WebhookService } from "../services/webhook.service.js";
import { ExternalServiceError, logger } from "@app/utils";
import type { WebHookAttempt, WebhookJob } from "@app/types";

const service = new WebhookService();

export const webhookProcessor = async (job: Job<WebhookJob>) => {
  const data = job.data;
  logger.info(
    `[Webhook processor] Received WebHook Job: ${data.dispatchId}: ${data.event}`,
  );

  // Fetch dispatch webhook
  const dispatch = await service.fetchWebhookDispatch(data);
  if (!dispatch) {
    logger.error("Webhook Dispatch not found");
    throw new ExternalServiceError("Webhook Dispatch not found");
  }

  const dispatchId = dispatch.id;
  const child = logger.child({ dispatchId });

  child.info("Fetched Webhook Dispatch");

  const attemptNumber = job.attemptsMade + 1;

  // Send webhook
  const response = await service.dispatchWebhook(dispatch);
  child.info(`Sent Webhook Dispatch response ${response.status}`);

  // Log attempt
  const isSuccess =
    response.status && response.status >= 200 && response.status < 300;

  const webhookData: WebHookAttempt = {
    dispatch_id: dispatch.id,
    attempt_number: attemptNumber,
    response_status: response.status,
    response_body: response.body ? JSON.stringify(response.body) : undefined,
    error_message: response.error,
    duration_ms: response.duration_ms,
  };

  await service.logWebhookAttempt(webhookData);

  // result for BullMQ retrying
  if (!isSuccess) {
    const error = response.error;
    child.error({ error }, "Webhook delivery failed");
    throw new ExternalServiceError("Webhook delivery failed");
  }

  // Success delivery
  await service.markDispatchDelivered(dispatch.id);
  child.info("Delivered webhook Successfully");
};
