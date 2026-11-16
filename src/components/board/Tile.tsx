import { Group, LinearGradient, RoundedRect, vec } from '@shopify/react-native-skia';
import { memo, useEffect, useRef } from 'react';
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export const FLIP_DURATION_MS = 300;

interface TileProps {
  x: number;
  y: number;
  size: number;
  corner: number;
  colorIndex: number;
  fills: string[];
  shades: string[];
  shine: string;
  /** Delay before this tile flips, creating a ripple from the tapped cell. */
  flipDelay: number;
  /** Changes whenever the board is tapped, so each tap re-triggers the flip. */
  seq: number;
  /** When positive, the tile performs a celebration bounce after this delay. */
  celebrateDelay: number;
}

export const Tile = memo(function Tile({
  x,
  y,
  size,
  corner,
  colorIndex,
  fills,
  shades,
  shine,
  flipDelay,
  seq,
  celebrateDelay,
}: TileProps) {
  const fromIndex = useSharedValue(colorIndex);
  const toIndex = useSharedValue(colorIndex);
  const progress = useSharedValue(1);
  const bounce = useSharedValue(1);
  const previous = useRef(colorIndex);

  useEffect(() => {
    if (previous.current === colorIndex) return;
    fromIndex.value = previous.current;
    toIndex.value = colorIndex;
    previous.current = colorIndex;
    progress.value = 0;
    progress.value = withDelay(
      flipDelay,
      withTiming(1, { duration: FLIP_DURATION_MS, easing: Easing.inOut(Easing.cubic) }),
    );
    // seq is included so repeated taps on 3-color boards always restart the flip.
  }, [colorIndex, flipDelay, fromIndex, progress, seq, toIndex]);

  useEffect(() => {
    if (celebrateDelay <= 0) return;
    bounce.value = withDelay(
      celebrateDelay,
      withSequence(withTiming(1.12, { duration: 160 }), withSpring(1, { damping: 7, stiffness: 180 })),
    );
  }, [bounce, celebrateDelay]);

  const depth = Math.max(2, size * 0.07);
  const center = vec(x + size / 2, y + size / 2);

  const fill = useDerivedValue(
    () => fills[progress.value < 0.5 ? fromIndex.value : toIndex.value],
    [fills],
  );
  const shadeColor = useDerivedValue(
    () => shades[progress.value < 0.5 ? fromIndex.value : toIndex.value],
    [shades],
  );
  const transform = useDerivedValue(() => {
    const p = progress.value;
    const flip = Math.max(0.04, Math.abs(1 - 2 * p));
    const lift = 1 + 0.08 * Math.sin(Math.PI * p);
    return [{ scaleX: flip * lift * bounce.value }, { scaleY: lift * bounce.value }];
  });

  return (
    <Group origin={center} transform={transform}>
      <RoundedRect x={x} y={y + depth} width={size} height={size - depth} r={corner} color={shadeColor} />
      <RoundedRect x={x} y={y} width={size} height={size - depth} r={corner} color={fill} />
      <RoundedRect x={x} y={y} width={size} height={size - depth} r={corner}>
        <LinearGradient
          start={vec(x, y)}
          end={vec(x, y + size * 0.6)}
          colors={[shine, 'rgba(255,255,255,0)']}
        />
      </RoundedRect>
    </Group>
  );
});
