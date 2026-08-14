import React from 'react';
import { View, Text } from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { Task } from '../../types/task';
import { TaskCard } from './TaskCard';
import { SwipeableRow } from './SwipeableRow';
import { useTaskStore } from '../../store/useTaskStore';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface DraggableTaskListProps {
  tasks: Task[];
  onReorder: (data: Task[]) => void;
}

export const DraggableTaskList: React.FC<DraggableTaskListProps> = ({ tasks, onReorder }) => {
  const router = useRouter();
  const toggleComplete = useTaskStore(state => state.toggleComplete);
  const deleteTask = useTaskStore(state => state.deleteTask);

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Task>) => {
    return (
      <ScaleDecorator>
        <SwipeableRow
          isCompleted={item.isCompleted}
          onToggleComplete={() => toggleComplete(item.id, item.isCompleted)}
          onDelete={() => deleteTask(item.id)}
        >
          <TaskCard
            task={item}
            isActive={isActive}
            onLongPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              drag();
            }}
            onPress={() => {
              // @ts-ignore - Route types might not be perfectly typed yet
              router.push(`/task/${item.id}`);
            }}
          />
        </SwipeableRow>
      </ScaleDecorator>
    );
  };

  if (tasks.length === 0) {
    return (
      <View className="flex-1 justify-center items-center p-8">
        <Text className="text-lg font-semibold text-textSecondary mb-2">Belum ada task</Text>
        <Text className="text-center text-gray-400">Tekan tombol + di bawah untuk mulai menambahkan task baru.</Text>
      </View>
    );
  }

  return (
    <DraggableFlatList
      data={tasks}
      onDragEnd={({ data }) => onReorder(data)}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={{ paddingBottom: 100 }} // Space for FAB
    />
  );
};
