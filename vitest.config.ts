import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    pool: "vmThreads",
    maxConcurrency: 1,
    setupFiles: ["./vitest.setup.ts"],
  },
});
