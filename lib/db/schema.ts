import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

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
  category: text("category"),
  notificationId: text("notification_id"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
