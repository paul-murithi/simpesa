import { Queue } from "bullmq";

const queue = new Queue("my-queue", {
  connection: { host: "localhost", port: 6379 },
});

export { queue };
