import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  hasOnboarded: boolean;
  userName: string;
  setHasOnboarded: (value: boolean) => void;
  setUserName: (name: string) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hasOnboarded: false,
      userName: 'Pengguna',
      setHasOnboarded: (value) => set({ hasOnboarded: value }),
      setUserName: (name) => set({ userName: name }),
      resetSettings: () => set({ hasOnboarded: false, userName: 'Pengguna' }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
