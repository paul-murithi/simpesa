import type { Job } from "bullmq";
import { WebhookService } from "../services/webhook.service.js";

const service = new WebhookService();

export const webhookProcessor = async (job: Job) => {
  const data = job.data;

  await service.dispatchWebhook(data);
};
