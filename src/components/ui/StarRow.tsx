import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/hooks/useTheme';
import { feedback } from '@/services/feedback';

interface StarRowProps {
  count: number;
  size?: number;
  /** Pop the earned stars in one after another. */
  animated?: boolean;
  gap?: number;
}

function Star({
  filled,
  size,
  index,
  animated,
}: {
  filled: boolean;
  size: number;
  index: number;
  animated: boolean;
}) {
  const theme = useTheme();
  const scale = useSharedValue(animated ? 0 : 1);
  const rotate = useSharedValue(animated ? -30 : 0);

  useEffect(() => {
    if (!animated) return;
    const delay = 350 + index * 280;
    scale.value = withDelay(delay, withSequence(withSpring(1.35, { damping: 8 }), withSpring(1)));
    rotate.value = withDelay(delay, withTiming(0, { duration: 400 }));
    if (filled) {
      const timer = setTimeout(() => feedback('star', 'heavy'), delay);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [animated, filled, index, rotate, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  // The middle star sits a little higher and larger, like a podium.
  const isMiddle = index === 1;
  const starSize = isMiddle ? size * 1.2 : size;

  return (
    <Animated.View style={[style, isMiddle && { marginTop: -size * 0.25 }]}>
      <Ionicons name="star" size={starSize} color={filled ? theme.star : theme.starEmpty} />
    </Animated.View>
  );
}

export function StarRow({ count, size = 18, animated = false, gap = 2 }: StarRowProps) {
  return (
    <View style={[styles.row, { gap }]}>
      {[0, 1, 2].map((index) => (
        <Star key={index} index={index} filled={index < count} size={size} animated={animated} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
