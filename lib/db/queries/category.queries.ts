import { db } from "../client";
import { categories } from "../schema";
import { eq, desc } from "drizzle-orm";

export const getCategories = async () => {
  return await db.select().from(categories).orderBy(desc(categories.createdAt));
};

export const insertCategory = async (category: typeof categories.$inferInsert) => {
  return await db.insert(categories).values(category).returning();
};

export const updateCategory = async (id: string, category: Partial<typeof categories.$inferInsert>) => {
  return await db.update(categories).set(category).where(eq(categories.id, id)).returning();
};

export const deleteCategory = async (id: string) => {
  return await db.delete(categories).where(eq(categories.id, id)).returning();
};
