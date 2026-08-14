export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: number;
}

export interface Task {
  id: string;
  title: string;
  notes?: string | null;
  dueDate?: number | null; // Timestamp
  reminderAt?: number | null; // Timestamp
  priority: "low" | "medium" | "high";
  isCompleted: boolean;
  completedAt?: number | null; // Timestamp
  orderIndex: number;
  categoryId?: string | null;
  category?: string | null;
  notificationId?: string | null;
  createdAt: number; // Timestamp
  updatedAt: number; // Timestamp
}

export type NewTaskInput = Omit<Task, "id" | "isCompleted" | "completedAt" | "createdAt" | "updatedAt">;
export type UpdateTaskInput = Partial<Omit<Task, "id" | "createdAt" | "updatedAt">>;
