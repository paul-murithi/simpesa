import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { webhookProcessor } from "../processors/webhook.processor.js";
import { logger } from "@app/utils";

export const createWebhookWorker = () => {
  const worker = new Worker("webhook-tasks", webhookProcessor, {
    connection: redisConnection(),
  });

  worker.on("completed", (job) => {
    logger.info({ jobId: job.id }, "Webhook job completed");
  });

  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, err }, "Webhook job failed");
  });

  return worker;
};
