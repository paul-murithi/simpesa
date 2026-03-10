import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./packages/test/src/setup.ts"],
    environment: "node",
    include: ["packages/test/**/*.test.ts"],
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
