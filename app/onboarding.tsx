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
        <Animated.View entering={FadeInDown.duration(800).springify()} className="mb-6">
          <Image 
            source={require('../assets/images/trido-logo.png')} 
            style={{ width: 120, height: 120, resizeMode: 'contain' }} 
          />
        </Animated.View>
        
        <Animated.View entering={FadeInUp.duration(800).delay(200).springify()} className="items-center">
          <Text className="text-4xl font-bold text-white text-center mb-2">
            Trido
          </Text>
          <Text className="text-xl font-medium text-white/90 text-center mb-6">
            to-do, done right
          </Text>
          <Text className="text-base text-white/80 text-center leading-relaxed px-4">
            Turn your daily tasks into small wins with a beautiful and intuitive to-do list experience.
          </Text>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInUp.duration(800).delay(400).springify()} className="p-8 pb-12">

        <Pressable 
          onPress={requestPermissions}
          className="bg-white py-4 rounded-full shadow-lg items-center"
        >
          <Text className="text-primary font-bold text-lg">Get Started</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}
