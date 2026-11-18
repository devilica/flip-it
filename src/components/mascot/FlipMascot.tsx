import { useEffect } from 'react';
import { StyleSheet, type ImageSourcePropType } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export type MascotState = 'idle' | 'happy' | 'confused' | 'thinking' | 'jumping';

const mascotImage = require('../../assets/images/maskota.png') as ImageSourcePropType;

/** One drawing for every mood. The motion below is what changes. */
const mascotImages: Record<MascotState, ImageSourcePropType> = {
  idle: mascotImage,
  happy: mascotImage,
  confused: mascotImage,
  thinking: mascotImage,
  jumping: mascotImage,
};

interface FlipMascotProps {
  state?: MascotState;
  size?: number;
  /** Faded and still, for a mascot that has not been found yet. */
  muted?: boolean;
}

/** The puzzle mascot, with a motion for each mood. */
export function FlipMascot({ state = 'idle', size = 48, muted = false }: FlipMascotProps) {
  const reduced = useReducedMotion();
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const scaleX = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    translateY.value = 0;
    scale.value = 1;
    scaleX.value = 1;
    rotate.value = 0;
    if (reduced || muted) return;

    if (state === 'idle' || state === 'thinking') {
      const distance = state === 'thinking' ? -3 : -4;
      translateY.value = withRepeat(
        withTiming(distance, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      );
      if (state === 'idle') {
        scale.value = withRepeat(withTiming(1.04, { duration: 1400, easing: Easing.inOut(Easing.sin) }), -1, true);
      }
      return;
    }

    if (state === 'happy') {
      scaleX.value = withSequence(withTiming(1.16, { duration: 120 }), withSpring(1));
      scale.value = withSequence(withTiming(0.84, { duration: 120 }), withSpring(1));
      translateY.value = withSequence(withTiming(-8, { duration: 160 }), withSpring(0));
      return;
    }

    if (state === 'confused') {
      rotate.value = withSequence(
        withTiming(-8, { duration: 70 }),
        withTiming(8, { duration: 80 }),
        withTiming(-5, { duration: 70 }),
        withTiming(0, { duration: 80 }),
      );
      return;
    }

    scaleX.value = withSequence(withTiming(1.18, { duration: 90 }), withTiming(0.94, { duration: 90 }), withSpring(1));
    scale.value = withSequence(withTiming(0.82, { duration: 90 }), withTiming(1.08, { duration: 90 }), withSpring(1));
    translateY.value = withSequence(withTiming(3, { duration: 90 }), withTiming(-size * 0.28, { duration: 180 }), withSpring(0));
  }, [muted, reduced, rotate, scale, scaleX, size, state, translateY]);

  const animated = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scaleX: scaleX.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.frame, { width: size, height: size }, animated]}>
      <Animated.Image
        source={mascotImages[state]}
        tintColor={muted ? '#9AA3B8' : undefined}
        style={{ width: size, height: size, opacity: muted ? 0.55 : 1 }}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  frame: { alignItems: 'center', justifyContent: 'center' },
});
