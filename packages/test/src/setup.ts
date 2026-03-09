// packages/test/src/setup.ts
import { beforeAll, afterAll } from "vitest";
import { pool } from "@app/db";

beforeAll(async () => {
  if (!process.env.TEST_DATABASE_URL) {
    throw new Error("TEST_DATABASE_URL must be set for tests");
  }
  console.log("🧪 Using test database:", process.env.TEST_DATABASE_URL);
});

afterAll(async () => {
  console.log({
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
  });
}, 30000);
