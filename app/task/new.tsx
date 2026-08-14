import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useTaskStore } from '../../store/useTaskStore';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function NewTaskScreen() {
  const router = useRouter();
  const addTask = useTaskStore(state => state.addTask);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low'|'medium'|'high'>('medium');
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
      dueDate: finalDueDate,
      reminderAt: finalReminderAt
    });
    
    router.back();
  };

  return (
    <View className="flex-1 bg-background p-6">
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-2xl font-bold text-textPrimary">Tugas Baru</Text>
        <Pressable onPress={() => router.back()} className="p-2 bg-surface rounded-full">
          <Text className="text-textSecondary font-semibold">Batal</Text>
        </Pressable>
      </View>

      <Text className="text-sm font-semibold text-textSecondary mb-2">JUDUL TUGAS</Text>
      <TextInput
        className="bg-surface p-4 rounded-xl text-base text-textPrimary mb-4"
        placeholder="Apa yang perlu diselesaikan?"
        placeholderTextColor="#94A3B8"
        value={title}
        onChangeText={setTitle}
        autoFocus
      />

      <Text className="text-sm font-semibold text-textSecondary mb-2">CATATAN (OPSIONAL)</Text>
      <TextInput
        className="bg-surface p-4 rounded-xl text-base text-textPrimary mb-6"
        placeholder="Tambahkan detail..."
        placeholderTextColor="#94A3B8"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      <Text className="text-sm font-semibold text-textSecondary mb-2">PRIORITAS</Text>
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

      <Text className="text-sm font-semibold text-textSecondary mb-2">TANGGAL TENGGAT (DUE DATE)</Text>
      <Pressable 
        onPress={() => setShowDatePicker(true)}
        className="bg-surface p-4 rounded-xl mb-6 flex-row justify-between items-center"
      >
        <Text className="text-base text-textPrimary">
          {dueDate ? dueDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Pilih Tanggal'}
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

      <Text className="text-sm font-semibold text-textSecondary mb-2">PENGINGAT (OPSIONAL)</Text>
      <View className="bg-surface p-4 rounded-xl mb-8 flex-row justify-between items-center">
        <View>
          <Text className="text-base font-semibold text-textPrimary">Aktifkan Pengingat</Text>
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
          <Text className="text-primary font-semibold">Ubah Waktu Pengingat</Text>
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
        <Text className="text-white font-bold text-lg">Simpan Tugas</Text>
      </Pressable>
    </View>
  );
}
