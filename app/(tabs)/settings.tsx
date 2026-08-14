import React from 'react';
import { View, Text, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  
  return (
    <SafeAreaView className="flex-1 bg-background pt-8">
      <View className="px-6 mb-8 mt-4">
        <Text className="text-3xl font-bold text-textPrimary">Pengaturan</Text>
      </View>

      <View className="px-6">
        <Text className="text-sm font-semibold text-textSecondary uppercase tracking-wider mb-4">Tampilan</Text>
        
        <View className="bg-surface rounded-2xl p-4 mb-8">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-sky-100 rounded-full items-center justify-center mr-3">
                <Ionicons name="moon-outline" size={18} color="#0284C7" />
              </View>
              <Text className="text-textPrimary text-base font-medium">Mode Gelap</Text>
            </View>
            <Switch 
              value={colorScheme === 'dark'} 
              onValueChange={() => {}} 
              trackColor={{ false: '#CBD5E1', true: '#38BDF8' }}
              disabled={true} // Hanya placeholder untuk saat ini
            />
          </View>
          
          <Text className="text-xs text-textSecondary">
            Mengikuti pengaturan tema sistem perangkat Anda secara otomatis (implementasi manual akan datang).
          </Text>
        </View>

        <Text className="text-sm font-semibold text-textSecondary uppercase tracking-wider mb-4">Tentang</Text>
        
        <View className="bg-surface rounded-2xl p-4">
          <View className="flex-row justify-between items-center py-2">
            <Text className="text-textPrimary text-base">Versi Aplikasi</Text>
            <Text className="text-textSecondary">1.0.0 (Beta)</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
