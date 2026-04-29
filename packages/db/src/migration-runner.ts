import { existsSync, readFileSync, readdirSync } from "fs";
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

interface RunMigrationsOptions {
  seedOnFreshDatabase?: boolean;
}

function resolveAssetPath(...candidates: string[]): string {
  const existingPath = candidates.find((candidate) => existsSync(candidate));

  if (!existingPath) {
    throw new Error(
      `Unable to resolve asset path from: ${candidates.join(", ")}`,
    );
  }

  return existingPath;
}

const migrationsDir = resolveAssetPath(
  join(__dirname, "migrations"),
  join(__dirname, "..", "src", "migrations"),
);

const schemaFilePath = resolveAssetPath(
  join(__dirname, "schema_migrations.sql"),
  join(__dirname, "..", "src", "schema_migrations.sql"),
);

/**
 * Load all migration files from the migrations directory
 */
function loadMigrations(): Migration[] {
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
 * Seed development fixtures
 */
export async function seedDevelopmentData(): Promise<void> {
  console.log("Seeding development data...\n");

  // To resolve seed file from common build/source locations
  let seedSql: string;
  try {
    const seedPath = resolveAssetPath(
      join(__dirname, "..", "..", "..", "scripts", "seed-dev-data.sql"),
      join(__dirname, "..", "..", "..", "src", "scripts", "seed-dev-data.sql"),
    );

    seedSql = readFileSync(seedPath, "utf-8").trim();
  } catch (err) {
    console.log("Seed file not found; skipping development data seed.\n");
    return;
  }

  if (!seedSql) {
    console.log("Seed file is empty. Skipping development data seed.\n");
    return;
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");
    await client.query(seedSql);
    await client.query("COMMIT");
    console.log("Development data seeded successfully!\n");
  } catch (err) {
    await client.query("ROLLBACK");

    console.error("Failed to seed development data");
    console.error(err);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Run pending migrations
 */
export async function runMigrations(
  options: RunMigrationsOptions = {},
): Promise<void> {
  const { seedOnFreshDatabase = true } = options;

  console.log("Running database migrations...\n");

  // Create schema_migrations table if it doesnt exist
  const schemaSql = readFileSync(schemaFilePath, "utf-8");
  await db.query(schemaSql);

  const migrations = loadMigrations();
  const applied = await getAppliedMigrations();
  const isFreshDatabase = applied.size === 0;

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
    } catch (err: any) {
      await client.query("ROLLBACK");

      // If this migration failed because an index or object already exists,
      // mark the migration as applied and continue. This handles cases where
      // the DB contains partial artifacts but the migration wasn't recorded.
      const msg = String(err?.message ?? "").toLowerCase();
      const isDuplicate =
        err?.code === "42P07" ||
        msg.includes("already exists") ||
        msg.includes("duplicate_object");

      if (isDuplicate) {
        console.warn(
          `Migration ${migration.version}_${migration.name} reported duplicate object; marking as applied and continuing.`,
        );
        try {
          // Record as applied to avoid retrying
          await db.query(
            "INSERT INTO schema_migrations (migration_version, name) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [migration.version, migration.name],
          );
          console.log(
            `Marked ${migration.version}_${migration.name} as applied (duplicate ignored)\n`,
          );
          continue;
        } catch (insErr) {
          console.error(
            "Failed to record migration after duplicate-object handling",
            insErr,
          );
          throw err;
        }
      }

      console.error(`Failed to apply ${migration.version}_${migration.name}`);
      console.error(err);
      throw err;
    } finally {
      client.release();
    }
  }

  console.log("=======All migrations completed successfully!\n=========");

  if (isFreshDatabase && seedOnFreshDatabase) {
    await seedDevelopmentData();
  }
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
  } else if (command === "seed") {
    seedDevelopmentData()
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
    console.log("Usage: tsx migration-runner.ts [up|seed|rollback]");
    process.exit(1);
  }
}
