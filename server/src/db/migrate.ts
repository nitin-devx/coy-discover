import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pool } from "./pool.js";

async function migrate(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const directory = path.resolve(process.cwd(), "migrations");

    const files = (await readdir(directory))
      .filter((filename) => filename.endsWith(".sql"))
      .sort();

    for (const filename of files) {
      const existing = await client.query(
        "SELECT filename FROM schema_migrations WHERE filename = $1",
        [filename],
      );

      if (existing.rows.length > 0) {
        console.log(`Already applied: ${filename}`);
        continue;
      }

      const sql = await readFile(path.join(directory, filename), "utf8");

      await client.query("BEGIN");

      try {
        await client.query(sql);

        await client.query(
          "INSERT INTO schema_migrations (filename) VALUES ($1)",
          [filename],
        );

        await client.query("COMMIT");
        console.log(`Applied: ${filename}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    client.release();
  }
}

migrate()
  .catch((error: unknown) => {
    console.error(
      "Migration failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });