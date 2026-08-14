import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  icon: text("icon").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  notes: text("notes"),
  dueDate: integer("due_date"),
  reminderAt: integer("reminder_at"),
  priority: text("priority").notNull().default("medium"),
  isCompleted: integer("is_completed").notNull().default(0), // 0 for false, 1 for true
  completedAt: integer("completed_at"),
  orderIndex: integer("order_index").notNull().default(0),
  categoryId: text("category_id").references(() => categories.id),
  category: text("category"), // Tetap dibiarkan untuk fallback atau migrasi data lama
  notificationId: text("notification_id"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
