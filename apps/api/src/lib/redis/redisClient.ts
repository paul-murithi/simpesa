import { createClient } from "redis";

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379");

export const redisClient = createClient({
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT,
  },
});

redisClient.on("error", (err) => console.error("[Redis] Client Error:", err));

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log(`[Redis] Connected to ${REDIS_HOST}:${REDIS_PORT}`);
  }
};

export const closeRedis = async () => {
  if (redisClient.isOpen) {
    console.log("[Redis] Closing connection...");
    await redisClient.quit();
  }
};

const handleShutdown = async () => {
  await closeRedis();
  process.exit(0);
};

process.on("SIGINT", handleShutdown);
process.on("SIGTERM", handleShutdown);
