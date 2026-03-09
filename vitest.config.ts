import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./packages/test/src/setup.ts"],
    environment: "node",
    include: ["packages/test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["apps/worker/src/**/*.ts", "packages/db/src/**/*.ts"],
    },
  },
});
