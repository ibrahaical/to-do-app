import { create } from 'zustand';
import { Task, NewTaskInput, UpdateTaskInput } from '../types/task';
import * as TaskQueries from '../lib/db/queries/task.queries';
import { tasks } from '../lib/db/schema';
import { scheduleTaskReminder, cancelTaskReminder } from '../lib/notifications/scheduler';
import { randomUUID } from 'expo-crypto';

// Helper to transform SQLite row to Task interface
const mapDbRowToTask = (row: typeof tasks.$inferSelect): Task => ({
  ...row,
  isCompleted: row.isCompleted === 1,
  priority: row.priority as "low" | "medium" | "high",
  status: row.status as "todo" | "in_progress" | "done",
});

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  fetchTasks: () => Promise<void>;
  addTask: (input: NewTaskInput) => Promise<void>;
  updateTask: (id: string, input: UpdateTaskInput) => Promise<void>;
  toggleComplete: (id: string, currentStatus: boolean) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  reorderTasks: (reorderedTasks: Task[]) => Promise<void>;
  clearCompletedTasks: () => Promise<void>;
  clearAllData: () => Promise<void>;
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
    const id = randomUUID();
    const newTask = {
      ...input,
      id,
      priority: (input.priority || 'medium') as 'low' | 'medium' | 'high',
      status: (input.status || 'todo') as 'todo' | 'in_progress' | 'done',
      isCompleted: input.status === 'done' ? 1 : 0,
      completedAt: input.status === 'done' ? now : null,
      createdAt: now,
      updatedAt: now,
      orderIndex: input.orderIndex || 0,
    };
    let notificationId: string | null = null;
    if (input.reminderAt) {
      notificationId = await scheduleTaskReminder(newTask as unknown as Task);
    }
    
    const finalTask = { ...newTask, notificationId };
    
    // Optistic update
    set((state) => ({ 
      tasks: [mapDbRowToTask(finalTask as typeof tasks.$inferSelect), ...state.tasks] 
    }));

    try {
      await TaskQueries.insertTask(finalTask as typeof tasks.$inferInsert);
    } catch (error) {
      console.error("Failed to add task:", error);
      // Revert in real app, omitted for brevity here
      get().fetchTasks(); 
    }
  },

  updateTask: async (id, input) => {
    const state = get();
    const oldTask = state.tasks.find(t => t.id === id);
    
    let notificationId = oldTask?.notificationId || null;
    
    // Jika waktu reminder berubah
    if (input.reminderAt !== undefined && input.reminderAt !== oldTask?.reminderAt) {
      if (oldTask?.notificationId) {
        await cancelTaskReminder(oldTask.notificationId);
      }
      if (input.reminderAt) {
        notificationId = await scheduleTaskReminder({ ...oldTask, ...input } as Task);
      } else {
        notificationId = null;
      }
    }

    const updateData: any = { ...input, notificationId, updatedAt: Date.now() };
    
    if (input.status) {
      updateData.isCompleted = input.status === 'done' ? 1 : 0;
      updateData.completedAt = input.status === 'done' ? Date.now() : null;
    }
    
    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, ...input, notificationId, updatedAt: updateData.updatedAt } : t) as Task[]
    }));

    try {
      await TaskQueries.updateTask(id, updateData as Partial<typeof tasks.$inferInsert>);
    } catch (error) {
      console.error("Failed to update task:", error);
      get().fetchTasks();
    }
  },

  toggleComplete: async (id, currentStatus) => {
    const state = get();
    const oldTask = state.tasks.find(t => t.id === id);
    const newStatus = !currentStatus;
    const completedAt = newStatus ? Date.now() : null;

    if (newStatus && oldTask?.notificationId) {
      // Jika diselesaikan, batalkan pengingat
      await cancelTaskReminder(oldTask.notificationId);
    }

    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map(t => 
        t.id === id ? { ...t, isCompleted: newStatus, status: newStatus ? 'done' : 'todo', completedAt } : t
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
    const state = get();
    const oldTask = state.tasks.find(t => t.id === id);
    
    if (oldTask?.notificationId) {
      await cancelTaskReminder(oldTask.notificationId);
    }

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

  reorderTasks: async (reorderedTasks) => {
    // Ambil indeks asli dan urutkan dari terkecil ke terbesar
    const originalIndices = reorderedTasks.map(t => t.orderIndex).sort((a, b) => a - b);
    
    // Terapkan indeks yang sudah diurutkan ke array yang baru di-reorder
    const updates = reorderedTasks.map((t, index) => ({ 
      id: t.id, 
      orderIndex: originalIndices[index] ?? index // fallback if something goes wrong
    }));
    
    // Optimistic update
    set((state) => {
      const newTasks = [...state.tasks];
      updates.forEach(update => {
        const tIndex = newTasks.findIndex(t => t.id === update.id);
        if (tIndex !== -1) {
          newTasks[tIndex] = { ...newTasks[tIndex], orderIndex: update.orderIndex };
        }
      });
      return { tasks: newTasks };
    });

    try {
      await TaskQueries.updateTaskOrders(updates);
    } catch (error) {
      console.error("Failed to reorder tasks:", error);
      get().fetchTasks();
    }
  },

  clearCompletedTasks: async () => {
    // Cancel notifications if any completed task has one (though they shouldn't, but just in case)
    const state = get();
    const completedTasks = state.tasks.filter(t => t.isCompleted);
    
    for (const task of completedTasks) {
      if (task.notificationId) {
        await cancelTaskReminder(task.notificationId);
      }
    }

    // Optimistic update
    set((state) => ({
      tasks: state.tasks.filter(t => !t.isCompleted)
    }));

    try {
      await TaskQueries.deleteCompletedTasks();
    } catch (error) {
      console.error("Failed to clear completed tasks:", error);
      get().fetchTasks();
    }
  },

  clearAllData: async () => {
    // Cancel all notifications
    const state = get();
    for (const task of state.tasks) {
      if (task.notificationId) {
        await cancelTaskReminder(task.notificationId);
      }
    }

    // Optimistic update
    set({ tasks: [] });

    try {
      await TaskQueries.deleteAllTasks();
    } catch (error) {
      console.error("Failed to clear all data:", error);
      get().fetchTasks();
    }
  },
}));
