import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { AppText } from '@/components/ui/AppText';
import type { IconName } from '@/components/ui/GameButton';
import { useTheme } from '@/hooks/useTheme';
import { feedback } from '@/services/feedback';
import { darkTheme, lightTheme, radius, spacing } from '@/theme';
import { themeProgress } from '@/theme/blend';

interface ToggleRowProps {
  icon: IconName;
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  compact?: boolean;
}

const TRACK_WIDTH = 52;
const KNOB = 24;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ToggleRow({ icon, label, value, onChange, compact }: ToggleRowProps) {
  const theme = useTheme();
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(value ? 1 : 0, { damping: 16, stiffness: 220 });
  }, [progress, value]);

  const rowStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(themeProgress.value, [0, 1], [darkTheme.surfaceStrong, lightTheme.surfaceStrong]),
  }));
  const iconStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(themeProgress.value, [0, 1], [darkTheme.surface, lightTheme.surface]),
  }));
  const trackStyle = useAnimatedStyle(() => {
    const themeMix = themeProgress.value;
    const offR = 255 + (16 - 255) * themeMix;
    const offG = 255 + (20 - 255) * themeMix;
    const offB = 255 + (38 - 255) * themeMix;
    const offA = 0.12 + (0.1 - 0.12) * themeMix;
    const knob = progress.value;
    return {
      backgroundColor: `rgba(${offR + (139 - offR) * knob},${offG + (92 - offG) * knob},${offB + (246 - offB) * knob},${offA + (1 - offA) * knob})`,
    };
  });
  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: 4 + progress.value * (TRACK_WIDTH - KNOB - 8) }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => {
        feedback('button', 'selection');
        onChange(!value);
      }}
      style={[styles.row, compact ? styles.compact : rowStyle]}
    >
      <Animated.View style={[styles.iconWrap, iconStyle]}>
        <Ionicons name={icon} size={20} color={theme.text} />
      </Animated.View>
      <AppText size={17} weight="medium" style={styles.label}>
        {label}
      </AppText>
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.knob, knobStyle]} />
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.md,
  },
  compact: { paddingHorizontal: 0, paddingVertical: spacing.sm },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1 },
  track: { width: TRACK_WIDTH, height: 32, borderRadius: radius.pill, justifyContent: 'center' },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});
