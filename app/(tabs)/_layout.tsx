import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Platform, Pressable } from 'react-native';

export default function TabLayout() {
  const router = useRouter();
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0284C7', // Tailwind sky-600
        tabBarInactiveTintColor: '#94A3B8', // Tailwind slate-400
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          backgroundColor: '#FFFFFF',
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      
      {/* Floating Add Button */}
      <Tabs.Screen
        name="add"
        listeners={{
          tabPress: (e) => {
            // Prevent default navigation to the dummy 'add' tab
            e.preventDefault();
            // Open the new task modal instead
            router.push('/task/new');
          },
        }}
        options={{
          title: '',
          tabBarLabel: () => null,
          tabBarIcon: () => (
            <View 
              style={{ 
                width: 44, 
                height: 44, 
                backgroundColor: '#0284C7', 
                borderRadius: 22, 
                alignItems: 'center', 
                justifyContent: 'center',
              }}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="task"
        options={{
          title: 'Task',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
