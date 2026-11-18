import { Image, StyleSheet } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { mascotById } from '@/flip-code/mascots';
import type { MascotId } from '@/flip-code/types';

interface CodeMascotProps {
  id: MascotId;
  size: number;
}

/** One of the four code mascots, kept at its own proportions. */
export function CodeMascot({ id, size }: CodeMascotProps) {
  const mascot = mascotById(id);
  return (
    <Animated.View entering={ZoomIn.springify().damping(14)} style={{ width: size, height: size }}>
      <Image source={mascot.source} accessibilityLabel={mascot.name} style={styles.image} resizeMode="contain" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', height: '100%' },
});
