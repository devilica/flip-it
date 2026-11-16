import { BlurMask, Canvas, Circle, Fill, Group, LinearGradient, useClock, vec } from '@shopify/react-native-skia';
import { memo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { useDerivedValue } from 'react-native-reanimated';

import { useTheme } from '@/hooks/useTheme';
import { palette } from '@/theme';

interface OrbProps {
  color: string;
  radius: number;
  baseX: number;
  baseY: number;
  driftX: number;
  driftY: number;
  /** Seconds per full drift cycle. */
  period: number;
  phase: number;
  clock: ReturnType<typeof useClock>;
}

function Orb({ color, radius, baseX, baseY, driftX, driftY, period, phase, clock }: OrbProps) {
  const cx = useDerivedValue(
    () => baseX + Math.sin((clock.value / 1000 / period) * Math.PI * 2 + phase) * driftX,
  );
  const cy = useDerivedValue(
    () => baseY + Math.cos((clock.value / 1000 / period) * Math.PI * 2 + phase) * driftY,
  );
  return (
    <Circle cx={cx} cy={cy} r={radius} color={color}>
      <BlurMask blur={radius * 0.6} style="normal" />
    </Circle>
  );
}

/** Slowly drifting, heavily blurred color orbs behind every screen. */
export const AnimatedBackground = memo(function AnimatedBackground() {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const clock = useClock();
  const r = Math.max(width, height) * 0.32;

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Fill>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(width * 0.4, height)}
          colors={[theme.backgroundAlt, theme.background]}
        />
      </Fill>
      <Group opacity={theme.orbOpacity}>
        <Orb
          clock={clock}
          color={palette.purple}
          radius={r}
          baseX={width * 0.1}
          baseY={height * 0.12}
          driftX={width * 0.12}
          driftY={height * 0.05}
          period={18}
          phase={0}
        />
        <Orb
          clock={clock}
          color={palette.blue}
          radius={r * 0.85}
          baseX={width * 0.95}
          baseY={height * 0.45}
          driftX={width * 0.1}
          driftY={height * 0.08}
          period={22}
          phase={2}
        />
        <Orb
          clock={clock}
          color={palette.coral}
          radius={r * 0.6}
          baseX={width * 0.2}
          baseY={height * 0.92}
          driftX={width * 0.15}
          driftY={height * 0.04}
          period={26}
          phase={4}
        />
      </Group>
    </Canvas>
  );
});
