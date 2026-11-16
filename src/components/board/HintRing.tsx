import { BlurMask, Group, RoundedRect, useClock } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';

interface HintRingProps {
  x: number;
  y: number;
  size: number;
  corner: number;
}

/** Pulsing glow drawn around the suggested tile. */
export function HintRing({ x, y, size, corner }: HintRingProps) {
  const clock = useClock();
  const opacity = useDerivedValue(() => 0.55 + 0.45 * Math.sin(clock.value / 180));
  const inset = -Math.max(3, size * 0.06);
  return (
    <Group opacity={opacity}>
      <RoundedRect
        x={x + inset}
        y={y + inset}
        width={size - inset * 2}
        height={size - inset * 2}
        r={corner - inset}
        color="#FFFFFF"
        style="stroke"
        strokeWidth={Math.max(3, size * 0.06)}
      >
        <BlurMask blur={4} style="solid" />
      </RoundedRect>
    </Group>
  );
}
