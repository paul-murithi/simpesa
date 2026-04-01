import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { webhookProcessor } from "../processors/webhook.processor.js";
import { logger } from "@app/utils";
import { WebhookService } from "../services/webhook.service.js";

const service = new WebhookService();

export const createWebhookWorker = () => {
  const worker = new Worker("webhook-tasks", webhookProcessor, {
    connection: redisConnection(),
  });

  worker.on("completed", (job) => {
    logger.info({ jobId: job.id }, "Webhook job completed");
  });

  worker.on("failed", async (job, err) => {
    if (!job) return;

    const isFinalFailure = job.attemptsMade >= (job.opts.attempts ?? 1);
    if (isFinalFailure) {
      const dispatchId = job.data.dispatchId;

      await service.markDispatchFailed(dispatchId);

      logger.error(`[Webhook] Final failure for dispatch ${dispatchId}`);
    }

    logger.error({ jobId: job?.id, err }, "Webhook job failed");
  });

  return worker;
};
