import { Worker } from "bullmq";
import db from "../../../shared/db/client.js";
import logger from "./utils/logger.js";

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379");

console.log("Worker running....Waiting for jobs");

const worker = new Worker(
  "payment-tasks",
  async (job) => {
    const { checkoutId } = job.data;
    const child = logger.child({ checkoutId });
    child.info("Worker started processing job");

    // TODO: Fetch transaction by checkoutId
    // TODO: Implement actual payment processing logic (DB transaction, locking, etc.)

    child.info({ checkoutId }, "Payment processing for transaction");

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
worker.on("completed", (job) => {
  logger.info(
    {
      jobId: job.id,
      checkoutId: job.data.checkoutId,
    },
    "Job completed successfully",
  );
});

worker.on("failed", (job, error) => {
  logger.error(
    { jobId: job?.id, err: error, checkoutId: job?.data.checkoutId },
    "Job failed",
  );
});

process.on("SIGTERM", async () => {
  await worker.close();
  await db.end();
  process.exit(0);
});
