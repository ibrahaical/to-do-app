import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon = "document-text-outline", 
  title, 
  message 
}) => {
  return (
    <Animated.View 
      entering={FadeInDown.duration(600).springify()}
      className="flex-1 justify-center items-center px-8"
    >
      <View className="w-32 h-32 bg-sky-100 rounded-full items-center justify-center mb-6">
        <Ionicons name={icon} size={64} color="#0284C7" />
      </View>
      <Text className="text-xl font-bold text-textPrimary mb-2 text-center">
        {title}
      </Text>
      <Text className="text-base text-textSecondary text-center leading-relaxed">
        {message}
      </Text>
    </Animated.View>
  );
};
