import "dotenv/config";

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379");

export function redisConnection() {
  return { host: REDIS_HOST, port: REDIS_PORT, maxRetriesPerRequest: null };
}
