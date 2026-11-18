import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { AppText } from '@/components/ui/AppText';
import type { IconName } from '@/components/ui/GameButton';
import { useTheme } from '@/hooks/useTheme';
import { feedback } from '@/services/feedback';
import { palette, radius } from '@/theme';

interface IconButtonProps {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  label?: string;
  badge?: number | string;
  disabled?: boolean;
  size?: number;
  silent?: boolean;
  /** Translucent circle with no shadow, matching the home stat chips. */
  soft?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  label,
  badge,
  disabled,
  size = 52,
  silent,
  soft,
  style,
}: IconButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={[styles.wrapper, style]}>
      <Animated.View style={animatedStyle}>
        {/* Disabled is handled here instead of on Pressable: Android greys out a disabled native view. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={disabled ? `${accessibilityLabel}, unavailable` : accessibilityLabel}
          hitSlop={6}
          onPressIn={() => {
            if (disabled) return;
            scale.value = withSpring(0.88, { damping: 15, stiffness: 420 });
          }}
          onPressOut={() => {
            if (disabled) return;
            scale.value = withSpring(1, { damping: 12, stiffness: 300 });
          }}
          onPress={() => {
            if (disabled) return;
            if (!silent) feedback('button', 'selection');
            onPress();
          }}
          style={[
            styles.button,
            soft || disabled ? null : styles.shadow,
            {
              width: size,
              height: size,
              borderRadius: soft ? size / 2 : size * 0.36,
              backgroundColor: disabled ? 'transparent' : soft ? theme.surface : theme.surfaceStrong,
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={size * 0.46}
            color={disabled ? theme.textMuted : theme.text}
            style={styles.icon}
          />
        </Pressable>
        {badge !== undefined ? (
          <View style={styles.badge}>
            <AppText size={11} weight="bold" color="#FFFFFF">
              {badge}
            </AppText>
          </View>
        ) : null}
      </Animated.View>
      {label ? (
        <AppText size={12} weight="medium" tone="muted" style={styles.label}>
          {label}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadow: {
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  icon: { backgroundColor: 'transparent' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: radius.pill,
    backgroundColor: palette.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { marginTop: 6 },
});
