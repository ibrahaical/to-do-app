import { drizzle } from "drizzle-orm/expo-sqlite";
import * as SQLite from "expo-sqlite";
import * as schema from "./schema";

export const DATABASE_NAME = "tasks.db";

const expoDb = SQLite.openDatabaseSync(DATABASE_NAME);

export const db = drizzle(expoDb, { schema });

/**
 * Menjalankan migrasi database secara manual menggunakan CREATE TABLE IF NOT EXISTS.
 * Ini adalah pendekatan yang lebih sederhana daripada menggunakan drizzle-kit generate
 * karena kita tidak perlu mengelola file migrasi.
 */
export const runMigrations = () => {
  expoDb.execSync(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      notes TEXT,
      due_date INTEGER,
      reminder_at INTEGER,
      priority TEXT NOT NULL DEFAULT 'medium',
      is_completed INTEGER NOT NULL DEFAULT 0,
      completed_at INTEGER,
      order_index INTEGER NOT NULL DEFAULT 0,
      category TEXT,
      notification_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
};
