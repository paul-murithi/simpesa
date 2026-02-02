import { Queue } from "bullmq";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  maxRetriesPerRequest: null,
};

export const paymentQueue = new Queue("payment-tasks", { connection });

export const addPaymentJob = async (checkoutId: string, data: any) => {
  return await paymentQueue.add("stk-push-request", data, {
    jobId: checkoutId,

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
