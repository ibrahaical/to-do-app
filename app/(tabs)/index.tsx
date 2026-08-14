import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTaskStore } from '../../store/useTaskStore';
import { ProgressRing } from '../../components/animations/ProgressRing';
import { EmptyState } from '../../components/ui/EmptyState';
import { DraggableTaskList } from '../../components/task/DraggableTaskList';
import { endOfToday } from 'date-fns';
import { Task } from '../../types/task';

import { useCategoryStore } from '../../store/useCategoryStore';

import { useSettingsStore } from '../../store/useSettingsStore';

export default function HomeScreen() {
  const router = useRouter();
  const tasks = useTaskStore(state => state.tasks);
  const fetchTasks = useTaskStore(state => state.fetchTasks);
  const isLoading = useTaskStore(state => state.isLoading);
  const categories = useCategoryStore(state => state.categories);
  const fetchCategories = useCategoryStore(state => state.fetchCategories);
  const seedCategories = useCategoryStore(state => state.seedCategories);
  const userName = useSettingsStore(state => state.userName);

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
    seedCategories().then(() => fetchCategories());
  }, []);

  const todayMs = endOfToday().getTime();
  const allTodayTasks = tasks.filter(t => !t.dueDate || t.dueDate <= todayMs);
  
  const filteredTasks = selectedCategoryFilter 
    ? allTodayTasks.filter(t => t.categoryId === selectedCategoryFilter)
    : allTodayTasks;
    
  const todayTasks = filteredTasks.filter(t => !t.isCompleted).sort((a, b) => a.orderIndex - b.orderIndex);
  
  // Hitung progres hari ini
  const allTodayTasksCount = filteredTasks.length;
  const completedTodayCount = filteredTasks.filter(t => t.isCompleted).length;
  const progressRatio = allTodayTasksCount > 0 ? completedTodayCount / allTodayTasksCount : 0;

  const reorderTasks = useTaskStore(state => state.reorderTasks);

  const handleReorder = async (data: Task[]) => {
    // Kita panggil fungsi reorderTasks di store
    await reorderTasks(data);
  };

  const firstName = userName.split(' ')[0];

  return (
    <SafeAreaView className="flex-1 bg-background pt-8">
      {/* Header */}
      <View className="px-6 mb-4 mt-4 flex-row justify-between items-center">
        <View>
          <Text className="text-3xl font-bold text-textPrimary">Halo, {firstName} 👋</Text>
          <Text className="text-textSecondary mt-1">Fokus pada apa yang penting hari ini.</Text>
        </View>
        <View className="flex-row items-center">
          <Pressable 
            className="w-10 h-10 bg-surface rounded-full items-center justify-center shadow-sm"
            onPress={() => router.push('/search')}
          >
            <Ionicons name="search" size={20} color="#64748B" />
          </Pressable>
        </View>
      </View>

      {/* Hero Progress Section */}
      <View className="items-center justify-center py-6 mb-2">
        <ProgressRing progress={progressRatio} size={180} strokeWidth={4}>
          <View className="items-center justify-center">
            <Text className="text-5xl font-light text-textPrimary" style={{ fontWeight: '300' }}>
              {Math.round(progressRatio * 100)}<Text className="text-2xl">%</Text>
            </Text>
            <Text className="text-xs text-textSecondary mt-1 font-medium tracking-wider uppercase">
              {completedTodayCount} of {allTodayTasksCount} completed
            </Text>
          </View>
        </ProgressRing>
      </View>

      {/* Category Filter Chips */}
      {categories.length > 0 && (
        <View className="mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
            <Pressable
              onPress={() => setSelectedCategoryFilter(null)}
              className={`px-4 py-2 rounded-full mr-2 ${!selectedCategoryFilter ? 'bg-primary' : 'bg-surface'}`}
            >
              <Text className={`font-semibold ${!selectedCategoryFilter ? 'text-white' : 'text-textSecondary'}`}>
                Semua
              </Text>
            </Pressable>
            {categories.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => setSelectedCategoryFilter(c.id)}
                className={`flex-row items-center px-4 py-2 rounded-full mr-2 ${selectedCategoryFilter === c.id ? 'border' : 'bg-surface'}`}
                style={{ 
                  backgroundColor: selectedCategoryFilter === c.id ? `${c.color}15` : undefined,
                  borderColor: selectedCategoryFilter === c.id ? c.color : undefined
                }}
              >
                <Ionicons name={c.icon as any} size={14} color={selectedCategoryFilter === c.id ? c.color : '#94A3B8'} className="mr-1.5" />
                <Text style={{ color: selectedCategoryFilter === c.id ? c.color : '#64748B' }} className="font-semibold">
                  {c.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

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
