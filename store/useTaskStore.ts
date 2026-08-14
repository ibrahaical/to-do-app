import { create } from 'zustand';
import { Task, NewTaskInput, UpdateTaskInput } from '../types/task';
import * as TaskQueries from '../lib/db/queries/task.queries';
import { tasks } from '../lib/db/schema';

// Helper to transform SQLite row to Task interface
const mapDbRowToTask = (row: typeof tasks.$inferSelect): Task => ({
  ...row,
  isCompleted: row.isCompleted === 1,
  priority: row.priority as "low" | "medium" | "high",
});

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  fetchTasks: () => Promise<void>;
  addTask: (input: NewTaskInput) => Promise<void>;
  updateTask: (id: string, input: UpdateTaskInput) => Promise<void>;
  toggleComplete: (id: string, currentStatus: boolean) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: true,
  
  fetchTasks: async () => {
    set({ isLoading: true });
    try {
      const data = await TaskQueries.getTasks();
      set({ tasks: data.map(mapDbRowToTask), isLoading: false });
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      set({ isLoading: false });
    }
  },

  addTask: async (input) => {
    const now = Date.now();
    const id = crypto.randomUUID();
    const newTask = {
      ...input,
      id,
      isCompleted: 0,
      createdAt: now,
      updatedAt: now,
      orderIndex: input.orderIndex || 0,
    };
    
    // Optistic update
    set((state) => ({ 
      tasks: [mapDbRowToTask(newTask as typeof tasks.$inferSelect), ...state.tasks] 
    }));

    try {
      await TaskQueries.insertTask(newTask as typeof tasks.$inferInsert);
    } catch (error) {
      console.error("Failed to add task:", error);
      // Revert in real app, omitted for brevity here
      get().fetchTasks(); 
    }
  },

  updateTask: async (id, input) => {
    const updateData = { ...input, updatedAt: Date.now() };
    
    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, ...input, updatedAt: updateData.updatedAt } : t) as Task[]
    }));

    try {
      await TaskQueries.updateTask(id, updateData as Partial<typeof tasks.$inferInsert>);
    } catch (error) {
      console.error("Failed to update task:", error);
      get().fetchTasks();
    }
  },

  toggleComplete: async (id, currentStatus) => {
    const newStatus = !currentStatus;
    const completedAt = newStatus ? Date.now() : null;

    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map(t => 
        t.id === id ? { ...t, isCompleted: newStatus, completedAt } : t
      )
    }));

    try {
      await TaskQueries.toggleTaskCompletion(id, newStatus);
    } catch (error) {
      console.error("Failed to toggle task:", error);
      get().fetchTasks();
    }
  },

  deleteTask: async (id) => {
    // Optimistic update
    set((state) => ({
      tasks: state.tasks.filter(t => t.id !== id)
    }));

    try {
      await TaskQueries.deleteTask(id);
    } catch (error) {
      console.error("Failed to delete task:", error);
      get().fetchTasks();
    }
  },
}));
