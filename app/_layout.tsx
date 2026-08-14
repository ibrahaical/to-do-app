import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import 'react-native-reanimated';
import '../global.css';
import * as Notifications from 'expo-notifications';
import { useSettingsStore } from '../store/useSettingsStore';
import { useNotificationStore } from '../store/useNotificationStore';

// Konfigurasi agar notifikasi tetap tampil (sebagai banner/suara) meskipun aplikasi sedang dibuka (foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

import { useColorScheme } from '@/hooks/use-color-scheme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { runMigrations } from '../lib/db/client';

// Jalankan migrasi database segera saat modul dimuat (synchronous)
runMigrations();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const hasOnboarded = useSettingsStore(state => state.hasOnboarded);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Beri jeda kecil agar navigation tree siap
    setTimeout(() => setIsReady(true), 100);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const inTabsGroup = segments[0] === '(tabs)';
    
    if (!hasOnboarded && inTabsGroup) {
      // Redirect ke onboarding
      router.replace('/onboarding');
    }
  }, [isReady, hasOnboarded, segments]);

  useEffect(() => {
    // Bersihkan notifikasi lama (lebih dari 30 hari)
    useNotificationStore.getState().cleanupOldNotifications();

    // Listen for incoming notifications when app is running
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      const { title, body } = notification.request.content;
      if (title && body) {
        useNotificationStore.getState().addNotification(title, body);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="task/new" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="task/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="search" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="notifications" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
