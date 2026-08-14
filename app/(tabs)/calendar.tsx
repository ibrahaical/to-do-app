import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, Pressable, TextInput, FlatList, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, interpolate } from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  addDays, isSameDay, isSameMonth, formatDistanceToNow, addMonths, subMonths
} from 'date-fns';
import { enUS as localeId } from 'date-fns/locale';

import { useTaskStore } from '../../store/useTaskStore';
import { EmptyState } from '../../components/ui/EmptyState';

export default function CalendarScreen() {
  const router = useRouter();
  const tasks = useTaskStore(state => state.tasks);
  
  // States
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const searchInputRef = useRef<TextInput>(null);

  // Animation values
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

  // Group tasks by date string
  const tasksByDate = useMemo(() => {
    const map: Record<string, typeof tasks> = {};
    tasks.forEach(t => {
      if (t.dueDate) {
        const dateStr = format(new Date(t.dueDate), 'yyyy-MM-dd');
        if (!map[dateStr]) map[dateStr] = [];
        map[dateStr].push(t);
      }
    });
    return map;
  }, [tasks]);

  // Calendar Grid Calculation
  const daysInGrid = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    const days = [];
    let day = start;
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  // Selected date tasks
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedTasks = useMemo(() => {
    let dayTasks = tasksByDate[selectedDateStr] || [];
    
    // Apply search query if active
    if (isSearching && searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      dayTasks = dayTasks.filter(t => 
        t.title.toLowerCase().includes(lowerQuery) || 
        (t.notes && t.notes.toLowerCase().includes(lowerQuery))
      );
    }
    
    return dayTasks.sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0));
  }, [tasksByDate, selectedDateStr, isSearching, searchQuery]);

  const relativeTime = useMemo(() => {
    if (isSameDay(selectedDate, new Date())) return 'Today';
    return formatDistanceToNow(selectedDate, { addSuffix: true, locale: localeId });
  }, [selectedDate]);

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
          <Text className="text-3xl font-bold text-textPrimary">Calendar</Text>
          <View className="flex-row items-center gap-3">
            <Pressable onPress={() => router.push('/task/new')} className="w-10 h-10 bg-surface rounded-full items-center justify-center shadow-sm">
              <Ionicons name="add" size={24} color="#0284C7" />
            </Pressable>
            <Pressable onPress={() => setShowMonthPicker(true)} className="w-10 h-10 bg-surface rounded-full items-center justify-center shadow-sm">
              <Ionicons name="calendar-outline" size={20} color="#64748B" />
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
            placeholder="Search in selected date..."
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

      {/* MONTH / YEAR TITLE */}
      <View className="px-6 mt-6 mb-4 flex-row justify-between items-end">
        <View>
          <Text className="text-2xl font-bold text-textPrimary">
            {format(currentMonth, 'MMMM', { locale: localeId })}
          </Text>
          <Text className="text-base text-textSecondary font-medium">
            {format(currentMonth, 'yyyy', { locale: localeId })}
          </Text>
        </View>
        <View className="flex-row gap-4">
          <Pressable onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <Ionicons name="chevron-back" size={24} color="#64748B" />
          </Pressable>
          <Pressable onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <Ionicons name="chevron-forward" size={24} color="#64748B" />
          </Pressable>
        </View>
      </View>

      {/* CALENDAR GRID */}
      <View className="px-4 mb-4">
        {/* Days Header */}
        <View className="flex-row mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <Text key={day} className="flex-1 text-center text-xs font-semibold text-gray-400 uppercase">
              {day}
            </Text>
          ))}
        </View>
        
        {/* Grid */}
        <View className="flex-row flex-wrap">
          {daysInGrid.map((date, index) => {
            const isCurrentMonth = isSameMonth(date, currentMonth);
            const isSelected = isSameDay(date, selectedDate);
            const dateStr = format(date, 'yyyy-MM-dd');
            const dayTasks = tasksByDate[dateStr] || [];
            
            // Calc priority dots
            const priorities = Array.from(new Set(dayTasks.map(t => t.priority)));
            const dots = priorities.slice(0, 3); // Max 3 dots

            return (
              <Pressable 
                key={index} 
                onPress={() => {
                  setSelectedDate(date);
                  if (!isCurrentMonth) setCurrentMonth(date);
                }}
                className={`w-[14.28%] py-3 items-center`}
              >
                <View className={`w-8 h-8 items-center justify-center rounded-full ${isSelected ? 'bg-primary' : ''}`}>
                  <Text className={`text-base font-medium ${isSelected ? 'text-white font-bold' : isCurrentMonth ? 'text-textPrimary' : 'text-gray-300'}`}>
                    {format(date, 'd')}
                  </Text>
                </View>
                
                {/* Dots */}
                <View className="flex-row mt-1 h-1.5 gap-1">
                  {dots.map((p, i) => (
                    <View key={i} className={`w-1.5 h-1.5 rounded-full ${
                      p === 'high' ? 'bg-red-500' : p === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                    }`} />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* SELECTED DATE HEADER */}
      <View className="px-6 py-4 flex-row justify-between items-end border-b border-gray-100 bg-white">
        <Text className="text-sm font-semibold text-textPrimary">
          {format(selectedDate, 'EEEE, d MMMM', { locale: localeId })}
        </Text>
        <Text className="text-xs text-textSecondary font-medium capitalize">
          {relativeTime}
        </Text>
      </View>

      {/* TASK LIST */}
      <FlatList
        data={selectedTasks}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <Pressable 
            onPress={() => router.push(`/task/${item.id}` as any)}
            className="flex-row py-4 px-6 border-b border-gray-100 bg-white items-center"
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
            <Text className="text-sm text-textSecondary font-medium">No task here</Text>
          </View>
        }
      />

      {/* NATIVE MONTH PICKER (Optional fast jump) */}
      {showMonthPicker && (
        <DateTimePicker
          value={currentMonth}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowMonthPicker(false);
            if (date) {
              setCurrentMonth(date);
              setSelectedDate(date);
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}
