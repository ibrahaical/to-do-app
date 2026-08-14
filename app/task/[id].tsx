import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, Alert, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTaskStore } from '../../store/useTaskStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import * as Haptics from 'expo-haptics';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const tasks = useTaskStore(state => state.tasks);
  const updateTask = useTaskStore(state => state.updateTask);
  const deleteTask = useTaskStore(state => state.deleteTask);
  const toggleComplete = useTaskStore(state => state.toggleComplete);
  
  const task = tasks.find(t => t.id === id);
  const categories = useCategoryStore(state => state.categories);

  const [title, setTitle] = useState(task?.title || '');
  const [notes, setNotes] = useState(task?.notes || '');
  const [categoryId, setCategoryId] = useState<string | null>(task?.categoryId || null);
  const [dueDate, setDueDate] = useState<Date | null>(task?.dueDate ? new Date(task.dueDate) : null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const selectedCategory = categories.find(c => c.id === (isEditing ? categoryId : task?.categoryId));

  if (!task) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <Text className="text-textPrimary">Task tidak ditemukan.</Text>
        <Pressable onPress={() => router.back()} className="mt-4 bg-primary px-4 py-2 rounded-lg">
          <Text className="text-white font-semibold">Kembali</Text>
        </Pressable>
      </View>
    );
  }

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Judul tidak boleh kosong');
      return;
    }
    
    await updateTask(task.id, { 
      title, 
      notes,
      categoryId,
      dueDate: dueDate ? dueDate.getTime() : null
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsEditing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Hapus Tugas',
      'Yakin ingin menghapus tugas ini?',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus', 
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
    <View className="flex-1 bg-background p-6 pt-12">
      <View className="flex-row items-center justify-between mb-6">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="close" size={28} color="#0F1B2A" />
        </Pressable>
        <View className="flex-row gap-2">
          {isEditing ? (
            <Pressable onPress={handleSave} className="bg-primary px-4 py-2 rounded-full">
              <Text className="text-white font-semibold">Simpan</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => setIsEditing(true)} className="bg-sky-100 px-4 py-2 rounded-full">
              <Text className="text-primary font-semibold">Edit</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View className="bg-surface p-6 rounded-3xl">
        {isEditing ? (
          <View>
            <TextInput
              value={title}
              onChangeText={setTitle}
              className="text-2xl font-bold text-textPrimary border-b border-gray-200 pb-2 mb-4"
              placeholder="Judul Tugas"
              autoFocus
            />
            <TextInput
              value={notes}
              onChangeText={setNotes}
              className="text-base text-textSecondary bg-gray-50 p-4 rounded-xl h-32 mb-4"
              placeholder="Catatan tambahan..."
              multiline
              textAlignVertical="top"
            />
            
            <Text className="text-sm font-semibold text-textSecondary mb-2">KATEGORI</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              {categories.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => setCategoryId(categoryId === c.id ? null : c.id)}
                  className={`flex-row items-center px-4 py-2 rounded-full mr-3 ${categoryId === c.id ? 'border' : 'bg-gray-50'}`}
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
            
            <Text className="text-sm font-semibold text-textSecondary mb-2">TANGGAL TENGGAT</Text>
            <Pressable 
              onPress={() => setShowDatePicker(true)}
              className="bg-gray-50 p-4 rounded-xl mb-2 flex-row justify-between items-center border border-gray-100"
            >
              <Text className="text-base text-textPrimary">
                {dueDate ? dueDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Pilih Tanggal'}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#94A3B8" />
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={dueDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setDueDate(selectedDate);
                }}
              />
            )}
          </View>
        ) : (
          <View>
            <Text className="text-2xl font-bold text-textPrimary mb-3">{task.title}</Text>
            {selectedCategory && (
              <View className="flex-row items-center self-start px-3 py-1 rounded-full mb-3" style={{ backgroundColor: `${selectedCategory.color}15` }}>
                <Ionicons name={selectedCategory.icon as any} size={14} color={selectedCategory.color} className="mr-1.5" />
                <Text style={{ color: selectedCategory.color }} className="font-semibold text-sm">
                  {selectedCategory.name}
                </Text>
              </View>
            )}
            {task.notes ? (
              <Text className="text-base text-textSecondary leading-relaxed bg-gray-50 p-4 rounded-xl">
                {task.notes}
              </Text>
            ) : (
              <Text className="text-base text-gray-400 italic">Tidak ada catatan tambahan.</Text>
            )}
          </View>
        )}
        
        <View className="mt-8 border-t border-gray-100 pt-6 space-y-4">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-sky-50 rounded-full items-center justify-center mr-3">
                <Ionicons name="calendar" size={18} color="#0284C7" />
              </View>
              <Text className="text-textSecondary font-medium">Tenggat</Text>
            </View>
            <Text className="font-semibold text-textPrimary">
              {task.dueDate ? new Date(task.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Tidak ada'}
            </Text>
          </View>

          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${task.isCompleted ? 'bg-green-100' : 'bg-sky-100'}`}>
                <Ionicons name={task.isCompleted ? 'checkmark-circle' : 'time'} size={18} color={task.isCompleted ? '#10B981' : '#0284C7'} />
              </View>
              <Text className="text-textSecondary font-medium">Status</Text>
            </View>
            <Pressable 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleComplete(task.id, task.isCompleted);
              }}
              className={`px-4 py-2 rounded-full ${task.isCompleted ? 'bg-green-100' : 'bg-gray-100'}`}
            >
              <Text className={`font-semibold ${task.isCompleted ? 'text-green-600' : 'text-gray-600'}`}>
                {task.isCompleted ? 'Selesai' : 'Berjalan'}
              </Text>
            </Pressable>
          </View>
          
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-orange-100 rounded-full items-center justify-center mr-3">
                <Ionicons name="flag" size={18} color="#F59E0B" />
              </View>
              <Text className="text-textSecondary font-medium">Prioritas</Text>
            </View>
            <Text className="font-semibold text-textPrimary capitalize">{task.priority}</Text>
          </View>
        </View>

        {!isEditing && (
          <Pressable 
            onPress={handleDelete}
            className="mt-6 flex-row items-center justify-center bg-red-50 p-4 rounded-2xl"
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" className="mr-2" />
            <Text className="text-red-500 font-semibold ml-2">Hapus Tugas</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
