import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { SkiaBoard } from '@/components/board/SkiaBoard';
import { AppText } from '@/components/ui/AppText';
import { applyTap, createBoard } from '@/game/engine';
import type { Board } from '@/game/types';
import type { TapEvent } from '@/store/gameStore';
import { palette } from '@/theme';

const DEMO_SEQUENCE = [4, 0, 8, 2, 6, 4, 1, 7, 3, 5];
const noop = () => {};

/** A tiny self-playing 3x3 board above the title. */
function DemoBoard({ size }: { size: number }) {
  const [state, setState] = useState<{ board: Board; tap: TapEvent | null }>(() => ({
    board: applyTap(createBoard(3, 2), 4),
    tap: null,
  }));

  useEffect(() => {
    let step = 0;
    const timer = setInterval(() => {
      const index = DEMO_SEQUENCE[step % DEMO_SEQUENCE.length];
      step += 1;
      setState((current) => ({
        board: applyTap(current.board, index),
        tap: { index, seq: step },
      }));
    }, 1100);
    return () => clearInterval(timer);
  }, []);

  return (
    <SkiaBoard
      board={state.board}
      size={size}
      lastTap={state.tap}
      hintCell={null}
      interactive={false}
      celebrate={false}
      onTapCell={noop}
    />
  );
}

export function LogoMark({ boardSize = 120, titleSize = 56 }: { boardSize?: number; titleSize?: number }) {
  return (
    <View style={styles.root}>
      <Animated.View entering={FadeInDown.springify().damping(14)}>
        <DemoBoard size={boardSize} />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(120).springify().damping(14)} style={styles.titleRow}>
        <AppText size={titleSize} weight="bold" style={[styles.title, { lineHeight: titleSize + 6 }]}>
          FLIP
        </AppText>
        <AppText size={titleSize} weight="bold" color={palette.blue} style={[styles.title, { lineHeight: titleSize + 6 }]}>
          {' '}
          IT
        </AppText>
        <AppText size={titleSize} weight="bold" color={palette.coral} style={[styles.title, { lineHeight: titleSize + 6 }]}>
          !
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: 18 },
  titleRow: { flexDirection: 'row' },
  title: { letterSpacing: 1, lineHeight: 62 },
});
