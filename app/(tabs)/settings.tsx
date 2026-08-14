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
    <SafeAreaView className="flex-1 bg-background pt-4">
      {/* HEADER SECTION */}
      <View className="px-6 h-12 justify-center mb-2">
        <Text className="text-3xl font-bold text-textPrimary">Settings</Text>
      </View>

      {/* Profile Section */}
      <View className="bg-background pt-4 pb-2 px-6">
        <Text className="text-sm font-bold text-textPrimary">Profile</Text>
      </View>
      
      <View className="bg-white border-y border-gray-100 py-4 px-6 flex-row items-center">
        <View className="w-14 h-14 bg-primary rounded-full items-center justify-center mr-4">
          <Text className="text-white text-lg font-bold">{getInitials(localName)}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs text-textSecondary font-medium mb-1 uppercase tracking-wider">Display Name</Text>
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

      {/* System Section */}
      <View className="bg-background pt-6 pb-2 px-6">
        <Text className="text-sm font-bold text-textPrimary">System</Text>
      </View>
      
      <Pressable 
        className="bg-white border-y border-gray-100 flex-row justify-between items-center py-4 px-6"
        onPress={() => Linking.openSettings()}
      >
        <View className="flex-row items-center">
          <View className="w-8 h-8 items-center justify-center mr-3">
            <Ionicons name="notifications-outline" size={22} color="#64748B" />
          </View>
          <Text className="text-textPrimary text-base font-medium">Notification Permission</Text>
        </View>
        <View className="flex-row items-center">
          <Text className={`font-semibold mr-2 ${hasNotificationPermission ? 'text-green-500' : 'text-red-500'}`}>
            {hasNotificationPermission ? 'Active' : 'Blocked'}
          </Text>
          <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
        </View>
      </Pressable>

      {/* About Section */}
      <View className="bg-background pt-6 pb-2 px-6">
        <Text className="text-sm font-bold text-textPrimary">About</Text>
      </View>
      
      <View className="bg-white border-y border-gray-100 flex-row justify-between items-center py-4 px-6">
        <Text className="text-textPrimary text-base font-medium">App Version</Text>
        <Text className="text-textSecondary font-medium">1.0.0 (Beta)</Text>
      </View>

      {/* Danger Zone Section */}
      <View className="bg-background pt-6 pb-2 px-6">
        <Text className="text-sm font-bold text-red-500">Danger Zone</Text>
      </View>
      
      <Pressable 
        className="bg-white border-y border-gray-100 py-4 px-6"
        onPress={handleResetData}
      >
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <View className="w-8 h-8 items-center justify-center mr-3">
              <Ionicons name="warning-outline" size={22} color="#64748B" />
            </View>
            <Text className="text-red-500 text-base font-bold">Reset App Data</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
        </View>
        <Text className="text-xs text-textSecondary mt-2 ml-12">This action will permanently delete all tasks and settings.</Text>
      </Pressable>

    </SafeAreaView>
  );
}
