import { defineConfig } from "vitest/config";
import path from "path";

const integrationTestFiles = [
  "tests/attendance.test.ts",
  "tests/calendar.test.ts",
  "tests/course.test.ts",
  "tests/document.test.ts",
  "tests/grade-homework.test.ts",
  "tests/payos-webhook.integration.test.ts",
  "tests/quiz.test.ts",
  "tests/schedule-series.integration.test.ts",
  "tests/schedule.test.ts",
  "tests/tuition-credit.integration.test.ts",
  "tests/tuition-refactor.integration.test.ts",
  "tests/tuition.test.ts",
  "**/*.integration.test.ts",
];

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: integrationTestFiles,
    setupFiles: ["tests/setup.integration.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
