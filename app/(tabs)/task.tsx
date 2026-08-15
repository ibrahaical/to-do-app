import React, { useEffect, useState, useMemo, useRef } from 'react';
import { View, Text, Pressable, TextInput, SectionList, Modal, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, interpolate, SlideInRight, SlideOutRight } from 'react-native-reanimated';
import { format, isToday, isThisMonth, startOfDay } from 'date-fns';
import { enUS as localeId } from 'date-fns/locale';

import { useTaskStore } from '../../store/useTaskStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { TaskCard } from '../../components/task/TaskCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { SwipeableRow } from '../../components/task/SwipeableRow';

export default function TaskListScreen() {
  const router = useRouter();
  
  const tasks = useTaskStore(state => state.tasks);
  const isLoading = useTaskStore(state => state.isLoading);
  const toggleComplete = useTaskStore(state => state.toggleComplete);
  const deleteTask = useTaskStore(state => state.deleteTask);
  
  const categories = useCategoryStore(state => state.categories);

  // States
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter states
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string | null>(null);
  
  // Modal states
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);
  const [tempStatusFilter, setTempStatusFilter] = useState<string | null>(null);
  const [tempCategoryFilter, setTempCategoryFilter] = useState<string | null>(null);
  const [tempPriorityFilter, setTempPriorityFilter] = useState<string | null>(null);

  const searchInputRef = useRef<TextInput>(null);
  const searchAnim = useSharedValue(0);

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
  // Derived Data
  const sections = useMemo(() => {
    let result = tasks;
    
    if (selectedStatusFilter) {
      result = result.filter(t => t.status === selectedStatusFilter);
    }
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
    
    // Grouping
    const groups = [
      { title: 'Past Due', data: [] as any[], alwaysShow: false },
      { title: 'Today', data: [] as any[], alwaysShow: true },
      { title: 'This Month', data: [] as any[], alwaysShow: true },
      { title: 'Upcoming', data: [] as any[], alwaysShow: true },
      { title: 'Someday', data: [] as any[], alwaysShow: false },
      { title: 'Completed', data: [] as any[], alwaysShow: true },
    ];

    const todayStart = startOfDay(new Date());

    result.forEach(task => {
      if (task.isCompleted) {
        groups[5].data.push(task);
        return;
      }
      
      if (!task.dueDate) {
        groups[4].data.push(task);
        return;
      }

      const due = new Date(task.dueDate);
      if (due < todayStart) {
        groups[0].data.push(task);
      } else if (isToday(due)) {
        groups[1].data.push(task);
      } else if (isThisMonth(due)) {
        groups[2].data.push(task);
      } else {
        groups[3].data.push(task);
      }
    });

    // Sort each group's data
    groups.forEach(g => {
      g.data.sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0));
    });

    // Only filter out groups that are empty AND alwaysShow is false
    return groups.filter(g => g.data.length > 0 || g.alwaysShow);
  }, [tasks, selectedStatusFilter, selectedCategoryFilter, selectedPriorityFilter, isSearching, searchQuery]);

  const hasFilter = selectedStatusFilter || selectedCategoryFilter || selectedPriorityFilter;
  const isListEmpty = sections.every(s => s.data.length === 0);

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
          <Text className="text-3xl font-bold text-textPrimary">My Task</Text>
          <View className="flex-row items-center gap-3">
            <Pressable onPress={() => router.push('/task/new')} className="w-10 h-10 bg-surface rounded-full items-center justify-center shadow-sm">
              <Ionicons name="add" size={24} color="#0284C7" />
            </Pressable>
            <Pressable 
              onPress={() => {
                setTempStatusFilter(selectedStatusFilter);
                setTempPriorityFilter(selectedPriorityFilter);
                setTempCategoryFilter(selectedCategoryFilter);
                setShowFilterSidebar(true);
              }} 
              className="w-10 h-10 bg-surface rounded-full items-center justify-center shadow-sm relative"
            >
              <Ionicons name="filter-outline" size={20} color="#64748B" />
              {hasFilter && (
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
            placeholder="Search all tasks..."
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

      {/* TASK LIST */}
      <View className="flex-1">
        {!isLoading && isListEmpty ? (
          <View className="flex-1 mt-8 items-center">
            <Text className="text-sm text-textSecondary font-medium">No task found</Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={item => item.id}
            renderSectionHeader={({ section: { title } }) => (
              <View className="bg-background pt-6 pb-2 px-6">
                <Text className="text-sm font-bold text-textPrimary">{title}</Text>
              </View>
            )}
            renderSectionFooter={({ section }) => (
              section.data.length === 0 ? (
                <View className="px-6 py-4 bg-white border-b border-gray-50">
                  <Text className="text-sm text-textSecondary italic">No task</Text>
                </View>
              ) : null
            )}
            renderItem={({ item }) => (
              <SwipeableRow
                isCompleted={item.isCompleted}
                onToggleComplete={() => toggleComplete(item.id, item.isCompleted)}
                onDelete={() => deleteTask(item.id)}
              >
                <Pressable 
                  onPress={() => router.push(`/task/${item.id}` as any)}
                  className="flex-row py-3.5 px-6 items-center bg-white border-b border-gray-100"
                >
                  {/* Status Pill */}
                  <View className={`w-1.5 h-10 rounded-full mr-4 ${
                    item.status === 'done' ? 'bg-green-500' : 
                    item.status === 'in_progress' ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />
                  
                  <View className="flex-1">
                    <Text className={`text-base font-medium ${item.isCompleted ? 'text-gray-400 line-through' : 'text-textPrimary'}`}>
                      {item.title}
                    </Text>
                    <Text className={`text-xs mt-0.5 ${item.isCompleted ? 'text-gray-400' : 'text-textSecondary'}`}>
                      {item.dueDate ? format(new Date(item.dueDate), 'MMM d, hh:mm a', { locale: localeId }) : 'No Due Date'} • #{categories.find(c => c.id === item.categoryId)?.name || 'Other'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                </Pressable>
              </SwipeableRow>
            )}
            contentContainerStyle={{ paddingBottom: 100 }}
            stickySectionHeadersEnabled={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={5}
            initialNumToRender={8}
          />
        )}
      </View>

      {/* FILTER SIDEBAR MODAL */}
      <Modal visible={showFilterSidebar} transparent animationType="fade">
        <View className="flex-1 flex-row bg-black/40">
          {/* Transparent left side to close */}
          <Pressable className="flex-1" onPress={() => setShowFilterSidebar(false)} />
          
          {/* Animated Sidebar */}
          <Animated.View 
            entering={SlideInRight} 
            exiting={SlideOutRight}
            className="w-4/5 max-w-sm bg-white h-full shadow-2xl flex-col"
          >
            {/* Header */}
            <View className="pt-12 pb-4 px-6 border-b border-gray-100 flex-row justify-between items-center">
              <Text className="text-xl font-bold text-textPrimary">Filters</Text>
              <Pressable onPress={() => setShowFilterSidebar(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </Pressable>
            </View>

            {/* Scrollable Content */}
            <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
              
              {/* STATUS GROUP */}
              <View className="mb-8">
                <Text className="text-sm font-bold text-textSecondary mb-3 uppercase tracking-wider">Status</Text>
                <View className="flex-row flex-wrap gap-2">
                  {['todo', 'in_progress', 'done'].map(s => (
                    <Pressable 
                      key={s}
                      className={`px-4 py-2 rounded-full border ${tempStatusFilter === s ? 'border-primary bg-primary/10' : 'border-gray-200 bg-surface'}`}
                      onPress={() => setTempStatusFilter(tempStatusFilter === s ? null : s)}
                    >
                      <Text className={`font-semibold capitalize ${tempStatusFilter === s ? 'text-primary' : 'text-textSecondary'}`}>
                        {s.replace('_', ' ')}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* PRIORITY GROUP */}
              <View className="mb-8">
                <Text className="text-sm font-bold text-textSecondary mb-3 uppercase tracking-wider">Priority</Text>
                <View className="flex-row flex-wrap gap-2">
                  {['low', 'medium', 'high'].map(p => (
                    <Pressable 
                      key={p}
                      className={`px-4 py-2 rounded-full border ${tempPriorityFilter === p ? 'border-primary bg-primary/10' : 'border-gray-200 bg-surface'}`}
                      onPress={() => setTempPriorityFilter(tempPriorityFilter === p ? null : p)}
                    >
                      <Text className={`font-semibold capitalize ${tempPriorityFilter === p ? 'text-primary' : 'text-textSecondary'}`}>
                        {p}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* CATEGORY GROUP */}
              <View className="mb-10">
                <Text className="text-sm font-bold text-textSecondary mb-3 uppercase tracking-wider">Category</Text>
                <View className="flex-row flex-wrap gap-2">
                  {categories.map(c => (
                    <Pressable 
                      key={c.id}
                      className={`flex-row items-center px-4 py-2 rounded-full border ${tempCategoryFilter === c.id ? 'border-primary bg-primary/10' : 'border-gray-200 bg-surface'}`}
                      onPress={() => setTempCategoryFilter(tempCategoryFilter === c.id ? null : c.id)}
                    >
                      <Ionicons name={c.icon as any} size={14} color={tempCategoryFilter === c.id ? '#0284C7' : c.color} className="mr-1.5" />
                      <Text className={`font-semibold ${tempCategoryFilter === c.id ? 'text-primary' : 'text-textSecondary'}`}>
                        {c.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

            </ScrollView>

            {/* Footer Buttons */}
            <View className="p-6 border-t border-gray-100 flex-row gap-3 bg-white">
              <Pressable 
                className="flex-1 py-3.5 rounded-xl bg-gray-100 items-center justify-center"
                onPress={() => {
                  setTempStatusFilter(null);
                  setTempPriorityFilter(null);
                  setTempCategoryFilter(null);
                }}
              >
                <Text className="font-bold text-textSecondary">Reset</Text>
              </Pressable>
              
              <Pressable 
                className="flex-1 py-3.5 rounded-xl bg-primary items-center justify-center"
                onPress={() => {
                  setSelectedStatusFilter(tempStatusFilter);
                  setSelectedPriorityFilter(tempPriorityFilter);
                  setSelectedCategoryFilter(tempCategoryFilter);
                  setShowFilterSidebar(false);
                }}
              >
                <Text className="font-bold text-white">Apply</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
