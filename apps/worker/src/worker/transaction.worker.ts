import { Worker, UnrecoverableError, type Job } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { transactionProcessor } from "../processors/transaction.processor.js";
import { logger } from "@app/utils";

export const createTransactionWorker = () => {
  const worker = new Worker("payment-tasks", transactionProcessor, {
    connection: redisConnection(),
  });

  worker.on("completed", (job: Job) => {
    logger.info({ jobId: job.id }, "Transaction job completed");
  });

  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, err }, "Transaction job failed");
  });

  return worker;
};
