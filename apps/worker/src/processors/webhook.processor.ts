import type { Job } from "bullmq";
import { WebhookService } from "../services/webhook.service.js";
import { logger } from "@app/utils";
import type { WebhookJob } from "@app/types";

const service = new WebhookService();

export const webhookProcessor = async (job: Job<WebhookJob>) => {
  const data = job.data;
  logger.info(`[Webhook processor] Received WebHook Job: ${data}`);

  // service.dispatchWebhook(data);
};
