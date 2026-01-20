import { Queue } from "bullmq";

export const queue = new Queue("my-queue", {
  connection: { host: "localhost", port: 6379 },
});

// helper function to add jobs
export const addJob = async (message: string) => {
  await queue.add("insert-job", { message });
  console.log("Job added:", message);
};
