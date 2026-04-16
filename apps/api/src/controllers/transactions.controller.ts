import type { RequestHandler } from "express";
import { TransactionRepository } from "@app/db";
import { logger } from "@app/utils";
import { redisSubscriber } from "../lib/redisClient.js";

const transactionRepository = new TransactionRepository();
const TRANSACTIONS_STREAM_CHANNEL = "transactions:updates";

export const getTransactionsController: RequestHandler = async (_req, res) => {
  try {
    const transactions = await transactionRepository.listRecentTransactions(50);

    return res.json(transactions);
  } catch (error) {
    logger.error({ error }, "Failed to fetch transactions");
    return res.status(500).json({ error: "Failed to fetch transactions" });
  }
};

export const streamTransactionsController: RequestHandler = (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const onMessage = (message: string) => {
    res.write(`data: ${message}\n\n`);
  };

  redisSubscriber
    .subscribe(TRANSACTIONS_STREAM_CHANNEL, onMessage)
    .catch((err) => {
      logger.error({ err }, "Failed to subscribe to redis channel");
    });

  req.on("close", () => {
    res.end();
  });
};
