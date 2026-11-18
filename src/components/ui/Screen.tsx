import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BANNER_HEIGHT, BottomBanner } from '@/components/ads/BottomBanner';
import { AnimatedBackground } from '@/components/effects/AnimatedBackground';
import { darkTheme, lightTheme, spacing } from '@/theme';
import { themeProgress } from '@/theme/blend';

interface ScreenProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Overlays rendered above content, outside the safe-area padding. */
  overlay?: ReactNode;
}

/** Full-screen container with the animated background and safe-area padding. */
export function Screen({ children, style, overlay }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const background = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(themeProgress.value, [0, 1], [darkTheme.background, lightTheme.background]),
  }));
  return (
    <Animated.View style={[styles.root, background]}>
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
});
