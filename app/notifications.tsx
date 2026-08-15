import React, { useEffect } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationStore } from '../store/useNotificationStore';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, markAllAsRead, clearAll } = useNotificationStore();

  useEffect(() => {
    // Option A: Automatically mark all as read when opening the page
    markAllAsRead();
  }, [markAllAsRead]);

  return (
    <SafeAreaView className="flex-1 bg-white pt-4">
      {/* HEADER */}
      <View className="px-6 h-12 flex-row justify-between items-center mb-2">
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => router.back()} className="p-1 -ml-1">
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </Pressable>
          <Text className="text-xl font-bold text-textPrimary">Notifications</Text>
        </View>
        {notifications.length > 0 && (
          <Pressable onPress={clearAll} className="px-3 py-1.5 bg-red-50 rounded-full">
            <Text className="text-xs font-semibold text-red-500">Clear All</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View className={`p-4 mb-4 rounded-2xl border ${!item.isRead ? 'border-primary bg-blue-50' : 'border-gray-100 bg-surface'}`}>
            <View className="flex-row items-start">
              <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${!item.isRead ? 'bg-primary' : 'bg-gray-100'}`}>
                <Ionicons name="notifications" size={20} color={!item.isRead ? '#FFF' : '#94A3B8'} />
              </View>
              <View className="flex-1">
                <Text className={`text-base font-bold ${!item.isRead ? 'text-textPrimary' : 'text-textSecondary'} mb-1`}>
                  {item.title}
                </Text>
                <Text className="text-sm text-textSecondary leading-relaxed mb-2">
                  {item.body}
                </Text>
                <Text className="text-xs font-medium text-gray-400">
                  {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                </Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center mt-20">
            <View className="w-24 h-24 bg-blue-50 rounded-full items-center justify-center mb-6">
              <Ionicons name="notifications-off-outline" size={40} color="#0369a1" />
            </View>
            <Text className="text-lg font-bold text-textPrimary mb-2">No Notifications</Text>
            <Text className="text-sm text-textSecondary text-center px-10">
              When you have task reminders or system alerts, they will appear here.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
