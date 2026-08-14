import { create } from 'zustand';
import { Category } from '../types/task';
import * as CategoryQueries from '../lib/db/queries/category.queries';
import { categories } from '../lib/db/schema';
import { randomUUID } from 'expo-crypto';

interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  fetchCategories: () => Promise<void>;
  addCategory: (input: Omit<Category, 'id' | 'createdAt'>) => Promise<void>;
  seedCategories: () => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: true,
  
  fetchCategories: async () => {
    set({ isLoading: true });
    try {
      const data = await CategoryQueries.getCategories();
      // Transform SQLite row to Category interface
      const transformedData = data.map(row => ({
        ...row,
      }));
      set({ categories: transformedData, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      set({ isLoading: false });
    }
  },

  addCategory: async (input) => {
    const newCategory = {
      ...input,
      id: randomUUID(),
      createdAt: Date.now(),
    };
    
    // Optimistic update
    set((state) => ({ 
      categories: [newCategory, ...state.categories] 
    }));

    try {
      await CategoryQueries.insertCategory(newCategory as typeof categories.$inferInsert);
    } catch (error) {
      console.error("Failed to add category:", error);
      get().fetchCategories(); 
    }
  },

  seedCategories: async () => {
    try {
      const data = await CategoryQueries.getCategories();
      if (data.length === 0) {
        console.log("Seeding initial categories...");
        const initialCategories = [
          { id: randomUUID(), name: 'Personal', color: '#3B82F6', icon: 'person', createdAt: Date.now() },
          { id: randomUUID(), name: 'Work', color: '#EF4444', icon: 'briefcase', createdAt: Date.now() + 1 },
          { id: randomUUID(), name: 'Shopping', color: '#10B981', icon: 'cart', createdAt: Date.now() + 2 },
        ];
        
        for (const cat of initialCategories) {
          await CategoryQueries.insertCategory(cat as typeof categories.$inferInsert);
        }
        
        set({ categories: initialCategories });
      }
    } catch (error) {
      console.error("Failed to seed categories:", error);
    }
  }
}));
