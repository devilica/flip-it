import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { AppText } from '@/components/ui/AppText';
import type { IconName } from '@/components/ui/GameButton';
import { useTheme } from '@/hooks/useTheme';
import { feedback } from '@/services/feedback';
import { palette, radius, spacing } from '@/theme';

interface ToggleRowProps {
  icon: IconName;
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  compact?: boolean;
}

const TRACK_WIDTH = 52;
const KNOB = 24;

export function ToggleRow({ icon, label, value, onChange, compact }: ToggleRowProps) {
  const theme = useTheme();
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(value ? 1 : 0, { damping: 16, stiffness: 220 });
  }, [progress, value]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [theme.surfacePressed, palette.purple]),
  }));
  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: 4 + progress.value * (TRACK_WIDTH - KNOB - 8) }],
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => {
        feedback('button', 'selection');
        onChange(!value);
      }}
      style={[styles.row, compact ? styles.compact : { backgroundColor: theme.surfaceStrong }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: theme.surface }]}>
        <Ionicons name={icon} size={20} color={theme.text} />
      </View>
      <AppText size={17} weight="medium" style={styles.label}>
        {label}
      </AppText>
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.knob, knobStyle]} />
      </Animated.View>
    </Pressable>
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
