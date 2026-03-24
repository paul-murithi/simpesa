import { createTransactionWorker } from "./worker/transaction.worker.js";
import { createWebhookWorker } from "./worker/webhook.worker.js";
import { logger } from "@app/utils";
import { pool as db } from "@app/db";

logger.info("Starting all workers...");

const workers = [createTransactionWorker(), createWebhookWorker()];

process.on("SIGTERM", async () => {
  logger.info("Shutting down workers...");

  await Promise.all(workers.map((w) => w.close()));
  await db.end();

  process.exit(0);
});
