import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Switch, ScrollView, Modal, Platform, KeyboardAvoidingView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTaskStore } from '../../store/useTaskStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday } from 'date-fns';
import { enUS as localeId } from 'date-fns/locale';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// Helper to parse time string (e.g. "12:00 - 15:00" or "19:00") into Date objects for the pickers
const parseTimeToDates = (timeStr?: string | null) => {
  if (!timeStr) return { start: null, end: null };
  const parts = timeStr.split('-').map(p => p.trim());
  
  const parsePart = (str: string) => {
    if (!str) return null;
    const [hours, minutes] = str.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  const start = parts[0] ? parsePart(parts[0]) : null;
  const end = parts[1] ? parsePart(parts[1]) : null;
  return { start, end };
};

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const tasks = useTaskStore(state => state.tasks);
  const updateTask = useTaskStore(state => state.updateTask);
  const deleteTask = useTaskStore(state => state.deleteTask);
  const toggleComplete = useTaskStore(state => state.toggleComplete);
  const categories = useCategoryStore(state => state.categories);
  
  const task = tasks.find(t => t.id === id);

  const initialTimes = parseTimeToDates(task?.time);

  // States
  const [isEditing, setIsEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.notes || '');
  const [status, setStatus] = useState<'todo'|'in_progress'|'done'>(task?.status || 'todo');
  const [priority, setPriority] = useState<'low'|'medium'|'high'>(task?.priority || 'medium');
  const [categoryId, setCategoryId] = useState<string | null>(task?.categoryId || null);
  
  const [dueDate, setDueDate] = useState<Date | null>(task?.dueDate ? new Date(task.dueDate) : null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [startTime, setStartTime] = useState<Date | null>(initialTimes.start);
  const [endTime, setEndTime] = useState<Date | null>(initialTimes.end);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
  const [hasReminder, setHasReminder] = useState(!!task?.reminderAt);
  const [reminderTime, setReminderTime] = useState<Date | null>(task?.reminderAt ? new Date(task.reminderAt) : null);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [showSheet, setShowSheet] = useState<'status' | 'priority' | 'category' | null>(null);

  if (!task) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
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
    
    let calculatedTime: string | null = null;
    if (startTime && endTime) {
      calculatedTime = `${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`;
    } else if (startTime) {
      calculatedTime = format(startTime, 'HH:mm');
    } else if (endTime) {
      calculatedTime = format(endTime, 'HH:mm');
    }

    const finalReminderAt = hasReminder && reminderTime ? reminderTime.getTime() : null;
    const finalDueDate = dueDate ? dueDate.getTime() : null;
    
    await updateTask(task.id, {
      title,
      notes: description,
      status,
      isCompleted: status === 'done', // Sync isCompleted with status
      priority,
      categoryId,
      time: calculatedTime,
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

  const formattedDate = task.dueDate ? (
    isToday(new Date(task.dueDate)) 
      ? `Today, ${format(new Date(task.dueDate), 'd MMMM yyyy')}` 
      : format(new Date(task.dueDate), 'EEEE, d MMMM yyyy')
  ) : 'None';

  const formattedTime = task.time || (task.reminderAt 
    ? format(new Date(task.reminderAt), 'hh:mm a') 
    : 'None');

  const priorityColorClass = task.priority === 'high' 
    ? 'text-red-500' 
    : task.priority === 'medium' 
    ? 'text-amber-500' 
    : 'text-blue-500';

  return (
    <SafeAreaView className="flex-1 bg-white pt-4">
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
            <Pressable 
              onPress={() => setShowMenu(true)} 
              className="w-10 h-10 bg-surface rounded-full items-center justify-center shadow-sm"
            >
              <Ionicons name="ellipsis-vertical" size={20} color="#0F172A" />
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
                multiline
                scrollEnabled={false}
                textAlignVertical="top"
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

              {/* TIME ROW (INLINE START & END) */}
              <View className="flex-row justify-between items-center py-4 border-b border-gray-100">
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={20} color="#64748B" className="mr-3" />
                  <Text className="text-base text-textPrimary">Time</Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  {/* Start Time Pill */}
                  <Pressable 
                    onPress={() => setShowStartTimePicker(true)}
                    className="px-2.5 py-1 bg-surface rounded-lg border border-gray-200"
                  >
                    <Text className={`text-sm font-semibold ${startTime ? 'text-textPrimary' : 'text-textSecondary'}`}>
                      {startTime ? format(startTime, 'HH:mm') : '--:--'}
                    </Text>
                  </Pressable>

                  <Text className="text-textSecondary font-bold text-xs">-</Text>

                  {/* End Time Pill */}
                  <Pressable 
                    onPress={() => setShowEndTimePicker(true)}
                    className="px-2.5 py-1 bg-surface rounded-lg border border-gray-200"
                  >
                    <Text className={`text-sm font-semibold ${endTime ? 'text-textPrimary' : 'text-textSecondary'}`}>
                      {endTime ? format(endTime, 'HH:mm') : '--:--'}
                    </Text>
                  </Pressable>

                  {(startTime || endTime) && (
                    <Pressable 
                      onPress={() => { setStartTime(null); setEndTime(null); }}
                      className="ml-1 p-0.5"
                    >
                      <Ionicons name="close-circle" size={18} color="#94A3B8" />
                    </Pressable>
                  )}
                </View>
              </View>

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
              {/* TASK TITLE */}
              <Text className="text-2xl font-bold text-textPrimary mb-4">{task.title}</Text>
              
              {/* METADATA LIST (Unboxed, evenly aligned) */}
              <View className="mb-6 py-2 border-b border-gray-100">
                {/* Status Row */}
                <View className="flex-row items-center py-1.5">
                  <View className="w-28 flex-row items-center">
                    <Ionicons name="ellipse-outline" size={15} color="#94A3B8" className="mr-2" />
                    <Text className="text-xs font-medium text-textSecondary">Status</Text>
                  </View>
                  <Text className="text-xs font-semibold text-textSecondary capitalize">
                    {task.status.replace('_', ' ')}
                  </Text>
                </View>

                {/* Date Row */}
                <View className="flex-row items-center py-1.5">
                  <View className="w-28 flex-row items-center">
                    <Ionicons name="calendar-outline" size={15} color="#94A3B8" className="mr-2" />
                    <Text className="text-xs font-medium text-textSecondary">Date</Text>
                  </View>
                  <Text className="text-xs font-semibold text-textSecondary">
                    {formattedDate}
                  </Text>
                </View>

                {/* Time Row */}
                <View className="flex-row items-center py-1.5">
                  <View className="w-28 flex-row items-center">
                    <Ionicons name="time-outline" size={15} color="#94A3B8" className="mr-2" />
                    <Text className="text-xs font-medium text-textSecondary">Time</Text>
                  </View>
                  <Text className="text-xs font-semibold text-textSecondary">
                    {formattedTime}
                  </Text>
                </View>

                {/* Priority Row */}
                <View className="flex-row items-center py-1.5">
                  <View className="w-28 flex-row items-center">
                    <Ionicons name="flag-outline" size={15} color="#94A3B8" className="mr-2" />
                    <Text className="text-xs font-medium text-textSecondary">Priority</Text>
                  </View>
                  <Text className={`text-xs font-bold capitalize ${priorityColorClass}`}>
                    {task.priority}
                  </Text>
                </View>

                {/* Category Row */}
                <View className="flex-row items-center py-1.5">
                  <View className="w-28 flex-row items-center">
                    <Ionicons name="folder-outline" size={15} color="#94A3B8" className="mr-2" />
                    <Text className="text-xs font-medium text-textSecondary">Category</Text>
                  </View>
                  {selectedCat ? (
                    <View className="flex-row items-center">
                      <Ionicons name={selectedCat.icon as any} size={13} color={selectedCat.color} className="mr-1.5" />
                      <Text style={{ color: selectedCat.color }} className="text-xs font-semibold">
                        {selectedCat.name}
                      </Text>
                    </View>
                  ) : (
                    <Text className="text-xs font-semibold text-textSecondary">None</Text>
                  )}
                </View>
              </View>

              {/* NOTES */}
              <View className="mb-6">
                <Text className="text-sm font-bold text-textSecondary mb-2 uppercase tracking-wider">Notes</Text>
                <View className="bg-gray-50 p-4 rounded-2xl border border-gray-100/60">
                  {task.notes ? (
                    <Text className="text-base text-textPrimary leading-relaxed">
                      {task.notes}
                    </Text>
                  ) : (
                    <Text className="text-sm text-gray-400 italic">No notes provided.</Text>
                  )}
                </View>
              </View>

              {/* QUICK ACTIONS */}
              <View className="mt-2 pt-2">
                <Text className="text-sm font-bold text-textSecondary mb-3 uppercase tracking-wider">Quick Actions</Text>
                <Pressable 
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    toggleComplete(task.id, task.isCompleted);
                  }}
                  className={`py-4 rounded-xl flex-row justify-center items-center ${task.isCompleted ? 'bg-gray-100' : 'bg-primary'}`}
                >
                  <Ionicons name={task.isCompleted ? 'arrow-undo' : 'checkmark'} size={20} color={task.isCompleted ? '#64748B' : '#fff'} className="mr-2" />
                  <Text className={`font-bold ${task.isCompleted ? 'text-gray-600' : 'text-white'}`}>
                    {task.isCompleted ? 'Mark as Undone' : 'Mark as Done'}
                  </Text>
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

      {/* START TIME PICKER */}
      {showStartTimePicker && (
        <DateTimePicker
          value={startTime || new Date()}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartTimePicker(false);
            if (event.type === 'set' && selectedDate) {
              setStartTime(selectedDate);
            }
          }}
        />
      )}

      {/* END TIME PICKER */}
      {showEndTimePicker && (
        <DateTimePicker
          value={endTime || (startTime ? new Date(startTime.getTime() + 60 * 60 * 1000) : new Date())}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndTimePicker(false);
            if (event.type === 'set' && selectedDate) {
              setEndTime(selectedDate);
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

      {/* 3-DOTS ACTION MENU MODAL */}
      <Modal visible={showMenu} transparent animationType="fade">
        <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setShowMenu(false)}>
          <Animated.View 
            entering={SlideInDown} 
            exiting={SlideOutDown}
            className="bg-white rounded-t-3xl p-6 pb-10"
          >
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-lg font-bold text-textPrimary">Task Options</Text>
              <Pressable onPress={() => setShowMenu(false)}>
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </Pressable>
            </View>

            <View className="space-y-3">
              <Pressable 
                onPress={() => {
                  setShowMenu(false);
                  setTitle(task.title);
                  setDescription(task.notes || '');
                  setStatus(task.status);
                  setPriority(task.priority);
                  setCategoryId(task.categoryId || null);
                  setDueDate(task.dueDate ? new Date(task.dueDate) : null);
                  const parsed = parseTimeToDates(task.time);
                  setStartTime(parsed.start);
                  setEndTime(parsed.end);
                  setHasReminder(!!task.reminderAt);
                  setReminderTime(task.reminderAt ? new Date(task.reminderAt) : null);
                  setIsEditing(true);
                }}
                className="flex-row items-center p-4 bg-gray-50 rounded-2xl mb-3"
              >
                <View className="w-9 h-9 rounded-full bg-blue-50 items-center justify-center mr-3">
                  <Ionicons name="create-outline" size={20} color="#0284C7" />
                </View>
                <Text className="text-base font-semibold text-textPrimary">Edit Task</Text>
              </Pressable>

              <Pressable 
                onPress={() => {
                  setShowMenu(false);
                  handleDelete();
                }}
                className="flex-row items-center p-4 bg-red-50/70 rounded-2xl"
              >
                <View className="w-9 h-9 rounded-full bg-red-100 items-center justify-center mr-3">
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </View>
                <Text className="text-base font-semibold text-red-500">Delete Task</Text>
              </Pressable>
            </View>
          </Animated.View>
        </Pressable>
      </Modal>

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
