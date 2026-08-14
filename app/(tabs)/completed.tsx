import React from 'react';
import { View, Text, FlatList, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTaskStore } from '../../store/useTaskStore';
import { TaskCard } from '../../components/task/TaskCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { SwipeableRow } from '../../components/task/SwipeableRow';

export default function CompletedScreen() {
  const router = useRouter();
  const tasks = useTaskStore(state => state.tasks);
  const toggleComplete = useTaskStore(state => state.toggleComplete);
  const deleteTask = useTaskStore(state => state.deleteTask);
  const clearCompletedTasks = useTaskStore(state => state.clearCompletedTasks);
  
  // Ambil hanya task yang selesai, urutkan dari yang terbaru
  const completedTasks = tasks
    .filter(t => t.isCompleted)
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

  const handleClearAll = () => {
    Alert.alert(
      "Hapus Semua Riwayat",
      "Anda yakin ingin menghapus semua tugas yang telah diselesaikan? Aksi ini tidak dapat dibatalkan.",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Hapus Semua", 
          style: "destructive", 
          onPress: () => clearCompletedTasks() 
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background pt-8">
      <View className="px-6 mb-4 mt-4 flex-row justify-between items-center">
        <View>
          <Text className="text-3xl font-bold text-textPrimary">Selesai</Text>
          <Text className="text-textSecondary mt-1">Riwayat tugas yang telah Anda selesaikan.</Text>
        </View>
        <View className="flex-row items-center">
          <Pressable 
            className="w-10 h-10 bg-surface rounded-full items-center justify-center shadow-sm mr-2"
            onPress={() => router.push('/search')}
          >
            <Ionicons name="search" size={20} color="#64748B" />
          </Pressable>
          {completedTasks.length > 0 && (
            <Pressable onPress={handleClearAll} className="w-10 h-10 bg-red-50 rounded-full items-center justify-center">
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </Pressable>
          )}
        </View>
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
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
