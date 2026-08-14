import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Switch, ScrollView, Modal, Platform, KeyboardAvoidingView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTaskStore } from '../../store/useTaskStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { enUS as localeId } from 'date-fns/locale';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const tasks = useTaskStore(state => state.tasks);
  const updateTask = useTaskStore(state => state.updateTask);
  const deleteTask = useTaskStore(state => state.deleteTask);
  const toggleComplete = useTaskStore(state => state.toggleComplete);
  const categories = useCategoryStore(state => state.categories);
  
  const task = tasks.find(t => t.id === id);

  // States
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.notes || '');
  const [status, setStatus] = useState<'todo'|'in_progress'|'done'>(task?.status || 'todo');
  const [priority, setPriority] = useState<'low'|'medium'|'high'>(task?.priority || 'medium');
  const [categoryId, setCategoryId] = useState<string | null>(task?.categoryId || null);
  
  const [dueDate, setDueDate] = useState<Date | null>(task?.dueDate ? new Date(task.dueDate) : null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [hasReminder, setHasReminder] = useState(!!task?.reminderAt);
  const [reminderTime, setReminderTime] = useState<Date | null>(task?.reminderAt ? new Date(task.reminderAt) : null);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [showSheet, setShowSheet] = useState<'status' | 'priority' | 'category' | null>(null);

  if (!task) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <Text className="text-textPrimary">Task not found.</Text>
        <Pressable onPress={() => router.back()} className="mt-4 bg-primary px-4 py-2 rounded-lg">
          <Text className="text-white font-semibold">Back</Text>
        </Pressable>
      </View>
    );
  }

  const selectedCat = categories.find(c => c.id === (isEditing ? categoryId : task.categoryId));

  const handleSave = async () => {
    if (!title.trim()) return;
    
    const finalReminderAt = hasReminder && reminderTime ? reminderTime.getTime() : null;
    const finalDueDate = dueDate ? dueDate.getTime() : null;
    
    await updateTask(task.id, {
      title,
      notes: description,
      status,
      isCompleted: status === 'done' ? 1 : 0, // Sync isCompleted with status
      priority,
      categoryId,
      dueDate: finalDueDate,
      reminderAt: finalReminderAt
    });
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsEditing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            await deleteTask(task.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.back();
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background pt-4">
      {/* HEADER */}
      <View className="px-6 h-12 flex-row justify-between items-center mb-2">
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => router.back()} className="p-1 -ml-1">
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </Pressable>
          <Text className="text-xl font-bold text-textPrimary">{isEditing ? 'Edit Task' : 'Task Details'}</Text>
        </View>
        <View className="flex-row gap-2">
          {isEditing ? (
            <Pressable 
              onPress={handleSave} 
              disabled={!title.trim()}
              className={`px-4 py-1.5 rounded-full ${title.trim() ? 'bg-primary' : 'bg-gray-200'}`}
            >
              <Text className={`font-semibold ${title.trim() ? 'text-white' : 'text-gray-400'}`}>Save</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => {
              // Reset edit state to match DB state in case it was discarded earlier
              setTitle(task.title);
              setDescription(task.notes || '');
              setStatus(task.status);
              setPriority(task.priority);
              setCategoryId(task.categoryId || null);
              setDueDate(task.dueDate ? new Date(task.dueDate) : null);
              setHasReminder(!!task.reminderAt);
              setReminderTime(task.reminderAt ? new Date(task.reminderAt) : null);
              setIsEditing(true);
            }} className="bg-sky-50 px-4 py-1.5 rounded-full">
              <Text className="text-primary font-semibold">Edit</Text>
            </Pressable>
          )}
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          
          {isEditing ? (
            // ================= EDIT MODE =================
            <View>
              {/* TITLE */}
              <TextInput
                className="text-2xl font-semibold text-textPrimary mt-4 mb-2 py-2 border-b border-gray-100"
                placeholder="Task title..."
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={setTitle}
                autoFocus
              />

              {/* NOTES */}
              <TextInput
                className="text-base text-textSecondary mb-6 py-2 border-b border-gray-100"
                placeholder="Add notes..."
                placeholderTextColor="#94A3B8"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* STATUS DROPDOWN */}
              <Pressable 
                className="flex-row justify-between items-center py-4 border-b border-gray-100"
                onPress={() => setShowSheet('status')}
              >
                <View className="flex-row items-center">
                  <Ionicons name="ellipse-outline" size={20} color="#64748B" className="mr-3" />
                  <Text className="text-base text-textPrimary">Status</Text>
                </View>
                <View className="flex-row items-center">
                  <Text className="text-sm font-medium text-textSecondary capitalize mr-2">
                    {status.replace('_', ' ')}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#CBD5E1" />
                </View>
              </Pressable>

              {/* PRIORITY DROPDOWN */}
              <Pressable 
                className="flex-row justify-between items-center py-4 border-b border-gray-100"
                onPress={() => setShowSheet('priority')}
              >
                <View className="flex-row items-center">
                  <Ionicons name="flag-outline" size={20} color="#64748B" className="mr-3" />
                  <Text className="text-base text-textPrimary">Priority</Text>
                </View>
                <View className="flex-row items-center">
                  <Text className="text-sm font-medium text-textSecondary capitalize mr-2">
                    {priority}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#CBD5E1" />
                </View>
              </Pressable>

              {/* CATEGORY DROPDOWN */}
              <Pressable 
                className="flex-row justify-between items-center py-4 border-b border-gray-100"
                onPress={() => setShowSheet('category')}
              >
                <View className="flex-row items-center">
                  <Ionicons name="folder-outline" size={20} color="#64748B" className="mr-3" />
                  <Text className="text-base text-textPrimary">Category</Text>
                </View>
                <View className="flex-row items-center">
                  {selectedCat ? (
                    <View className="flex-row items-center mr-2">
                      <Ionicons name={selectedCat.icon as any} size={14} color={selectedCat.color} className="mr-1" />
                      <Text style={{ color: selectedCat.color }} className="text-sm font-medium">{selectedCat.name}</Text>
                    </View>
                  ) : (
                    <Text className="text-sm font-medium text-textSecondary mr-2">None</Text>
                  )}
                  <Ionicons name="chevron-down" size={16} color="#CBD5E1" />
                </View>
              </Pressable>

              {/* DUE DATE */}
              <Pressable 
                className="flex-row justify-between items-center py-4 border-b border-gray-100"
                onPress={() => setShowDatePicker(true)}
              >
                <View className="flex-row items-center">
                  <Ionicons name="calendar-outline" size={20} color="#64748B" className="mr-3" />
                  <Text className="text-base text-textPrimary">Due Date</Text>
                </View>
                <View className="flex-row items-center">
                  <Text className="text-sm font-medium text-textSecondary mr-2">
                    {dueDate ? format(dueDate, 'd MMM yyyy', { locale: localeId }) : 'Select date'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#CBD5E1" />
                </View>
              </Pressable>

              {/* REMINDER */}
              <View className="flex-row justify-between items-center py-4 border-b border-gray-100">
                <View className="flex-row items-center">
                  <Ionicons name="notifications-outline" size={20} color="#64748B" className="mr-3" />
                  <Text className="text-base text-textPrimary">Reminder</Text>
                </View>
                <Switch 
                  value={hasReminder} 
                  onValueChange={(val) => {
                    setHasReminder(val);
                    if (val && !reminderTime) {
                      setShowTimePicker(true);
                    }
                  }}
                  trackColor={{ false: "#E2E8F0", true: "#38BDF8" }}
                />
              </View>

              {/* REMINDER TIME */}
              {hasReminder && reminderTime && (
                <Pressable 
                  className="flex-row justify-between items-center py-4 border-b border-gray-100 ml-8"
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text className="text-base text-textPrimary">Time</Text>
                  <Text className="text-sm font-medium text-primary">
                    {format(reminderTime, 'hh:mm a', { locale: localeId })}
                  </Text>
                </Pressable>
              )}
            </View>
          ) : (
            // ================= VIEW MODE =================
            <View className="mt-4">
              <Text className="text-2xl font-bold text-textPrimary mb-4">{task.title}</Text>
              
              {/* Badges Container */}
              <View className="flex-row flex-wrap gap-2 mb-6">
                {/* Status Badge */}
                <View className={`flex-row items-center px-3 py-1.5 rounded-full ${task.status === 'done' ? 'bg-green-100' : task.status === 'in_progress' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <Ionicons name={task.status === 'done' ? 'checkmark-circle' : task.status === 'in_progress' ? 'time' : 'ellipse-outline'} size={14} color={task.status === 'done' ? '#10B981' : task.status === 'in_progress' ? '#3B82F6' : '#64748B'} className="mr-1.5" />
                  <Text className={`font-semibold text-xs capitalize ${task.status === 'done' ? 'text-green-700' : task.status === 'in_progress' ? 'text-blue-700' : 'text-gray-600'}`}>
                    {task.status.replace('_', ' ')}
                  </Text>
                </View>
                
                {/* Priority Badge */}
                <View className={`flex-row items-center px-3 py-1.5 rounded-full ${task.priority === 'high' ? 'bg-red-100' : task.priority === 'medium' ? 'bg-orange-100' : 'bg-green-100'}`}>
                  <Ionicons name="flag" size={14} color={task.priority === 'high' ? '#EF4444' : task.priority === 'medium' ? '#F59E0B' : '#10B981'} className="mr-1.5" />
                  <Text className={`font-semibold text-xs capitalize ${task.priority === 'high' ? 'text-red-700' : task.priority === 'medium' ? 'text-orange-700' : 'text-green-700'}`}>
                    {task.priority} Priority
                  </Text>
                </View>

                {/* Category Badge */}
                {selectedCat && (
                  <View className="flex-row items-center px-3 py-1.5 rounded-full" style={{ backgroundColor: `${selectedCat.color}15` }}>
                    <Ionicons name={selectedCat.icon as any} size={14} color={selectedCat.color} className="mr-1.5" />
                    <Text style={{ color: selectedCat.color }} className="font-semibold text-xs">
                      {selectedCat.name}
                    </Text>
                  </View>
                )}
              </View>

              {/* Notes */}
              <View className="mb-8">
                <Text className="text-sm font-bold text-textSecondary mb-2 uppercase tracking-wider">Notes</Text>
                <View className="bg-gray-50 p-4 rounded-2xl">
                  {task.notes ? (
                    <Text className="text-base text-textPrimary leading-relaxed">
                      {task.notes}
                    </Text>
                  ) : (
                    <Text className="text-base text-gray-400 italic">No notes provided.</Text>
                  )}
                </View>
              </View>

              {/* Due Date & Reminder */}
              <View className="space-y-4 border-t border-gray-100 pt-6">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 bg-sky-50 rounded-full items-center justify-center mr-3">
                      <Ionicons name="calendar" size={20} color="#0284C7" />
                    </View>
                    <Text className="text-textSecondary font-medium">Due Date</Text>
                  </View>
                  <Text className="font-semibold text-textPrimary">
                    {task.dueDate ? format(new Date(task.dueDate), 'd MMM yyyy', { locale: localeId }) : 'None'}
                  </Text>
                </View>
                
                {task.reminderAt && (
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 bg-purple-50 rounded-full items-center justify-center mr-3">
                        <Ionicons name="notifications" size={20} color="#9333EA" />
                      </View>
                      <Text className="text-textSecondary font-medium">Reminder</Text>
                    </View>
                    <Text className="font-semibold text-textPrimary">
                      {format(new Date(task.reminderAt), 'hh:mm a', { locale: localeId })}
                    </Text>
                  </View>
                )}
              </View>

              {/* Quick Actions */}
              <View className="mt-8 border-t border-gray-100 pt-6">
                <Text className="text-sm font-bold text-textSecondary mb-4 uppercase tracking-wider">Quick Actions</Text>
                <Pressable 
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    toggleComplete(task.id, task.isCompleted);
                  }}
                  className={`mb-3 py-4 rounded-xl flex-row justify-center items-center ${task.isCompleted ? 'bg-gray-100' : 'bg-primary'}`}
                >
                  <Ionicons name={task.isCompleted ? 'arrow-undo' : 'checkmark'} size={20} color={task.isCompleted ? '#64748B' : '#fff'} className="mr-2" />
                  <Text className={`font-bold ${task.isCompleted ? 'text-gray-600' : 'text-white'}`}>
                    {task.isCompleted ? 'Mark as Undone' : 'Mark as Done'}
                  </Text>
                </Pressable>

                <Pressable 
                  onPress={handleDelete}
                  className="py-4 rounded-xl flex-row justify-center items-center bg-red-50"
                >
                  <Ionicons name="trash" size={20} color="#EF4444" className="mr-2" />
                  <Text className="font-bold text-red-500">Delete Task</Text>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* DATE PICKERS */}
      {showDatePicker && (
        <DateTimePicker
          value={dueDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (event.type === 'set' && selectedDate) {
              setDueDate(selectedDate);
            }
          }}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={reminderTime || new Date(Date.now() + 15 * 60 * 1000)}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={(event, selectedDate) => {
            setShowTimePicker(false);
            if (event.type === 'set' && selectedDate) {
              setReminderTime(selectedDate);
            } else if (!reminderTime) {
              setHasReminder(false);
            }
          }}
        />
      )}

      {/* BOTTOM SHEET MODAL (EDIT MODE) */}
      <Modal visible={showSheet !== null} transparent animationType="fade">
        <View className="flex-1 justify-end bg-black/30">
          <Pressable className="flex-1" onPress={() => setShowSheet(null)} />
          <Animated.View 
            entering={SlideInDown} 
            exiting={SlideOutDown}
            className="bg-white rounded-t-3xl p-6 min-h-[300px]"
          >
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-textPrimary">
                {showSheet === 'status' ? 'Select Status' : showSheet === 'priority' ? 'Select Priority' : 'Select Category'}
              </Text>
              <Pressable onPress={() => setShowSheet(null)}>
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </Pressable>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {showSheet === 'status' && (
                <View className="space-y-3 pb-8">
                  {['todo', 'in_progress', 'done'].map(s => (
                    <Pressable 
                      key={s}
                      className={`p-4 mb-3 rounded-xl border ${status === s ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                      onPress={() => { setStatus(s as 'todo'|'in_progress'|'done'); setShowSheet(null); }}
                    >
                      <Text className={`font-semibold capitalize ${status === s ? 'text-primary' : 'text-textPrimary'}`}>
                        {s.replace('_', ' ')}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {showSheet === 'priority' && (
                <View className="space-y-3 pb-8">
                  {['low', 'medium', 'high'].map(p => (
                    <Pressable 
                      key={p}
                      className={`p-4 mb-3 rounded-xl border ${priority === p ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                      onPress={() => { setPriority(p as 'low'|'medium'|'high'); setShowSheet(null); }}
                    >
                      <Text className={`font-semibold capitalize ${priority === p ? 'text-primary' : 'text-textPrimary'}`}>{p}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {showSheet === 'category' && (
                <View className="space-y-3 pb-8">
                  <Pressable 
                    className={`p-4 mb-3 rounded-xl border ${categoryId === null ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                    onPress={() => { setCategoryId(null); setShowSheet(null); }}
                  >
                    <Text className={`font-semibold ${categoryId === null ? 'text-primary' : 'text-textPrimary'}`}>None</Text>
                  </Pressable>
                  {categories.map(c => (
                    <Pressable 
                      key={c.id}
                      className={`flex-row mb-3 items-center p-4 rounded-xl border ${categoryId === c.id ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                      onPress={() => { setCategoryId(c.id); setShowSheet(null); }}
                    >
                      <Ionicons name={c.icon as any} size={18} color={c.color} className="mr-3" />
                      <Text className={`font-semibold ${categoryId === c.id ? 'text-primary' : 'text-textPrimary'}`}>{c.name}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
