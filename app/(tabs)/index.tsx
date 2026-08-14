import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTaskStore } from '../../store/useTaskStore';
import { ProgressRing } from '../../components/animations/ProgressRing';
import { EmptyState } from '../../components/ui/EmptyState';
import { DraggableTaskList } from '../../components/task/DraggableTaskList';
import { endOfToday } from 'date-fns';
import { Task } from '../../types/task';

export default function HomeScreen() {
  const router = useRouter();
  const tasks = useTaskStore(state => state.tasks);
  const fetchTasks = useTaskStore(state => state.fetchTasks);
  const isLoading = useTaskStore(state => state.isLoading);

  useEffect(() => {
    fetchTasks();
  }, []);

  const todayMs = endOfToday().getTime();
  const allTodayTasks = tasks.filter(t => !t.dueDate || t.dueDate <= todayMs);
  
  const todayTasks = allTodayTasks.filter(t => !t.isCompleted).sort((a, b) => a.orderIndex - b.orderIndex);
  
  // Hitung progres hari ini
  const allTodayTasksCount = allTodayTasks.length;
  const completedTodayCount = allTodayTasks.filter(t => t.isCompleted).length;
  const progressRatio = allTodayTasksCount > 0 ? completedTodayCount / allTodayTasksCount : 0;

  const reorderTasks = useTaskStore(state => state.reorderTasks);

  const handleReorder = async (data: Task[]) => {
    // Kita panggil fungsi reorderTasks di store
    await reorderTasks(data);
  };

  return (
    <SafeAreaView className="flex-1 bg-background pt-8">
      <View className="px-6 mb-4 mt-4 flex-row justify-between items-center">
        <View>
          <Text className="text-3xl font-bold text-textPrimary">Hari Ini</Text>
          <Text className="text-textSecondary mt-1">Selesaikan prioritasmu!</Text>
        </View>
        <ProgressRing progress={progressRatio} size={60} strokeWidth={6} />
      </View>

      <View className="flex-1">
        {!isLoading && (
          todayTasks.length === 0 ? (
            <EmptyState 
              title="Semua selesai!" 
              message="Kamu tidak memiliki tugas tersisa untuk hari ini. Waktunya bersantai!" 
              icon="partly-sunny-outline" 
            />
          ) : (
            <DraggableTaskList 
              tasks={todayTasks} 
              onReorder={handleReorder} 
            />
          )
        )}
      </View>

      {/* Floating Action Button */}
      <Pressable 
        className="absolute bottom-6 right-6 w-16 h-16 bg-primary rounded-full items-center justify-center shadow-lg"
        style={{ elevation: 5, shadowColor: '#38BDF8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}
        onPress={() => router.push('/task/new')}
      >
        <Ionicons name="add" size={32} color="white" />
      </Pressable>
    </SafeAreaView>
  );
}
