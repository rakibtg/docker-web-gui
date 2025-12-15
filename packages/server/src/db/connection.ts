import knex, { Knex } from "knex";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";

const dataDir = join(__dirname, "../../data");
const databasePath = join(dataDir, "logs.sqlite");
const migrationsDir = join(__dirname, "migrations");

let knexInstance: Knex | null = null;
let migrationPromise: Promise<void> | null = null;

function ensureDataDir() {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
}

export function getDatabase(): Knex {
  if (!knexInstance) {
    ensureDataDir();
    knexInstance = knex({
      client: "better-sqlite3",
      connection: {
        filename: databasePath,
      },
      useNullAsDefault: true,
      pool: {
        min: 1,
        max: 1,
      },
    });
  }

  return knexInstance;
}

export async function initializeDatabase(): Promise<void> {
  if (!migrationPromise) {
    const db = getDatabase();
    migrationPromise = db.migrate
      .latest({ directory: migrationsDir })
      .then(async () => {
        // Apply basic pragmas once the database exists
        await db.raw("PRAGMA foreign_keys = ON");
        await db.raw("PRAGMA journal_mode = WAL");
      })
      .catch((error) => {
        migrationPromise = null;
        throw error;
      });
  }

  return migrationPromise;
}

export { databasePath as DATABASE_PATH };
