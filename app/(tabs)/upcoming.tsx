import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, SectionList, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTaskStore } from '../../store/useTaskStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { TaskCard } from '../../components/task/TaskCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { SwipeableRow } from '../../components/task/SwipeableRow';
import { endOfToday, format, isTomorrow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export default function UpcomingScreen() {
  const router = useRouter();
  const tasks = useTaskStore(state => state.tasks);
  const toggleComplete = useTaskStore(state => state.toggleComplete);
  const deleteTask = useTaskStore(state => state.deleteTask);
  const categories = useCategoryStore(state => state.categories);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  
  const sections = useMemo(() => {
    const todayMs = endOfToday().getTime();
    
    // Ambil task yang dueDate-nya setelah hari ini dan belum selesai
    const upcomingTasksRaw = tasks.filter(t => !t.isCompleted && t.dueDate && t.dueDate > todayMs);
    
    // Filter berdasarkan kategori yang dipilih
    const upcomingTasks = selectedCategoryFilter 
      ? upcomingTasksRaw.filter(t => t.categoryId === selectedCategoryFilter)
      : upcomingTasksRaw;
    
    // Kelompokkan berdasarkan tanggal
    const grouped = upcomingTasks.reduce((acc, task) => {
      // @ts-ignore (kita tahu dueDate pasti ada)
      const date = new Date(task.dueDate);
      
      // Reset jam ke 00:00:00 untuk dijadikan key grup
      date.setHours(0, 0, 0, 0);
      const timeKey = date.getTime();
      
      if (!acc[timeKey]) {
        acc[timeKey] = [];
      }
      acc[timeKey].push(task);
      return acc;
    }, {} as Record<number, typeof tasks>);

    // Ubah ke format SectionList dan urutkan
    const sortedKeys = Object.keys(grouped).map(Number).sort((a, b) => a - b);
    
    return sortedKeys.map(key => {
      const date = new Date(key);
      let title = format(date, 'EEEE, d MMMM yyyy', { locale: localeId });
      
      if (isTomorrow(date)) {
        title = 'Besok';
      }
      
      return {
        title,
        data: grouped[key]
      };
    });
  }, [tasks, selectedCategoryFilter]);

  return (
    <SafeAreaView className="flex-1 bg-background pt-8">
      <View className="px-6 mb-4 mt-4 flex-row justify-between items-center">
        <View>
          <Text className="text-3xl font-bold text-textPrimary">Mendatang</Text>
          <Text className="text-textSecondary mt-1">Tugas yang menanti di hari esok.</Text>
        </View>
        <Pressable 
          className="w-10 h-10 bg-surface rounded-full items-center justify-center shadow-sm"
          onPress={() => router.push('/search')}
        >
          <Ionicons name="search" size={20} color="#64748B" />
        </Pressable>
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
                <Ionicons name={c.icon as any} size={14} color={selectedCategoryFilter === c.id ? c.color : '#94A3B8'} style={{ marginRight: 6 }} />
                <Text style={{ color: selectedCategoryFilter === c.id ? c.color : '#64748B' }} className="font-semibold">
                  {c.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      <View className="flex-1">
        {sections.length === 0 ? (
          <EmptyState 
            icon="calendar-outline" 
            title="Tidak ada jadwal mendatang" 
            message="Semua agenda Anda telah terkontrol. Nikmati hari Anda!" 
          />
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
            renderSectionHeader={({ section: { title } }) => (
              <Text className="text-lg font-bold text-textPrimary mt-6 mb-3">{title}</Text>
            )}
            renderItem={({ item }) => (
              <View className="mb-3">
                <SwipeableRow
                  isCompleted={item.isCompleted}
                  onToggleComplete={() => toggleComplete(item.id, item.isCompleted)}
                  onDelete={() => deleteTask(item.id)}
                >
                  <TaskCard 
                    task={item} 
                    onPress={() => router.push(`/task/${item.id}` as any)}
                  />
                </SwipeableRow>
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />
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
