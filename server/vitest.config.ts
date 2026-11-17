import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "dotenv";
import { defineConfig } from "vitest/config";

const testEnv = parse(
  readFileSync(resolve(process.cwd(), ".env.test")),
);

const testDatabaseUrl = testEnv.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error("TEST_DATABASE_URL is missing from .env.test");
}

const databaseName = decodeURIComponent(
  new URL(testDatabaseUrl).pathname.slice(1),
);
console.log("Environment file:", resolve(process.cwd(), ".env.test"));
console.log("Database name:", JSON.stringify(databaseName));
if (databaseName !== "coy_discover_test") {
  throw new Error(
    "Tests must use a database named coy_discover_test",
  );
}

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
    env: {
      NODE_ENV: "test",
      DATABASE_URL: testDatabaseUrl,
      CLIENT_ORIGIN: "http://localhost:5173",
    },
  },
});