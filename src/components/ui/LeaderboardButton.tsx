import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { useTheme } from '@/hooks/useTheme';
import { useI18n } from '@/i18n';
import type { GameMode } from '@/play-games/leaderboards';
import { feedback } from '@/services/feedback';
import { palette, spacing } from '@/theme';

interface LeaderboardButtonProps {
  mode?: GameMode;
  /** Gold pulse on a game home. The chooser keeps the quiet icon. */
  pulse?: boolean;
  size?: number;
}

export function LeaderboardButton({ mode, pulse = false, size = 44 }: LeaderboardButtonProps) {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useI18n();
  const scale = useSharedValue(1);
  const glow = useSharedValue(0.35);

  useEffect(() => {
    if (!pulse) return;
    scale.value = withRepeat(withSequence(withTiming(1.08, { duration: 520 }), withTiming(1, { duration: 520 })), -1, false);
    glow.value = withRepeat(withSequence(withTiming(1, { duration: 520 }), withTiming(0.35, { duration: 520 })), -1, false);
  }, [glow, pulse, scale]);

  const breath = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const halo = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: scale.value * 1.18 }],
  }));

  return (
    <Animated.View style={[styles.wrap, { width: size, height: size, marginRight: pulse ? spacing.sm : 0 }, breath]}>
      {pulse ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.halo, { width: size, height: size, borderRadius: size / 2 }, halo]}
        />
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('leaderboards')}
        hitSlop={6}
        onPress={() => {
          feedback('button', 'selection');
          router.push(mode ? { pathname: '/leaderboards', params: { mode } } : '/leaderboards');
        }}
        style={[
          styles.button,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: pulse ? palette.gold : theme.surface,
          },
        ]}
      >
        <Ionicons name="trophy" size={size * 0.5} color={pulse ? palette.navy : theme.text} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', backgroundColor: palette.gold },
  button: { alignItems: 'center', justifyContent: 'center' },
});
