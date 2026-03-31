import type { Job } from "bullmq";
import { WebhookService } from "../services/webhook.service.js";
import { ExternalServiceError, logger } from "@app/utils";
import type { WebhookJob } from "@app/types";

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

  logger.info({ dispatch }, "Fetched Webhook Dispatch");

  // Send webhook
  const response = await service.dispatchWebhook(dispatch);
};
