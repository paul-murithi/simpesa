import { UnrecoverableError, Worker, type Job } from "bullmq";
import { pool as db } from "@app/db";
import {
  InsufficientFundsError,
  InvalidStateError,
  logger,
  NotFoundError,
} from "@app/utils";
import type { CreateTransactionDTO } from "@app/types";
import { TransactionService } from "./services/transaction.service.js";

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379");

logger.info("Worker is starting...");

const service = new TransactionService();

const worker = new Worker<CreateTransactionDTO, void>(
  "payment-tasks",
  async (job) => {
    const transactionalData = job.data;
    const checkout_id = job.id as string;

    if (!checkout_id) {
      logger.error("Job is missing checkout_id, cannot process transaction.");
      throw new UnrecoverableError(
        "[Worker] Job is missing checkout_id, cannot process transaction.",
      );
    }

    const child = logger.child({ checkoutId: checkout_id });
    child.info("Worker started processing job");

    // Orchestrate the transaction processing logic
    try {
      await service.processTransaction(transactionalData);
    } catch (error) {
      if (
        error instanceof InsufficientFundsError ||
        error instanceof NotFoundError ||
        error instanceof InvalidStateError
      ) {
        child.error(
          { error },
          "Unrecoverable business error — skipping retries",
        );
        throw new UnrecoverableError((error as Error).message);
      }
      // Transient errors for BullMQ retry
      throw error;
    }

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
    { jobId: job?.id, error: error.message, checkoutId: job?.data.checkout_id },
    "Job failed",
  );
});

process.on("SIGTERM", async () => {
  await worker.close();
  await db.end();
  process.exit(0);
});
