import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Task } from '../../types/task';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useCategoryStore } from '../../store/useCategoryStore';

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onLongPress?: () => void;
  isActive?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onPress, onLongPress, isActive }) => {
  const category = useCategoryStore(state => state.categories.find(c => c.id === task.categoryId));
  
  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high': return 'bg-priorityHigh';
      case 'medium': return 'bg-priorityMedium';
      case 'low': return 'bg-priorityLow';
      default: return 'bg-gray-400';
    }
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      className={`bg-surface p-4 rounded-xl flex-row items-center justify-between mx-4 my-2 shadow-sm ${isActive ? 'scale-105 opacity-90 shadow-lg' : ''}`}
      style={{
        elevation: isActive ? 8 : 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: isActive ? 4 : 1 },
        shadowOpacity: isActive ? 0.2 : 0.05,
        shadowRadius: isActive ? 8 : 3,
      }}
    >
      <View className="flex-row items-center flex-1">
        <View className="mr-3">
          <View className={`w-3 h-3 rounded-full ${getPriorityColor()} ${task.isCompleted ? 'opacity-40' : ''}`} />
        </View>
        <View className="flex-1">
          <Text 
            className={`text-base font-semibold ${task.isCompleted ? 'text-textSecondary line-through' : 'text-textPrimary'}`}
            numberOfLines={1}
          >
            {task.title}
          </Text>
          {(task.dueDate || task.reminderAt || category) && (
            <View className="flex-row items-center mt-2 flex-wrap">
              {category && (
                <View className="flex-row items-center mr-3 bg-gray-100 px-2 py-0.5 rounded-md">
                  <Ionicons name={category.icon as any} size={10} color={category.color} className="mr-1" />
                  <Text style={{ color: category.color }} className="text-[10px] font-medium ml-1">
                    {category.name}
                  </Text>
                </View>
              )}
              {task.dueDate && (
                <View className="flex-row items-center mr-3">
                  <Ionicons name="calendar-outline" size={12} color="#6B7684" className="mr-1" />
                  <Text className="text-xs text-textSecondary ml-1">
                    {format(new Date(task.dueDate), 'MMM d, yyyy')}
                  </Text>
                </View>
              )}
              {task.reminderAt && (
                <View className="flex-row items-center">
                  <Ionicons name="notifications-outline" size={12} color="#6B7684" className="mr-1" />
                  <Text className="text-xs text-textSecondary ml-1">
                    {format(new Date(task.reminderAt), 'HH:mm')}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
      <View className="ml-2">
        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
      </View>
    </Pressable>
  );
};
