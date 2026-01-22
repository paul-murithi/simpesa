import { Queue } from "bullmq";

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379");

// DEBUG LOGS
console.log(
  `[Queue Debug] Attempting to connect to Redis at: ${REDIS_HOST}:${REDIS_PORT}`,
);
if (REDIS_HOST === "localhost") {
  console.warn("[Queue Warning] REDIS_HOST is falling back to localhost!");
}

export const queue = new Queue("my-queue", {
  connection: {
    host: REDIS_HOST,
    port: REDIS_PORT,
    family: 4,
  },
});

export const addJob = async (message: string) => {
  await queue.add("insert-job", { message });
  console.log("Job added:", message);
};
