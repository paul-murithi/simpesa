import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import db from "./client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Migration {
  version: number;
  name: string | undefined;
  sql: string;
}

/**
 * Load all migration files from the migrations directory
 */
function loadMigrations(): Migration[] {
  const migrationsDir = join(__dirname, "migrations");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  return files.map((file) => {
    const match = file.match(/^(\d+)_(.+)\.sql$/);
    if (!match) {
      throw new Error(`Invalid migration filename: ${file}`);
    }

    const version = parseInt(match[1]!, 10);
    const name = match[2]!;
    const sql = readFileSync(join(migrationsDir, file), "utf-8");

    return { version, name, sql };
  });
}

/**
 * Get list of already-applied migrations
 */
async function getAppliedMigrations(): Promise<Set<number>> {
  try {
    const { rows } = await db.query(
      "SELECT migration_version FROM schema_migrations ORDER BY migration_version",
    );

    return new Set(rows.map((r) => r.migration_version));
  } catch (err) {
    return new Set();
  }
}

/**
 * Run pending migrations
 */
export async function runMigrations(): Promise<void> {
  console.log("Running database migrations...\n");

  // Create schema_migrations table if it doesnt exist
  const schemaSql = readFileSync(
    join(__dirname, "schema_migrations.sql"),
    "utf-8",
  );
  await db.query(schemaSql);

  const migrations = loadMigrations();
  const applied = await getAppliedMigrations();

  const pending = migrations.filter((m) => !applied.has(m.version));

  // No pending migrations
  if (pending.length === 0) {
    console.log("Database is up to date. No migrations to run.\n");
    return;
  }

  // Apply pending migrations
  console.log(`Found ${pending.length} pending migration(s)\n`);

  for (const migration of pending) {
    console.log(`Applying ${migration.version}_${migration.name}....`);

    const client = await db.connect();
    try {
      await client.query("BEGIN");

      // Apply migration SQL
      await client.query(migration.sql);
      await client.query(
        "INSERT INTO schema_migrations (migration_version, name) VALUES ($1, $2)",
        [migration.version, migration.name],
      );

      await client.query("COMMIT");
      console.log(`Applied ${migration.version}_${migration.name}\n`);
    } catch (err) {
      await client.query("ROLLBACK");

      console.error(`Failed to apply ${migration.version}_${migration.name}`);
      console.error(err);
      throw err;
    } finally {
      client.release();
    }
  }

  console.log("=======All migrations completed successfully!\n=========");
}

/**
 * Rollback last migration
 */
export async function rollbackLastMigration(): Promise<void> {
  const { rows } = await db.query(
    "SELECT migration_version, name FROM schema_migrations ORDER BY migration_version DESC LIMIT 1",
  );

  if (rows.length === 0) {
    console.log("No migrations to rollback.");
    return;
  }

  const { version, name } = rows[0];
  console.log(`Rolling back ${version}_${name}...`);

  // TODO: Create down migrations
  await db.query("DELETE FROM schema_migrations WHERE migration_version = $1", [
    version,
  ]);

  console.log(`Rolled back ${version}_${name}`);
}

// For CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  if (command === "up") {
    runMigrations()
      .then(() => process.exit(0))
      .catch((err) => {
        console.error(err);
        process.exit(1);
      });
  } else if (command === "rollback") {
    rollbackLastMigration()
      .then(() => process.exit(0))
      .catch((err) => {
        console.error(err);
        process.exit(1);
      });
  } else {
    console.log("Usage: tsx migration-runner.ts [up|rollback]");
    process.exit(1);
  }
}
