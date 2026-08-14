import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, Switch, ScrollView, Modal, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTaskStore } from '../../store/useTaskStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { enUS as localeId } from 'date-fns/locale';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

export default function NewTaskScreen() {
  const router = useRouter();
  const addTask = useTaskStore(state => state.addTask);
  const categories = useCategoryStore(state => state.categories);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'todo'|'in_progress'|'done'>('todo');
  const [priority, setPriority] = useState<'low'|'medium'|'high'>('low');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [dueDate, setDueDate] = useState<Date | null>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState<Date | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [showSheet, setShowSheet] = useState<'status' | 'priority' | 'category' | null>(null);

  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      const personalCat = categories.find(c => c.name.toLowerCase() === 'personal');
      if (personalCat) {
        setCategoryId(personalCat.id);
      }
    }
  }, [categories]);

  const handleSave = async () => {
    if (!title.trim()) return;
    
    const finalReminderAt = hasReminder && reminderTime ? reminderTime.getTime() : undefined;
    const finalDueDate = dueDate ? dueDate.getTime() : undefined;
    
    await addTask({
      title,
      description,
      status,
      priority,
      categoryId,
      dueDate: finalDueDate,
      reminderAt: finalReminderAt
    });
    
    router.back();
  };

  const selectedCat = categories.find(c => c.id === categoryId);

  return (
    <SafeAreaView className="flex-1 bg-background pt-4">
      {/* HEADER */}
      <View className="px-6 h-12 flex-row justify-between items-center mb-2">
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => router.back()} className="p-1 -ml-1">
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </Pressable>
          <Text className="text-xl font-bold text-textPrimary">Add new task</Text>
        </View>
        <Pressable 
          onPress={handleSave} 
          disabled={!title.trim()}
          className={`px-4 py-1.5 rounded-full ${title.trim() ? 'bg-primary' : 'bg-gray-200'}`}
        >
          <Text className={`font-semibold ${title.trim() ? 'text-white' : 'text-gray-400'}`}>Save</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

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

        {/* ADVANCED TOGGLE */}
        <Pressable 
          className="flex-row items-center py-4 border-b border-gray-100"
          onPress={() => setShowAdvanced(!showAdvanced)}
        >
          <Ionicons name={showAdvanced ? "chevron-down" : "chevron-forward"} size={20} color="#64748B" className="mr-3" />
          <Text className="text-base text-textPrimary font-medium">Advanced Options</Text>
        </Pressable>

        {showAdvanced && (
          <View className="pl-4 border-b border-gray-100 bg-gray-50/30">
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
              className="flex-row justify-between items-center py-4"
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
                  <Text className="text-sm font-medium text-textSecondary mr-2">Personal</Text>
                )}
                <Ionicons name="chevron-down" size={16} color="#CBD5E1" />
              </View>
            </Pressable>
          </View>
        )}

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

      {/* BOTTOM SHEET MODAL */}
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
