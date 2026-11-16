import { useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { SkiaBoard } from '@/components/board/SkiaBoard';
import { AppText } from '@/components/ui/AppText';
import { GameButton } from '@/components/ui/GameButton';
import { OverlayPanel } from '@/components/ui/OverlayPanel';
import { applyTap, createBoard } from '@/game/engine';
import { useTheme } from '@/hooks/useTheme';
import type { TapEvent } from '@/store/gameStore';
import { palette, spacing } from '@/theme';

const CENTER = 4;

const STEPS = [
  {
    title: 'Tap a tile',
    body: 'Tap the highlighted tile in the middle.',
  },
  {
    title: 'Neighbors flip too',
    body: 'That tile changes color, and so do the ones above, below, left, and right. Diagonals do not flip.',
  },
  {
    title: 'Match the board',
    body: 'Keep flipping until every tile is the same color.',
  },
] as const;

/** Three-step card that demonstrates the real flip rule on a 3x3 board. */
export function FlipTutorial({ onDone }: { onDone: () => void }) {
  const theme = useTheme();
  const { height } = useWindowDimensions();
  const [step, setStep] = useState(0);
  const stepRef = useRef(0);
  const advancing = useRef(false);
  const [board, setBoard] = useState(() => createBoard(3, 2));
  const [lastTap, setLastTap] = useState<TapEvent | null>(null);
  const copy = STEPS[step];

  const showStep = (next: number) => {
    stepRef.current = next;
    setStep(next);
  };

  const advance = () => {
    if (advancing.current) return;
    advancing.current = true;
    const current = stepRef.current;
    if (current < STEPS.length - 1) {
      showStep(current + 1);
      setTimeout(() => {
        advancing.current = false;
      }, 400);
      return;
    }
    onDone();
  };

  const onTapCell = (index: number) => {
    if (step !== 0 || index !== CENTER) return;
    setBoard((current) => applyTap(current, index));
    setLastTap({ index, seq: 1 });
    showStep(1);
  };

  return (
    <OverlayPanel>
      <AppText size={13} weight="semibold" tone="subtle">
        HOW TO PLAY
      </AppText>
      <SkiaBoard
        board={board}
        size={height < 720 ? 168 : 200}
        lastTap={lastTap}
        hintCell={step === 0 ? CENTER : null}
        interactive={step === 0}
        celebrate={false}
        onTapCell={onTapCell}
      />
      <View style={styles.copy}>
        <AppText size={24} weight="bold" align="center">
          {copy.title}
        </AppText>
        <AppText size={15} tone="muted" align="center">
          {copy.body}
        </AppText>
      </View>
      <View style={styles.dots}>
        {STEPS.map((item, index) => (
          <View
            key={item.title}
            style={[styles.dot, { backgroundColor: index === step ? palette.purple : theme.textSubtle }]}
          />
        ))}
      </View>
      <View style={styles.action}>
        {step === 0 ? (
          <AppText size={16} weight="semibold" tone="muted" align="center">
            Tap the highlighted tile
          </AppText>
        ) : (
          <GameButton
            label={step === STEPS.length - 1 ? "Let's play" : 'Next'}
            icon={step === STEPS.length - 1 ? 'play' : 'arrow-forward'}
            onPress={advance}
            style={styles.button}
          />
        )}
      </View>
    </OverlayPanel>
  );
}

const styles = StyleSheet.create({
  copy: { gap: spacing.sm, alignSelf: 'stretch' },
  dots: { flexDirection: 'row', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  action: { alignSelf: 'stretch', minHeight: 56, justifyContent: 'center' },
  button: { alignSelf: 'stretch' },
});
