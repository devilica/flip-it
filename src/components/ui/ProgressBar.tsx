import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useTheme } from '@/hooks/useTheme';
import { radius } from '@/theme';

interface ProgressBarProps {
  /** 0..1 */
  value: number;
  height?: number;
  colors?: [string, string];
  style?: StyleProp<ViewStyle>;
}

export function ProgressBar({ value, height = 8, colors, style }: ProgressBarProps) {
  const theme = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(Math.max(0, Math.min(1, value)), {
      duration: 450,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, value]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View style={[styles.track, { height, backgroundColor: theme.surface }, style]}>
      <Animated.View style={[styles.fill, fillStyle]}>
        <LinearGradient
          colors={colors ?? theme.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { borderRadius: radius.pill, overflow: 'hidden', width: '100%' },
  fill: { height: '100%', borderRadius: radius.pill, overflow: 'hidden' },
});
