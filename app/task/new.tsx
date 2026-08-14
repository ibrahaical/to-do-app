import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Switch, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTaskStore } from '../../store/useTaskStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

export default function NewTaskScreen() {
  const router = useRouter();
  const addTask = useTaskStore(state => state.addTask);
  const categories = useCategoryStore(state => state.categories);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low'|'medium'|'high'>('medium');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(new Date()); // Default hari ini
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState<Date | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    
    const finalReminderAt = hasReminder && reminderTime ? reminderTime.getTime() : undefined;
    const finalDueDate = dueDate ? dueDate.getTime() : undefined;
    
    await addTask({
      title,
      description,
      priority,
      categoryId,
      dueDate: finalDueDate,
      reminderAt: finalReminderAt
    });
    
    router.back();
  };

  return (
    <View className="flex-1 bg-background p-6">
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-2xl font-bold text-textPrimary">New Task</Text>
        <Pressable onPress={() => router.back()} className="p-2 bg-surface rounded-full">
          <Text className="text-textSecondary font-semibold">Cancel</Text>
        </Pressable>
      </View>

      <Text className="text-sm font-semibold text-textSecondary mb-2">TASK TITLE</Text>
      <TextInput
        className="bg-surface p-4 rounded-xl text-base text-textPrimary mb-4"
        placeholder="What needs to be done?"
        placeholderTextColor="#94A3B8"
        value={title}
        onChangeText={setTitle}
        autoFocus
      />

      <Text className="text-sm font-semibold text-textSecondary mb-2">NOTES (OPTIONAL)</Text>
      <TextInput
        className="bg-surface p-4 rounded-xl text-base text-textPrimary mb-6"
        placeholder="Add details..."
        placeholderTextColor="#94A3B8"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      <Text className="text-sm font-semibold text-textSecondary mb-2">PRIORITY</Text>
      <View className="flex-row justify-between mb-6">
        {(['low', 'medium', 'high'] as const).map((p) => (
          <Pressable
            key={p}
            onPress={() => setPriority(p)}
            className={`flex-1 items-center p-3 rounded-lg mx-1 ${priority === p ? (p === 'high' ? 'bg-priorityHigh' : p === 'medium' ? 'bg-priorityMedium' : 'bg-priorityLow') : 'bg-surface'}`}
          >
            <Text className={`font-semibold capitalize ${priority === p ? 'text-white' : 'text-textSecondary'}`}>
              {p}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text className="text-sm font-semibold text-textSecondary mb-2">CATEGORY (OPTIONAL)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
        {categories.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => setCategoryId(categoryId === c.id ? null : c.id)}
            className={`flex-row items-center px-4 py-2 rounded-full mr-3 ${categoryId === c.id ? 'border' : 'bg-surface'}`}
            style={{ 
              backgroundColor: categoryId === c.id ? `${c.color}20` : undefined,
              borderColor: categoryId === c.id ? c.color : undefined
            }}
          >
            <Ionicons name={c.icon as any} size={16} color={categoryId === c.id ? c.color : '#94A3B8'} className="mr-2" />
            <Text style={{ color: categoryId === c.id ? c.color : '#64748B' }} className="font-semibold">
              {c.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text className="text-sm font-semibold text-textSecondary mb-2">DUE DATE</Text>
      <Pressable 
        onPress={() => setShowDatePicker(true)}
        className="bg-surface p-4 rounded-xl mb-6 flex-row justify-between items-center"
      >
        <Text className="text-base text-textPrimary">
          {dueDate ? dueDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Select Date'}
        </Text>
      </Pressable>

      {showDatePicker && (
        <DateTimePicker
          value={dueDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setDueDate(selectedDate);
            }
          }}
        />
      )}

      <Text className="text-sm font-semibold text-textSecondary mb-2">REMINDER (OPTIONAL)</Text>
      <View className="bg-surface p-4 rounded-xl mb-8 flex-row justify-between items-center">
        <View>
          <Text className="text-base font-semibold text-textPrimary">Enable Reminder</Text>
          {hasReminder && reminderTime && (
            <Text className="text-sm text-primary font-medium mt-1">
              {reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>
        <Switch 
          value={hasReminder} 
          onValueChange={(val) => {
            setHasReminder(val);
            if (val && !reminderTime) {
              setReminderTime(new Date(Date.now() + 15 * 60 * 1000)); // Default 15 min later
              setShowTimePicker(true);
            }
          }}
          trackColor={{ false: "#E2E8F0", true: "#38BDF8" }}
        />
      </View>

      {hasReminder && (
        <Pressable 
          onPress={() => setShowTimePicker(true)}
          className="bg-sky-50 p-4 rounded-xl mb-8 flex-row items-center justify-center border border-sky-100"
        >
          <Text className="text-primary font-semibold">Change Reminder Time</Text>
        </Pressable>
      )}

      {showTimePicker && (
        <DateTimePicker
          value={reminderTime || new Date()}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={(event, selectedDate) => {
            setShowTimePicker(false);
            if (selectedDate) {
              setReminderTime(selectedDate);
            } else {
              if (!reminderTime) setHasReminder(false);
            }
          }}
        />
      )}

      <Pressable 
        onPress={handleSave}
        disabled={!title.trim()}
        className={`p-4 rounded-xl items-center ${title.trim() ? 'bg-primary' : 'bg-gray-300'}`}
      >
        <Text className="text-white font-bold text-lg">Save Task</Text>
      </Pressable>
    </View>
  );
}
