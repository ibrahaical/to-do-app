import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, TextInput, FlatList, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTaskStore } from '../store/useTaskStore';
import { TaskCard } from '../components/task/TaskCard';
import { EmptyState } from '../components/ui/EmptyState';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function SearchScreen() {
  const router = useRouter();
  const tasks = useTaskStore(state => state.tasks);
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  // Auto-focus keyboard saat halaman dibuka
  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    
    const lowerQuery = query.toLowerCase();
    return tasks.filter(task => 
      task.title.toLowerCase().includes(lowerQuery) || 
      (task.notes && task.notes.toLowerCase().includes(lowerQuery))
    );
  }, [query, tasks]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header & Search Bar */}
      <View className="px-4 py-3 flex-row items-center border-b border-gray-100 bg-white">
        <Pressable onPress={() => router.back()} className="p-2 mr-2">
          <Ionicons name="arrow-back" size={24} color="#334155" />
        </Pressable>
        
        <View className="flex-1 flex-row items-center bg-surface px-4 py-2.5 rounded-full border border-gray-200">
          <Ionicons name="search" size={20} color="#94A3B8" className="mr-2" />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Cari tugas atau catatan..."
            placeholderTextColor="#94A3B8"
            className="flex-1 ml-2 text-textPrimary text-base"
            returnKeyType="search"
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} className="p-1">
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Results */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        {!query.trim() ? (
          <View className="flex-1 justify-center items-center px-8 opacity-50">
            <Ionicons name="search" size={64} color="#CBD5E1" />
            <Text className="text-textSecondary text-center mt-4 text-base">
              Ketik judul atau catatan tugas untuk mulai mencari.
            </Text>
          </View>
        ) : searchResults.length === 0 ? (
          <EmptyState 
            title="Tidak ditemukan" 
            message={`Kami tidak dapat menemukan tugas dengan kata kunci "${query}".`} 
            icon="search-outline" 
          />
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
            renderItem={({ item }) => (
              <View className="mb-4">
                <View className="flex-row items-center mb-2 px-1">
                  <View className={`w-2 h-2 rounded-full mr-2 ${item.isCompleted ? 'bg-green-500' : 'bg-primary'}`} />
                  <Text className="text-xs text-textSecondary font-medium">
                    {item.isCompleted ? 'Selesai' : (
                      item.dueDate ? format(new Date(item.dueDate), 'dd MMM yyyy', { locale: id }) : 'Hari Ini'
                    )}
                  </Text>
                </View>
                <TaskCard task={item} onPress={() => router.push(`/task/${item.id}` as any)} />
              </View>
            )}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
