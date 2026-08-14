import React, { useEffect, useState, useMemo, useRef } from 'react';
import { View, Text, Pressable, TextInput, FlatList, Modal, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, interpolate } from 'react-native-reanimated';
import { endOfToday, format } from 'date-fns';
import { enUS as localeId } from 'date-fns/locale';

import { useTaskStore } from '../../store/useTaskStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { ProgressRing } from '../../components/animations/ProgressRing';

export default function TaskScreen() {
  const router = useRouter();
  
  const tasks = useTaskStore(state => state.tasks);
  const fetchTasks = useTaskStore(state => state.fetchTasks);
  const isLoading = useTaskStore(state => state.isLoading);
  
  const categories = useCategoryStore(state => state.categories);
  const fetchCategories = useCategoryStore(state => state.fetchCategories);
  const seedCategories = useCategoryStore(state => state.seedCategories);
  
  const userName = useSettingsStore(state => state.userName);

  // States
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter states
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string | null>(null);
  
  // Modal states
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState<'category' | 'priority' | null>(null);

  const searchInputRef = useRef<TextInput>(null);
  const searchAnim = useSharedValue(0);

  useEffect(() => {
    fetchTasks();
    seedCategories().then(() => fetchCategories());
  }, []);

  useEffect(() => {
    searchAnim.value = withTiming(isSearching ? 1 : 0, { 
      duration: 300, 
      easing: Easing.out(Easing.ease) 
    });
    if (isSearching) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearching]);

  // Derived Data
  const todayMs = endOfToday().getTime();
  const allTodayTasks = tasks.filter(t => !t.dueDate || t.dueDate <= todayMs);
  
  const filteredTasks = useMemo(() => {
    let result = allTodayTasks;
    
    if (selectedCategoryFilter) {
      result = result.filter(t => t.categoryId === selectedCategoryFilter);
    }
    if (selectedPriorityFilter) {
      result = result.filter(t => t.priority === selectedPriorityFilter);
    }
    if (isSearching && searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(lowerQuery) || 
        (t.notes && t.notes.toLowerCase().includes(lowerQuery))
      );
    }
    
    return result;
  }, [allTodayTasks, selectedCategoryFilter, selectedPriorityFilter, isSearching, searchQuery]);

  const activeTasks = filteredTasks.filter(t => !t.isCompleted).sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0));
  
  // Progress
  const allFilteredCount = filteredTasks.length;
  const completedCount = filteredTasks.filter(t => t.isCompleted).length;
  const progressRatio = allFilteredCount > 0 ? completedCount / allFilteredCount : 0;

  const firstName = userName.split(' ')[0];

  // Styles
  const headerOpacityStyle = useAnimatedStyle(() => ({
    opacity: 1 - searchAnim.value,
    transform: [{ translateY: interpolate(searchAnim.value, [0, 1], [0, -20]) }]
  }));

  const searchBarStyle = useAnimatedStyle(() => ({
    opacity: searchAnim.value,
    transform: [{ translateX: interpolate(searchAnim.value, [0, 1], [50, 0]) }],
    zIndex: isSearching ? 10 : -1,
  }));

  return (
    <SafeAreaView className="flex-1 bg-background pt-4">
      {/* HEADER SECTION */}
      <View className="px-6 h-12 justify-center relative">
        {/* Normal Header */}
        <Animated.View className="flex-row justify-between items-center absolute inset-x-6" style={headerOpacityStyle}>
          <View>
            <Text className="text-xl font-bold text-textPrimary">Hello, {firstName} 👋</Text>
            <Text className="text-xs text-textSecondary mt-0.5">Focus on what matters today.</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <Pressable onPress={() => setShowFilterDropdown(true)} className="w-10 h-10 bg-surface rounded-full items-center justify-center shadow-sm relative">
              <Ionicons name="filter-outline" size={20} color="#64748B" />
              {(selectedCategoryFilter || selectedPriorityFilter) && (
                <View className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border border-white" />
              )}
            </Pressable>
            <Pressable onPress={() => setIsSearching(true)} className="w-10 h-10 bg-surface rounded-full items-center justify-center shadow-sm">
              <Ionicons name="search" size={20} color="#64748B" />
            </Pressable>
          </View>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View 
          className="absolute inset-x-6 flex-row items-center bg-surface px-4 py-2.5 rounded-full border border-gray-200"
          style={searchBarStyle}
          pointerEvents={isSearching ? 'auto' : 'none'}
        >
          <Pressable onPress={() => { setIsSearching(false); setSearchQuery(''); }} className="mr-2 p-1">
            <Ionicons name="arrow-back" size={20} color="#64748B" />
          </Pressable>
          <Ionicons name="search" size={18} color="#94A3B8" className="mr-2" />
          <TextInput
            ref={searchInputRef}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search today's tasks..."
            placeholderTextColor="#94A3B8"
            className="flex-1 text-base text-textPrimary py-0"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} className="p-1">
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </Pressable>
          )}
        </Animated.View>
      </View>

      {/* HERO PROGRESS SECTION */}
      <View className="items-center justify-center py-6">
        <ProgressRing progress={progressRatio} size={240} strokeWidth={5}>
          <View className="items-center justify-center">
            <Text className="text-6xl font-light text-textPrimary" style={{ fontWeight: '300' }}>
              {Math.round(progressRatio * 100)}<Text className="text-3xl">%</Text>
            </Text>
            <Text className="text-xs text-textSecondary mt-1 font-medium tracking-wider uppercase">
              {completedCount} of {allFilteredCount} completed
            </Text>
          </View>
        </ProgressRing>
      </View>

      {/* SUBHEADER */}
      <View className="px-6 py-4 flex-row justify-between items-center border-b border-gray-100 bg-white">
        <Text className="text-sm font-semibold text-textPrimary">Today task</Text>
        <Pressable onPress={() => router.push('/task/new')}>
          <Ionicons name="add" size={22} color="#0284C7" />
        </Pressable>
      </View>

      {/* TASK LIST */}
      <View className="flex-1 bg-white">
        {!isLoading && (
          <FlatList
            data={activeTasks}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingBottom: 100 }}
            renderItem={({ item }) => (
              <Pressable 
                onPress={() => router.push(`/task/${item.id}` as any)}
                className="flex-row py-4 px-6 border-b border-gray-100 items-center"
              >
                {/* Priority Pill */}
                <View className={`w-1.5 h-10 rounded-full mr-4 ${
                  item.isCompleted ? 'bg-gray-300' : 
                  item.priority === 'high' ? 'bg-red-500' : 
                  item.priority === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                }`} />
                
                <View className="flex-1">
                  <Text className={`text-base font-semibold ${item.isCompleted ? 'text-gray-400 line-through' : 'text-textPrimary'}`}>
                    {item.title}
                  </Text>
                  <Text className="text-xs text-textSecondary mt-1 font-medium">
                    {item.dueDate ? format(new Date(item.dueDate), 'hh:mm a', { locale: localeId }) : 'All Day'}
                  </Text>
                </View>
                
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </Pressable>
            )}
            ListEmptyComponent={
              <View className="mt-8 items-center">
                <Text className="text-sm text-textSecondary font-medium">No task today</Text>
              </View>
            }
          />
        )}
      </View>

      {/* FILTER DROPDOWN MODAL */}
      <Modal visible={showFilterDropdown} transparent animationType="none">
        <TouchableWithoutFeedback onPress={() => setShowFilterDropdown(false)}>
          <View className="flex-1">
            <View className="absolute top-16 right-6 bg-white rounded-xl shadow-xl w-32 overflow-hidden border border-gray-100" style={{ elevation: 5 }}>
              <Pressable 
                className="px-4 py-3 border-b border-gray-100"
                onPress={() => { 
                  setShowFilterDropdown(false); 
                  setTimeout(() => setShowFilterSheet('priority'), 150); 
                }}
              >
                <Text className="text-textPrimary font-medium text-center">Priority</Text>
              </Pressable>
              <Pressable 
                className="px-4 py-3"
                onPress={() => { 
                  setShowFilterDropdown(false); 
                  setTimeout(() => setShowFilterSheet('category'), 150); 
                }}
              >
                <Text className="text-textPrimary font-medium text-center">Category</Text>
              </Pressable>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* FILTER BOTTOM SHEET MODAL */}
      <Modal visible={showFilterSheet !== null} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/30">
          <Pressable className="flex-1" onPress={() => setShowFilterSheet(null)} />
          <View className="bg-white rounded-t-3xl p-6 min-h-[300px]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-textPrimary">
                {showFilterSheet === 'priority' ? 'Select Priority' : 'Select Category'}
              </Text>
              <Pressable onPress={() => setShowFilterSheet(null)}>
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </Pressable>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {showFilterSheet === 'priority' && (
                <View className="space-y-3 pb-8">
                  <Pressable 
                    className={`p-4 mb-3 rounded-xl border ${selectedPriorityFilter === null ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                    onPress={() => { setSelectedPriorityFilter(null); setShowFilterSheet(null); }}
                  >
                    <Text className={`font-semibold ${selectedPriorityFilter === null ? 'text-primary' : 'text-textPrimary'}`}>All Priorities</Text>
                  </Pressable>
                  {['low', 'medium', 'high'].map(p => (
                    <Pressable 
                      key={p}
                      className={`p-4 mb-3 rounded-xl border ${selectedPriorityFilter === p ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                      onPress={() => { setSelectedPriorityFilter(p); setShowFilterSheet(null); }}
                    >
                      <Text className={`font-semibold capitalize ${selectedPriorityFilter === p ? 'text-primary' : 'text-textPrimary'}`}>{p}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {showFilterSheet === 'category' && (
                <View className="space-y-3 pb-8">
                  <Pressable 
                    className={`p-4 mb-3 rounded-xl border ${selectedCategoryFilter === null ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                    onPress={() => { setSelectedCategoryFilter(null); setShowFilterSheet(null); }}
                  >
                    <Text className={`font-semibold ${selectedCategoryFilter === null ? 'text-primary' : 'text-textPrimary'}`}>All Categories</Text>
                  </Pressable>
                  {categories.map(c => (
                    <Pressable 
                      key={c.id}
                      className={`flex-row mb-3 items-center p-4 rounded-xl border ${selectedCategoryFilter === c.id ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                      onPress={() => { setSelectedCategoryFilter(c.id); setShowFilterSheet(null); }}
                    >
                      <Ionicons name={c.icon as any} size={18} color={c.color} className="mr-3" />
                      <Text className={`font-semibold ${selectedCategoryFilter === c.id ? 'text-primary' : 'text-textPrimary'}`}>{c.name}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
