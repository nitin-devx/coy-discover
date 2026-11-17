import "dotenv/config";
import { app } from "./app.js";
import { pool } from "./db/pool.js";

const port = Number(process.env.PORT ?? 4000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535");
}

async function startServer(): Promise<void> {
  await pool.query("SELECT 1");

  console.log("Connected to Neon PostgreSQL");

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

startServer().catch(async (error: unknown) => {
  console.error(
    "Failed to start server:",
    error instanceof Error ? error.message : "Unknown error",
  );

  await pool.end();
  process.exitCode = 1;
});