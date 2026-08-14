import { drizzle } from "drizzle-orm/expo-sqlite";
import * as SQLite from "expo-sqlite";
import * as schema from "./schema";

export const DATABASE_NAME = "tasks.db";

// Open the database synchronously or asynchronously
const expoDb = SQLite.openDatabaseSync(DATABASE_NAME);

// Export the drizzle instance
export const db = drizzle(expoDb, { schema });
