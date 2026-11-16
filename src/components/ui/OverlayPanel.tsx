import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BANNER_HEIGHT } from '@/components/ads/BottomBanner';
import { useTheme } from '@/hooks/useTheme';
import { radius, spacing } from '@/theme';

interface OverlayPanelProps {
  children: ReactNode;
  /** Rendered behind the card but above the dimmed backdrop (e.g. confetti). */
  backdropContent?: ReactNode;
}

/** Dimmed full-screen layer with a centered, springy card. */
export function OverlayPanel({ children, backdropContent }: OverlayPanelProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(160)}
      style={[StyleSheet.absoluteFill, styles.backdrop, { backgroundColor: theme.overlay }]}
      pointerEvents="auto"
    >
      {backdropContent}
      <View
        style={[
          styles.center,
          { paddingTop: insets.top, paddingBottom: insets.bottom + BANNER_HEIGHT },
        ]}
      >
        <Animated.View
          entering={ZoomIn.springify().damping(14).stiffness(160)}
          style={[styles.card, { backgroundColor: theme.background }]}
        >
          {children}
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: { zIndex: 20, elevation: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
});
