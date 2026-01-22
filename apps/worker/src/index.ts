import { Worker } from "bullmq";
import db from "../../../shared/db/client.js";

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379");

const worker = new Worker(
  "my-queue",
  async (job) => {
    console.log("Processing job:", job.data);
    await db.query(
      "INSERT INTO test_jobs(message, created_at) VALUES($1, $2)",
      [job.data.message, new Date()],
    );
    return { status: "done" };
  },
  {
    connection: { host: REDIS_HOST, port: REDIS_PORT },
  },
);

// events
worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});
