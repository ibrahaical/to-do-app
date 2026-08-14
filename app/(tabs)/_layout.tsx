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
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          backgroundColor: '#FFFFFF',
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 12,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
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
        name="task"
        options={{
          title: 'Task',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
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
          tabBarIcon: () => (
            <View 
              style={{ 
                width: 56, 
                height: 56, 
                backgroundColor: '#0284C7', 
                borderRadius: 28, 
                alignItems: 'center', 
                justifyContent: 'center',
                top: -15,
                borderWidth: 4,
                borderColor: '#FFFFFF',
                shadowColor: '#0284C7',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 5
              }}
            >
              <Ionicons name="add" size={32} color="#FFFFFF" />
            </View>
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
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
