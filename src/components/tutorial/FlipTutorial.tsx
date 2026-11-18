import { useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { SkiaBoard } from '@/components/board/SkiaBoard';
import { AppText } from '@/components/ui/AppText';
import { GameButton } from '@/components/ui/GameButton';
import { OverlayPanel } from '@/components/ui/OverlayPanel';
import { applyTap, createBoard } from '@/game/engine';
import { useTheme } from '@/hooks/useTheme';
import { useI18n, type MessageKey } from '@/i18n';
import type { TapEvent } from '@/store/gameStore';
import { palette, spacing } from '@/theme';

const CENTER = 4;
const TAP_STEP = 1;

const STEP_KEYS: { title: MessageKey; body: MessageKey }[] = [
  { title: 'tutOneTitle', body: 'tutOneBody' },
  { title: 'tutTapTitle', body: 'tutTapBody' },
  { title: 'tutNeighborsTitle', body: 'tutNeighborsBody' },
  { title: 'tutMatchTitle', body: 'tutMatchBody' },
];

/** Goal first, then the real flip rule on a 3x3 board. */
export function FlipTutorial({ onDone }: { onDone: () => void }) {
  const theme = useTheme();
  const { t } = useI18n();
  const { height } = useWindowDimensions();
  const [step, setStep] = useState(0);
  const stepRef = useRef(0);
  const advancing = useRef(false);
  const [board, setBoard] = useState(() => createBoard(3, 2));
  const [lastTap, setLastTap] = useState<TapEvent | null>(null);
  const copy = STEP_KEYS[step];

  const showStep = (next: number) => {
    stepRef.current = next;
    setStep(next);
  };

  const advance = () => {
    if (advancing.current) return;
    advancing.current = true;
    const current = stepRef.current;
    if (current < STEP_KEYS.length - 1) {
      showStep(current + 1);
      setTimeout(() => {
        advancing.current = false;
      }, 400);
      return;
    }
    onDone();
  };

  const onTapCell = (index: number) => {
    if (step !== TAP_STEP || index !== CENTER) return;
    setBoard((current) => applyTap(current, index));
    setLastTap({ index, seq: 1 });
    showStep(TAP_STEP + 1);
  };

  return (
    <OverlayPanel>
      <AppText size={13} weight="semibold" tone="subtle">
        {t('howToPlay').toLocaleUpperCase()}
      </AppText>
      <SkiaBoard
        board={board}
        size={height < 720 ? 168 : 200}
        lastTap={lastTap}
        hintCell={step === TAP_STEP ? CENTER : null}
        interactive={step === TAP_STEP}
        celebrate={false}
        onTapCell={onTapCell}
      />
      <View style={styles.copy}>
        <AppText size={24} weight="bold" align="center">
          {copy ? t(copy.title) : ''}
        </AppText>
        <AppText size={15} tone="muted" align="center">
          {copy ? t(copy.body) : ''}
        </AppText>
      </View>
      <View style={styles.dots}>
        {STEP_KEYS.map((item, index) => (
          <View
            key={item.title}
            style={[styles.dot, { backgroundColor: index === step ? palette.purple : theme.textSubtle }]}
          />
        ))}
      </View>
      <View style={styles.action}>
        {step === TAP_STEP ? (
          <AppText size={16} weight="semibold" tone="muted" align="center">
            {t('tapHighlighted')}
          </AppText>
        ) : (
          <GameButton
            label={step === STEP_KEYS.length - 1 ? t('letsPlay') : t('next')}
            icon={step === STEP_KEYS.length - 1 ? 'play' : 'arrow-forward'}
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
