import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTaskStore } from '../../store/useTaskStore';
import { TaskCard } from '../../components/task/TaskCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { SwipeableRow } from '../../components/task/SwipeableRow';

export default function CompletedScreen() {
  const router = useRouter();
  const tasks = useTaskStore(state => state.tasks);
  const toggleComplete = useTaskStore(state => state.toggleComplete);
  const deleteTask = useTaskStore(state => state.deleteTask);
  
  // Ambil hanya task yang selesai, urutkan dari yang terbaru
  const completedTasks = tasks
    .filter(t => t.isCompleted)
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

  return (
    <SafeAreaView className="flex-1 bg-background pt-8">
      <View className="px-6 mb-4 mt-4">
        <Text className="text-3xl font-bold text-textPrimary">Selesai</Text>
        <Text className="text-textSecondary mt-1">Riwayat tugas yang telah Anda selesaikan.</Text>
      </View>

      <View className="flex-1">
        {completedTasks.length === 0 ? (
          <EmptyState 
            icon="checkmark-done-circle-outline" 
            title="Belum ada yang selesai" 
            message="Selesaikan tugas di halaman utama, riwayatnya akan muncul di sini." 
          />
        ) : (
          <FlatList
            data={completedTasks}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <SwipeableRow
                isCompleted={item.isCompleted}
                onToggleComplete={() => toggleComplete(item.id, item.isCompleted)}
                onDelete={() => deleteTask(item.id)}
              >
                <TaskCard task={item} onPress={() => router.push(`/task/${item.id}` as any)} />
              </SwipeableRow>
            )}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
