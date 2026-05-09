import { createClient } from "redis";
import { logger } from "@app/utils";

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379");

export const redisClient = createClient({
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT,
  },
});

export const redisPublisher = createClient({
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT,
  },
});

export const redisSubscriber = createClient({
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT,
  },
});

redisClient.on("error", (err: Error) =>
  console.error("[Redis] Client Error:", err),
);
redisPublisher.on("error", (err: Error) =>
  console.error("[Redis Publisher] Error:", err),
);
redisSubscriber.on("error", (err: Error) =>
  console.error("[Redis Subscriber] Error:", err),
);

/**
 * Connects all Redis clients (main, publisher, and subscriber) to the Redis server.
 */
export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    logger.info(`[Redis] Connected to ${REDIS_HOST}:${REDIS_PORT}`);
  }
  if (!redisPublisher.isOpen) {
    await redisPublisher.connect();
  }
  if (!redisSubscriber.isOpen) {
    await redisSubscriber.connect();
  }
};

/**
 * Gracefully closes all Redis client connections.
 *
 * @async
 */
export const closeRedis = async () => {
  if (redisClient.isOpen) {
    logger.info("[Redis] Closing connection...");
    await redisClient.quit();
  }
  if (redisPublisher.isOpen) {
    await redisPublisher.quit();
  }
  if (redisSubscriber.isOpen) {
    await redisSubscriber.quit();
  }
};

/**
 * Publishes a transaction update to the 'transactions:updates' channel.
 *
 * @async
 */
export const publishTransactionUpdate = async (transaction: any) => {
  if (!redisPublisher.isOpen) {
    await redisPublisher.connect();
  }
  await redisPublisher.publish(
    "transactions:updates",
    JSON.stringify(transaction),
  );
};

const handleShutdown = async () => {
  await closeRedis();
  process.exit(0);
};

process.on("SIGINT", handleShutdown);
process.on("SIGTERM", handleShutdown);
