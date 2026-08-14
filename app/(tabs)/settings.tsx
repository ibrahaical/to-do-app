import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Alert, Linking, AppState, AppStateStatus, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { checkNotificationPermission } from '../../lib/notifications/permissions';
import { useTaskStore } from '../../store/useTaskStore';
import { useSettingsStore } from '../../store/useSettingsStore';

export default function SettingsScreen() {
  const router = useRouter();
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
  const clearAllData = useTaskStore(state => state.clearAllData);
  const userName = useSettingsStore(state => state.userName);
  const setUserName = useSettingsStore(state => state.setUserName);
  const resetSettings = useSettingsStore(state => state.resetSettings);
  
  const [localName, setLocalName] = useState(userName);

  // Sync local state if global state changes externally
  useEffect(() => {
    setLocalName(userName);
  }, [userName]);

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name.trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const checkPermission = async () => {
    const isGranted = await checkNotificationPermission();
    setHasNotificationPermission(isGranted);
  };

  useEffect(() => {
    checkPermission();

    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        checkPermission();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleResetData = () => {
    Alert.alert(
      "Reset Data Aplikasi",
      "PERINGATAN KERAS: Semua tugas, jadwal, dan riwayat akan dihapus secara permanen. Anda akan dikembalikan ke layar perkenalan. Yakin ingin melanjutkan?",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Reset Total", 
          style: "destructive", 
          onPress: async () => {
            await clearAllData();
            resetSettings();
            router.replace('/onboarding');
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background pt-8">
      <View className="px-6 mb-8 mt-4">
        <Text className="text-3xl font-bold text-textPrimary mb-6">Pengaturan</Text>
        
        {/* Profile Section */}
        <View className="flex-row items-center bg-surface p-4 rounded-2xl mb-2">
          <View className="w-16 h-16 bg-primary rounded-full items-center justify-center mr-4">
            <Text className="text-white text-xl font-bold">{getInitials(localName)}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm text-textSecondary font-medium mb-1">Nama Profil</Text>
            <TextInput 
              value={localName}
              onChangeText={setLocalName}
              onBlur={() => setUserName(localName.trim() || 'Pengguna')}
              className="text-xl font-bold text-textPrimary py-0"
              placeholder="Masukkan nama..."
              placeholderTextColor="#94A3B8"
              returnKeyType="done"
            />
          </View>
        </View>
      </View>

      <View className="px-6">
        <Text className="text-sm font-semibold text-textSecondary uppercase tracking-wider mb-4">Sistem</Text>
        
        <View className="bg-surface rounded-2xl p-4 mb-8">
          <Pressable 
            className="flex-row justify-between items-center py-2"
            onPress={() => Linking.openSettings()}
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-purple-100 rounded-full items-center justify-center mr-3">
                <Ionicons name="notifications-outline" size={18} color="#9333EA" />
              </View>
              <Text className="text-textPrimary text-base font-medium">Izin Notifikasi</Text>
            </View>
            <View className="flex-row items-center">
              <Text className={`font-semibold mr-2 ${hasNotificationPermission ? 'text-green-500' : 'text-red-500'}`}>
                {hasNotificationPermission ? 'Aktif' : 'Terblokir'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </View>
          </Pressable>
        </View>

        <Text className="text-sm font-semibold text-textSecondary uppercase tracking-wider mb-4">Tentang</Text>
        
        <View className="bg-surface rounded-2xl p-4 mb-8">
          <View className="flex-row justify-between items-center py-2">
            <Text className="text-textPrimary text-base">Versi Aplikasi</Text>
            <Text className="text-textSecondary">1.0.0 (Beta)</Text>
          </View>
        </View>

        <Text className="text-sm font-semibold text-textSecondary uppercase tracking-wider mb-4">Zona Berbahaya</Text>

        <View className="bg-surface rounded-2xl p-4">
          <Pressable 
            className="flex-row justify-between items-center py-2"
            onPress={handleResetData}
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-red-100 rounded-full items-center justify-center mr-3">
                <Ionicons name="warning-outline" size={18} color="#EF4444" />
              </View>
              <Text className="text-red-500 text-base font-bold">Reset Data Aplikasi</Text>
            </View>
          </Pressable>
          <Text className="text-xs text-textSecondary mt-2">Tindakan ini akan menghapus semua tugas dan pengaturan secara permanen.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
