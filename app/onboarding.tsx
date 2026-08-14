import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useSettingsStore } from '../store/useSettingsStore';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function OnboardingScreen() {
  const router = useRouter();
  const setHasOnboarded = useSettingsStore(state => state.setHasOnboarded);

  const requestPermissions = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    // Selesai onboarding apapun hasilnya (izin diberikan atau tidak)
    setHasOnboarded(true);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <View className="flex-1 justify-center items-center px-8">
        <Animated.View entering={FadeInDown.duration(800).springify()} className="w-32 h-32 bg-white/20 rounded-full items-center justify-center mb-8">
          <Ionicons name="checkmark-done" size={72} color="#FFFFFF" />
        </Animated.View>
        
        <Animated.View entering={FadeInUp.duration(800).delay(200).springify()} className="items-center">
          <Text className="text-4xl font-bold text-white text-center mb-4">
            Kelola Waktumu,{'\n'}Raih Mimpimu.
          </Text>
          <Text className="text-lg text-white/80 text-center leading-relaxed px-4">
            Ubah tugas harianmu menjadi kemenangan kecil dengan pengalaman to-do list yang cantik dan intuitif.
          </Text>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInUp.duration(800).delay(400).springify()} className="p-8 pb-12">
        <View className="bg-white/10 p-4 rounded-2xl mb-8 flex-row items-center">
          <Ionicons name="notifications" size={24} color="#FFF" />
          <Text className="flex-1 ml-4 text-white/90 text-sm">
            Kami membutuhkan izin notifikasi agar dapat mengingatkanmu sebelum tenggat waktu tugasmu habis.
          </Text>
        </View>

        <Pressable 
          onPress={requestPermissions}
          className="bg-white py-4 rounded-full shadow-lg items-center"
        >
          <Text className="text-primary font-bold text-lg">Mulai Sekarang</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}
