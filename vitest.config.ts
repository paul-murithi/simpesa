// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "apps/api": path.resolve(__dirname, "apps/api/src"),
      "apps/worker": path.resolve(__dirname, "apps/worker/src"),
      "@app/db": path.resolve(__dirname, "packages/db/src"),
      "@app/queue": path.resolve(__dirname, "packages/queue/src"),
      "@app/types": path.resolve(__dirname, "packages/types/src"),
      "@app/utils": path.resolve(__dirname, "packages/utils/src"),
    },
  },
  test: {
    setupFiles: ["./packages/test/src/setup.ts"],
    sequence: {
      concurrent: false,
    },
    environment: "node",
    include: ["packages/test/**/*.test.ts"],
    reporters: ["verbose"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      include: ["apps/**/src/**/*.ts", "packages/**/src/**/*.ts"],
      exclude: [
        "**/*.test.ts",
        "**/*.d.ts",
        "packages/test/**",
        "node_modules/**",
        "coverage/**",
      ],
    },
  },
});
