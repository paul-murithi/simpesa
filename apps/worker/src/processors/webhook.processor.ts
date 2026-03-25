import type { Job } from "bullmq";
import { WebhookService } from "../services/webhook.service.js";
import { logger } from "@app/utils";

const service = new WebhookService();

export const webhookProcessor = async (job: Job) => {
  const data = job.data;
  logger.info(data);

  await service.dispatchWebhook(data);
};
