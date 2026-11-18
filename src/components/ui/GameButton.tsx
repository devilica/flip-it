import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/hooks/useTheme';
import { feedback } from '@/services/feedback';
import { radius, spacing } from '@/theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'lg' | 'md' | 'sm';

export type IconName = ComponentProps<typeof Ionicons>['name'];

interface GameButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  /** Drawn in the icon slot, such as the mascot. */
  leading?: ReactNode;
  /** Small secondary line. Sits under the label, or beside it when captionPosition is beside. */
  caption?: string;
  captionPosition?: 'below' | 'beside';
  trailing?: ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const heights: Record<Size, number> = { lg: 68, md: 56, sm: 46 };
const fontSizes: Record<Size, number> = { lg: 24, md: 18, sm: 16 };

export function GameButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  leading,
  caption,
  captionPosition = 'below',
  trailing,
  disabled,
  style,
}: GameButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const gradient = variant === 'primary' ? theme.primaryGradient : variant === 'danger' ? theme.dangerGradient : null;
  const onGradient = gradient !== null;
  const textColor = onGradient ? '#FFFFFF' : theme.text;

  const content = (
    <View style={styles.row}>
      {leading}
      {icon ? <Ionicons name={icon} size={fontSizes[size] + 4} color={textColor} /> : null}
      <View style={[styles.labels, captionPosition === 'beside' && styles.labelsBeside]}>
        <AppText size={fontSizes[size]} weight="semibold" color={textColor}>
          {label}
        </AppText>
        {caption ? (
          <AppText
            size={captionPosition === 'beside' ? Math.max(14, fontSizes[size] - 6) : 12}
            weight="medium"
            color={onGradient ? 'rgba(255,255,255,0.8)' : theme.textMuted}
          >
            {caption}
          </AppText>
        ) : null}
      </View>
      {trailing}
    </View>
  );

  return (
    <Animated.View style={[animatedStyle, disabled && styles.disabled, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={caption ? `${label}, ${caption}` : label}
        disabled={disabled}
        onPressIn={() => {
          scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 12, stiffness: 300 });
        }}
        onPress={() => {
          feedback('button', 'selection');
          onPress();
        }}
        style={[
          styles.base,
          { height: heights[size], borderRadius: size === 'lg' ? radius.xl : radius.lg },
          !onGradient && {
            backgroundColor: variant === 'ghost' ? 'transparent' : theme.surfaceStrong,
          },
          onGradient && styles.shadow,
        ]}
      >
        {gradient ? (
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: size === 'lg' ? radius.xl : radius.lg }]}
          />
        ) : null}
        {gradient ? <View style={[styles.shine, { borderRadius: size === 'lg' ? radius.xl : radius.lg }]} /> : null}
        {content}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  shadow: {
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: '50%',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  labels: { alignItems: 'center' },
  labelsBeside: { flexDirection: 'row', gap: spacing.sm },
  disabled: { opacity: 0.45 },
});
