import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BANNER_HEIGHT, BottomBanner } from '@/components/ads/BottomBanner';
import { AnimatedBackground } from '@/components/effects/AnimatedBackground';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme';

interface ScreenProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Overlays rendered above content, outside the safe-area padding. */
  overlay?: ReactNode;
}

/** Full-screen container with the animated background and safe-area padding. */
export function Screen({ children, style, overlay }: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <AnimatedBackground />
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + spacing.sm,
            paddingBottom: insets.bottom + BANNER_HEIGHT + spacing.md,
            paddingLeft: insets.left + spacing.lg,
            paddingRight: insets.right + spacing.lg,
          },
          style,
        ]}
      >
        {children}
      </View>
      {overlay}
      <BottomBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
});
