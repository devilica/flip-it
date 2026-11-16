import { useCallback, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';

const MAX_BOARD_SIZE = 520;

/** Measures a container and returns the largest square that fits inside it. */
export function useSquareLayout(maxSize = MAX_BOARD_SIZE) {
  const [size, setSize] = useState(0);
  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      const next = Math.floor(Math.min(width, height, maxSize));
      setSize((current) => (current === next ? current : next));
    },
    [maxSize],
  );
  return { size, onLayout };
}
