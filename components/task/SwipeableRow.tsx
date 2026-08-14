import React, { useRef } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface SwipeableRowProps {
  children: React.ReactNode;
  onToggleComplete: () => void;
  onDelete: () => void;
  isCompleted: boolean;
}

function RightAction(prog: SharedValue<number>, drag: SharedValue<number>) {
  const styleAnimation = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: drag.value + 60 }],
    };
  });

  return (
    <Reanimated.View style={styleAnimation}>
      <View className="bg-danger justify-center items-end px-6 h-full rounded-2xl ml-2">
        <Ionicons name="trash-outline" size={24} color="#FFF" />
      </View>
    </Reanimated.View>
  );
}

function LeftAction(prog: SharedValue<number>, drag: SharedValue<number>, isCompleted: boolean) {
  const styleAnimation = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: drag.value - 60 }],
    };
  });

  return (
    <Reanimated.View style={styleAnimation}>
      <View className={`justify-center items-start px-6 h-full rounded-2xl mr-2 ${isCompleted ? 'bg-orange-500' : 'bg-success'}`}>
        <Ionicons name={isCompleted ? "arrow-undo-outline" : "checkmark-circle-outline"} size={24} color="#FFF" />
      </View>
    </Reanimated.View>
  );
}

export const SwipeableRow: React.FC<SwipeableRowProps> = ({ children, onToggleComplete, onDelete, isCompleted }) => {
  const swipeableRef = useRef<any>(null);

  const handleSwipeableWillOpen = (direction: 'left' | 'right') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Ternyata 'direction' di ReanimatedSwipeable merepresentasikan arah geserannya!
    // Geser ke kanan (swipe right) -> direction 'right' -> membuka aksi Kiri (Selesai)
    // Geser ke kiri (swipe left) -> direction 'left' -> membuka aksi Kanan (Hapus)
    if (direction === 'right') {
      onToggleComplete();
    } else if (direction === 'left') {
      onDelete();
    }
    
    setTimeout(() => {
      swipeableRef.current?.close();
    }, 100);
  };

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      friction={2}
      enableTrackpadTwoFingerGesture
      rightThreshold={60}
      leftThreshold={60}
      renderRightActions={(prog, drag) => RightAction(prog, drag)}
      renderLeftActions={(prog, drag) => LeftAction(prog, drag, isCompleted)}
      onSwipeableWillOpen={handleSwipeableWillOpen}
    >
      {children}
    </ReanimatedSwipeable>
  );
};
