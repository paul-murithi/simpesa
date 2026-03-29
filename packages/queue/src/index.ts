import { Queue } from "bullmq";
import type { CreateTransactionDTO, WebhookJob } from "@app/types";
import { logger } from "@app/utils";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  maxRetriesPerRequest: null,
};

export const paymentQueue = new Queue("payment-tasks", { connection });
export const webhookQueue = new Queue("webhook-tasks", { connection });

export const addPaymentJob = async (transaction: CreateTransactionDTO) => {
  return await paymentQueue.add("stk-push-request", transaction, {
    ...(transaction.checkout_id && { jobId: transaction.checkout_id }),

    // Cleanup
    removeOnComplete: { age: 3600, count: 1000 },
    removeOnFail: { age: 86400 }, // 24H

    // Re-try count (3) for worker
    attempts: 3,
    backoff: {
      type: "exponential",
      //exponential backoff delay
      delay: 1000,
    },
  });
};

export const addWebhookJob = async (job: WebhookJob) => {
  return await webhookQueue.add("send-webhook", job, {
    jobId: `${job.dispatchId}-${job.event}`,

    removeOnComplete: { age: 3600, count: 1000 },
    removeOnFail: { age: 86400 },

    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  });
};
