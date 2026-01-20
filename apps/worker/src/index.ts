import { Worker } from "bullmq";
import db from "../../../shared/db/client.js";

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
    connection: { host: "localhost", port: 6379 },
  },
);

// events
worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});
