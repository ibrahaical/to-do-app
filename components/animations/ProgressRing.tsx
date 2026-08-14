import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
  interpolateColor,
  useAnimatedStyle
} from 'react-native-reanimated';

interface ProgressRingProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 64,
  strokeWidth = 6,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progressValue = useSharedValue(0);

  useEffect(() => {
    progressValue.value = withTiming(progress, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference - circumference * progressValue.value;
    
    // Warna transisi dari biru ke hijau saat 100%
    const strokeColor = interpolateColor(
      progressValue.value,
      [0, 0.99, 1],
      ['#38BDF8', '#38BDF8', '#10B981'] // Tailwind sky-400 to emerald-500
    );

    return {
      strokeDashoffset,
      stroke: strokeColor,
    };
  });

  const percentage = Math.round(progress * 100);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          stroke="#E2E8F0"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <AnimatedCircle
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          originX={size / 2}
          originY={size / 2}
          rotation="-90"
        />
      </Svg>
      <Text className="text-xs font-bold text-textPrimary">
        {percentage}%
      </Text>
    </View>
  );
};
