import { Worker, type Job } from "bullmq";
import { pool as db } from "@app/db";
import { ExternalServiceError, logger } from "@app/utils";
import type { CreateTransactionDTO } from "@app/types";
import { TransactionService } from "./services/transaction.service.js";

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379");

console.log("Worker running....Waiting for jobs");
const service = new TransactionService();

const worker = new Worker<CreateTransactionDTO, void>(
  "payment-tasks",
  async (job) => {
    const transactionalData = job.data;
    const checkout_id = job.id as string;

    if (!checkout_id)
      throw new ExternalServiceError(
        "[Worker] Missing job ID",
        "Job ID is required to process the transaction.",
      );

    const child = logger.child({ checkoutId: checkout_id });
    child.info("Worker started processing job");

    // Orchestrate the transaction processing logic
    await service.processTransaction(transactionalData);

    // TODO: Implement actual payment processing logic (DB transaction, locking, etc.)

    child.info(
      { checkoutId: checkout_id },
      "Payment processing for transaction",
    );

    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 8000));

    child.info("Worker completed processing job");
  },
  {
    connection: {
      host: REDIS_HOST,
      port: REDIS_PORT,
      maxRetriesPerRequest: null,
    },
  },
);

// events
worker.on("completed", (job: Job) => {
  logger.info(
    {
      jobId: job.id,
      checkoutId: job.data.checkout_id,
    },
    "Job completed successfully",
  );
});

worker.on("failed", (job: Job | undefined, error: Error) => {
  logger.error(
    { jobId: job?.id, err: error, checkoutId: job?.data.checkout_id },
    "Job failed",
  );
});

process.on("SIGTERM", async () => {
  await worker.close();
  await db.end();
  process.exit(0);
});
