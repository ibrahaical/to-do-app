import React, { useEffect, useMemo } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { endOfToday, format } from 'date-fns';
import { enUS as localeId } from 'date-fns/locale';

import { useTaskStore } from '../../store/useTaskStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { ProgressRing } from '../../components/animations/ProgressRing';

export default function TaskScreen() {
  const router = useRouter();
  
  const tasks = useTaskStore(state => state.tasks);
  const fetchTasks = useTaskStore(state => state.fetchTasks);
  const isLoading = useTaskStore(state => state.isLoading);
  
  const categories = useCategoryStore(state => state.categories);
  const fetchCategories = useCategoryStore(state => state.fetchCategories);
  const seedCategories = useCategoryStore(state => state.seedCategories);
  
  const userName = useSettingsStore(state => state.userName);
  const notifications = useNotificationStore(state => state.notifications);
  const hasUnread = notifications.some(n => !n.isRead);

  useEffect(() => {
    fetchTasks();
    seedCategories().then(() => fetchCategories());
  }, []);

  // Filter for today's list & progress counts (Memoized to eliminate redundant recalculations)
  const { todayTasks, activeTasks, allCount, completedCount, todoCount, inProgressCount, doneCount, progressRatio } = useMemo(() => {
    const todayMs = endOfToday().getTime();
    const today = tasks.filter(t => !t.dueDate || t.dueDate <= todayMs);
    const active = today.filter(t => !t.isCompleted).sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0));
    
    const all = tasks.length;
    const completed = tasks.filter(t => t.isCompleted).length;
    const todo = tasks.filter(t => t.status === 'todo').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const done = tasks.filter(t => t.status === 'done').length;
    const ratio = all > 0 ? completed / all : 0;

    return {
      todayTasks: today,
      activeTasks: active,
      allCount: all,
      completedCount: completed,
      todoCount: todo,
      inProgressCount: inProgress,
      doneCount: done,
      progressRatio: ratio,
    };
  }, [tasks]);

  const firstName = userName ? userName.split(' ')[0] : 'User';

  return (
    <SafeAreaView className="flex-1 bg-background pt-4">
      {/* HEADER SECTION */}
      <View className="px-6 h-12 justify-center">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-xl font-bold text-textPrimary">Hello, {firstName} 👋</Text>
            <Text className="text-xs text-textSecondary mt-0.5">Focus on what matters today.</Text>
          </View>
          <Pressable 
            onPress={() => router.push('/notifications')} 
            className="w-10 h-10 bg-surface rounded-full items-center justify-center shadow-sm relative"
          >
            <Ionicons name="notifications-outline" size={20} color="#64748B" />
            {hasUnread && (
              <View className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
            )}
          </Pressable>
        </View>
      </View>

      {/* HERO PROGRESS SECTION */}
      <View className="items-center justify-center py-6">
        <ProgressRing progress={progressRatio} size={240} strokeWidth={5}>
          <View className="items-center justify-center">
            <Text className="text-6xl font-light text-textPrimary" style={{ fontWeight: '300' }}>
              {Math.floor(progressRatio * 100)}<Text className="text-3xl">%</Text>
            </Text>
            <Text className="text-xs text-textSecondary mt-1 font-medium tracking-wider uppercase">
              {completedCount} of {allCount} completed
            </Text>
          </View>
        </ProgressRing>
      </View>

      {/* STATUS BREAKDOWN SECTION */}
      <View className="px-6 pb-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xs font-bold text-textSecondary uppercase tracking-wider">Status</Text>
          <Pressable onPress={() => router.push('/task')}>
            <Text className="text-sm font-semibold text-primary">See All</Text>
          </Pressable>
        </View>
        <View className="flex-col gap-4">
          {/* TO DO ROW */}
          <View>
            <View className="flex-row items-center mb-1.5">
              <View className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
              <Text className="text-sm font-semibold text-textPrimary">To Do ({todoCount})</Text>
            </View>
            <View className="flex-row items-center">
              <View className="flex-1 h-1.5 bg-gray-100 rounded-full mr-3 overflow-hidden">
                <View className="h-full bg-blue-500 rounded-full" style={{ width: `${allCount ? (todoCount/allCount)*100 : 0}%` }} />
              </View>
              <Text className="text-xs font-medium text-textSecondary">{allCount ? Math.floor((todoCount/allCount)*100) : 0}%</Text>
            </View>
          </View>

          {/* IN PROGRESS ROW */}
          <View>
            <View className="flex-row items-center mb-1.5">
              <View className="w-2 h-2 rounded-full bg-amber-500 mr-2" />
              <Text className="text-sm font-semibold text-textPrimary">In Progress ({inProgressCount})</Text>
            </View>
            <View className="flex-row items-center">
              <View className="flex-1 h-1.5 bg-gray-100 rounded-full mr-3 overflow-hidden">
                <View className="h-full bg-amber-500 rounded-full" style={{ width: `${allCount ? (inProgressCount/allCount)*100 : 0}%` }} />
              </View>
              <Text className="text-xs font-medium text-textSecondary">{allCount ? Math.floor((inProgressCount/allCount)*100) : 0}%</Text>
            </View>
          </View>

          {/* DONE ROW */}
          <View>
            <View className="flex-row items-center mb-1.5">
              <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
              <Text className="text-sm font-semibold text-textPrimary">Done ({doneCount})</Text>
            </View>
            <View className="flex-row items-center">
              <View className="flex-1 h-1.5 bg-gray-100 rounded-full mr-3 overflow-hidden">
                <View className="h-full bg-green-500 rounded-full" style={{ width: `${allCount ? (doneCount/allCount)*100 : 0}%` }} />
              </View>
              <Text className="text-xs font-medium text-textSecondary">{allCount ? Math.floor((doneCount/allCount)*100) : 0}%</Text>
            </View>
          </View>
        </View>
      </View>

      {/* SUBHEADER */}
      <View className="px-6 py-4 flex-row justify-between items-center border-b border-gray-100 bg-white">
        <Text className="text-sm font-semibold text-textPrimary">Today task</Text>
        <Pressable 
          onPress={() => router.push('/task/new')}
          className="flex-row items-center bg-primary/10 px-3 py-1.5 rounded-full"
        >
          <Ionicons name="add" size={16} color="#0284C7" />
          <Text className="text-xs font-bold text-primary ml-1">Add Task</Text>
        </Pressable>
      </View>

      {/* TASK LIST */}
      <View className="flex-1 bg-white">
        {!isLoading && (
          <FlatList
            data={activeTasks}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingBottom: 100 }}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={5}
            initialNumToRender={8}
            renderItem={({ item }) => (
              <Pressable 
                onPress={() => router.push(`/task/${item.id}` as any)}
                className="flex-row py-4 px-6 border-b border-gray-100 items-center"
              >
                {/* Status Pill */}
                <View className={`w-1.5 h-10 rounded-full mr-4 ${
                  item.status === 'done' ? 'bg-green-500' : 
                  item.status === 'in_progress' ? 'bg-amber-500' : 'bg-blue-500'
                }`} />
                
                <View className="flex-1">
                  <Text className={`text-base font-semibold ${item.isCompleted ? 'text-gray-400 line-through' : 'text-textPrimary'}`}>
                    {item.title}
                  </Text>
                  <Text className="text-xs text-textSecondary mt-1 font-medium">
                    {item.dueDate ? format(new Date(item.dueDate), 'hh:mm a', { locale: localeId }) : 'All Day'} • #{categories.find(c => c.id === item.categoryId)?.name || 'Other'}
                  </Text>
                </View>
                
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </Pressable>
            )}
            ListEmptyComponent={
              <View className="mt-8 items-center">
                <Text className="text-sm text-textSecondary font-medium">No task today</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
