import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: number;
}

interface NotificationState {
  notifications: AppNotification[];
  addNotification: (title: string, body: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  cleanupOldNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [
        {
          id: 'welcome-notification',
          title: 'Welcome to Trido! 🎉',
          body: 'Your task manager is ready. Start by adding a new task to your day.',
          isRead: false,
          createdAt: Date.now(),
        }
      ],
      
      addNotification: (title, body) => {
        set((state) => ({
          notifications: [
            {
              id: randomUUID(),
              title,
              body,
              isRead: false,
              createdAt: Date.now(),
            },
            ...state.notifications,
          ]
        }));
      },
      
      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true }))
        }));
      },
      
      clearAll: () => {
        set({ notifications: [] });
      },
      
      cleanupOldNotifications: () => {
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        set((state) => ({
          notifications: state.notifications.filter(n => n.createdAt > thirtyDaysAgo)
        }));
      }
    }),
    {
      name: 'trido-notifications-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
