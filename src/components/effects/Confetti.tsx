import { Canvas, Group, Path, Skia, useClock } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { palette } from '@/theme';

const COLORS = [palette.purple, palette.blue, palette.coral, palette.gold, '#FFFFFF'];
const DRAG = 1.6;
const LIFETIME = 3.2;

interface Particle {
  x0: number;
  y0: number;
  vx: number;
  vy: number;
  gravity: number;
  w: number;
  h: number;
  rotation: number;
  spin: number;
  flutter: number;
}

function createParticles(count: number, width: number, height: number): Particle[][] {
  const groups: Particle[][] = COLORS.map(() => []);
  for (let i = 0; i < count; i += 1) {
    const fromLeft = i % 2 === 0;
    groups[i % COLORS.length].push({
      x0: fromLeft ? -10 : width + 10,
      y0: height * (0.45 + Math.random() * 0.2),
      vx: (fromLeft ? 1 : -1) * width * (0.6 + Math.random() * 1.2),
      vy: -height * (0.8 + Math.random() * 0.9),
      gravity: height * (0.9 + Math.random() * 0.4),
      w: 6 + Math.random() * 6,
      h: 10 + Math.random() * 8,
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 12,
      flutter: 4 + Math.random() * 6,
    });
  }
  return groups;
}

function ConfettiGroup({ particles, color, clock }: { particles: Particle[]; color: string; clock: SharedValue<number> }) {
  const path = useDerivedValue(() => {
    const t = clock.value / 1000;
    const p = Skia.Path.Make();
    // Air drag: velocity decays exponentially, so particles burst out then float down.
    const travel = (1 - Math.exp(-DRAG * t)) / DRAG;
    for (const particle of particles) {
      const x = particle.x0 + particle.vx * travel;
      const y = particle.y0 + particle.vy * travel + 0.5 * particle.gravity * t * t * 0.35;
      const angle = particle.rotation + particle.spin * t;
      const hw = (particle.w / 2) * Math.abs(Math.cos(particle.flutter * t));
      const hh = particle.h / 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      p.moveTo(x - hw * cos + hh * sin, y - hw * sin - hh * cos);
      p.lineTo(x + hw * cos + hh * sin, y + hw * sin - hh * cos);
      p.lineTo(x + hw * cos - hh * sin, y + hw * sin + hh * cos);
      p.lineTo(x - hw * cos - hh * sin, y - hw * sin + hh * cos);
      p.close();
    }
    return p;
  });
  return <Path path={path} color={color} />;
}

/** One-shot confetti burst from both screen edges. */
export function Confetti({ count = 110 }: { count?: number }) {
  const { width, height } = useWindowDimensions();
  const clock = useClock();
  const groups = useMemo(() => createParticles(count, width, height), [count, width, height]);
  const opacity = useDerivedValue(() => {
    const t = clock.value / 1000;
    return t < LIFETIME - 0.8 ? 1 : Math.max(0, (LIFETIME - t) / 0.8);
  });

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Group opacity={opacity}>
        {groups.map((particles, i) => (
          <ConfettiGroup key={COLORS[i]} particles={particles} color={COLORS[i]} clock={clock} />
        ))}
      </Group>
    </Canvas>
  );
}
