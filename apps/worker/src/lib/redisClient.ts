import { createClient } from "redis";
import { logger } from "@app/utils";

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379");

export const redisPublisher = createClient({
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT,
  },
});

redisPublisher.on("error", (err: Error) =>
  logger.error({ err }, "[Redis Publisher] Error"),
);

export const connectPublisher = async () => {
  if (!redisPublisher.isOpen) {
    await redisPublisher.connect();
    logger.info(`[Redis Publisher] Connected to ${REDIS_HOST}:${REDIS_PORT}`);
  }
};

export const publishTransactionUpdate = async (transaction: any) => {
  await connectPublisher();
  await redisPublisher.publish(
    "transactions:updates",
    JSON.stringify(transaction),
  );
};
