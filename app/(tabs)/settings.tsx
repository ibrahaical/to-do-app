import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Alert, Linking, AppState, AppStateStatus, TextInput, ScrollView } from 'react-native';
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
      "Reset App Data",
      "WARNING: All tasks, schedules, and history will be permanently deleted. You will be returned to the onboarding screen. Are you sure you want to proceed?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reset All", 
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
    <SafeAreaView className="flex-1 bg-white pt-4">
      {/* HEADER SECTION */}
      <View className="px-6 h-12 justify-center mb-2">
        <Text className="text-3xl font-bold text-textPrimary">Profile Settings</Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Profile Row */}
        <View className="flex-row items-center py-4 border-b border-gray-100 mb-2">
          <View className="w-14 h-14 bg-primary rounded-full items-center justify-center mr-4 shadow-sm">
            <Text className="text-white text-lg font-bold">{getInitials(localName)}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-[11px] text-textSecondary font-semibold uppercase tracking-wider mb-0.5">Display Name</Text>
            <TextInput 
              value={localName}
              onChangeText={setLocalName}
              onBlur={() => setUserName(localName.trim() || 'User')}
              className="text-lg font-bold text-textPrimary py-0"
              placeholder="Enter name..."
              placeholderTextColor="#94A3B8"
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Setting Items */}
        <View className="mt-2">
          {/* Notification Permission Row */}
          <Pressable 
            className="flex-row justify-between items-center py-4 border-b border-gray-100"
            onPress={() => Linking.openSettings()}
          >
            <View className="flex-row items-center">
              <Ionicons name="notifications-outline" size={22} color="#64748B" className="mr-3.5" />
              <Text className="text-textPrimary text-base font-medium">Notification Permission</Text>
            </View>
            <View className="flex-row items-center">
              <Text className={`text-sm font-semibold mr-2 ${hasNotificationPermission ? 'text-green-500' : 'text-red-500'}`}>
                {hasNotificationPermission ? 'Active' : 'Blocked'}
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </View>
          </Pressable>

          {/* App Version Row */}
          <View className="flex-row justify-between items-center py-4 border-b border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="information-circle-outline" size={22} color="#64748B" className="mr-3.5" />
              <Text className="text-textPrimary text-base font-medium">App Version</Text>
            </View>
            <Text className="text-textSecondary text-sm font-medium">1.0.0 (Beta)</Text>
          </View>

          {/* Reset App Data Row */}
          <Pressable 
            className="flex-row justify-between items-center py-4 border-b border-gray-100 mt-6"
            onPress={handleResetData}
          >
            <View className="flex-row items-center">
              <Ionicons name="trash-outline" size={22} color="#EF4444" className="mr-3.5" />
              <View>
                <Text className="text-red-500 text-base font-bold">Reset App Data</Text>
                <Text className="text-xs text-textSecondary mt-0.5">Permanently delete all tasks & settings</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
