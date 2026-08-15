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
  // Create tasks table if not exists
  expoDb.execSync(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      notes TEXT,
      due_date INTEGER,
      reminder_at INTEGER,
      priority TEXT NOT NULL DEFAULT 'medium',
      status TEXT NOT NULL DEFAULT 'todo',
      is_completed INTEGER NOT NULL DEFAULT 0,
      completed_at INTEGER,
      order_index INTEGER NOT NULL DEFAULT 0,
      category TEXT,
      notification_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  // Create categories table if not exists
  expoDb.execSync(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      icon TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  // Add category_id to tasks if it doesn't exist
  try {
    expoDb.execSync(`ALTER TABLE tasks ADD COLUMN category_id TEXT REFERENCES categories(id);`);
  } catch (error) {
    // Ignore error if column already exists
  }

  // Add status to tasks if it doesn't exist
  try {
    expoDb.execSync(`ALTER TABLE tasks ADD COLUMN status TEXT NOT NULL DEFAULT 'todo';`);
  } catch (error) {
    // Ignore error if column already exists
  }

  // Create indexes for optimal query speed (O(log N) lookups)
  try {
    expoDb.execSync(`
      CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_is_completed ON tasks(is_completed);
      CREATE INDEX IF NOT EXISTS idx_tasks_order_index ON tasks(order_index);
    `);
  } catch (error) {
    // Ignore error if indexes already exist
  }
};
