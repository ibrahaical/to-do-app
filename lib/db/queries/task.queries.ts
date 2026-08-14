import { db } from "../client";
import { tasks } from "../schema";
import { eq, desc } from "drizzle-orm";

export const getTasks = async () => {
  return await db.select().from(tasks).orderBy(desc(tasks.orderIndex), desc(tasks.createdAt));
};

export const insertTask = async (task: typeof tasks.$inferInsert) => {
  return await db.insert(tasks).values(task).returning();
};

export const updateTask = async (id: string, task: Partial<typeof tasks.$inferInsert>) => {
  return await db.update(tasks).set(task).where(eq(tasks.id, id)).returning();
};

export const deleteTask = async (id: string) => {
  return await db.delete(tasks).where(eq(tasks.id, id)).returning();
};

export const toggleTaskCompletion = async (id: string, isCompleted: boolean) => {
  return await db.update(tasks)
    .set({ 
      isCompleted: isCompleted ? 1 : 0, 
      completedAt: isCompleted ? Date.now() : null 
    })
    .where(eq(tasks.id, id))
    .returning();
};

export const updateTaskOrders = async (updates: { id: string, orderIndex: number }[]) => {
  // SQLite lokal sangat cepat, kita bisa gunakan Promise.all untuk batch update
  await Promise.all(
    updates.map(update => 
      db.update(tasks)
        .set({ orderIndex: update.orderIndex })
        .where(eq(tasks.id, update.id))
    )
  );
};
