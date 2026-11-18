import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { IconButton } from '@/components/ui/IconButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StarRow } from '@/components/ui/StarRow';
import { starsForMoves } from '@/game/engine';
import type { Difficulty, LevelDef } from '@/game/types';
import { useTheme } from '@/hooks/useTheme';
import { useI18n, type MessageKey } from '@/i18n';
import { palette, radius, spacing } from '@/theme';

const difficultyColor: Record<Difficulty, string> = {
  easy: '#34D399',
  medium: palette.blue,
  hard: palette.purple,
  expert: palette.coral,
  master: palette.gold,
};

interface GameHudProps {
  title: string;
  level: LevelDef;
  movesUsed: number;
  moveLimit: number;
  /** 0..1 share of tiles in the dominant color. */
  boardProgress: number;
  /** Minimum moves from the board after the player has tapped. Hidden before the first tap. */
  nowMoves: number | null;
  onPause: () => void;
  onHelp: () => void;
}

export function GameHud({ title, level, movesUsed, moveLimit, boardProgress, nowMoves, onPause, onHelp }: GameHudProps) {
  const theme = useTheme();
  const { t } = useI18n();
  const remaining = Math.max(0, moveLimit - movesUsed);
  const low = remaining <= 2;
  // Stars the player can still earn if they solve the board with the next move.
  const potentialStars = starsForMoves(level, movesUsed + 1);

  return (
    <View style={styles.root}>
      <View style={styles.topRow}>
        <IconButton icon="pause" accessibilityLabel={t('pause')} onPress={onPause} size={48} />
        <View style={styles.titleBlock}>
          <AppText size={24} weight="bold" align="center">
            {title}
          </AppText>
          <View style={[styles.chip, { backgroundColor: theme.surface }]}>
            <View style={[styles.dot, { backgroundColor: difficultyColor[level.difficulty] }]} />
            <AppText size={12} weight="semibold" tone="muted">
              {t(level.difficulty as MessageKey).toLocaleUpperCase()} · {level.board.size}×{level.board.size}
              {level.board.colors === 3 ? ` · ${t('threeColors').toLocaleUpperCase()}` : ''}
            </AppText>
          </View>
          <StarRow count={potentialStars} size={16} />
          <AppText size={12} weight="semibold" tone="muted" align="center">
            {level.par === 1 ? t('levelSolvedOne') : t('levelSolved', { n: level.par })}
          </AppText>
        </View>
        <IconButton icon="help-circle" accessibilityLabel={t('howToPlay')} onPress={onHelp} size={48} />
      </View>

      <View style={[styles.panel, { backgroundColor: theme.surfaceStrong }]}>
        <View style={styles.stat}>
          <AppText size={12} weight="semibold" tone="subtle">
            {t('moves').toLocaleUpperCase()}
          </AppText>
          <View style={styles.movesRow}>
            <AppText size={30} weight="bold" color={low ? palette.coral : theme.text}>
              {movesUsed}
            </AppText>
            <AppText size={18} weight="semibold" tone="subtle">
              {' '}
              / {moveLimit}
            </AppText>
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.divider }]} />
        <View style={[styles.stat, styles.progressStat]}>
          <View style={styles.progressLabel}>
            <AppText size={12} weight="semibold" tone="subtle">
              {t('matched').toLocaleUpperCase()}
            </AppText>
            <AppText size={12} weight="semibold" tone="muted">
              {Math.round(boardProgress * 100)}%
            </AppText>
          </View>
          <ProgressBar value={boardProgress} height={10} />
          <AppText size={12} weight="medium" tone="subtle">
            {remaining === 1 ? t('moveLeft') : t('movesLeft', { n: remaining })}
          </AppText>
          <AppText size={12} weight="semibold" tone="muted">
            {nowMoves === null ? t('nowSolvedUnknown') : nowMoves === 1 ? t('nowSolvedOne') : t('nowSolved', { n: nowMoves })}
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleBlock: { alignItems: 'center', gap: 6, flex: 1 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  panel: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  stat: { gap: 2 },
  movesRow: { flexDirection: 'row', alignItems: 'baseline' },
  divider: { width: 1, alignSelf: 'stretch' },
  progressStat: { flex: 1, gap: 6 },
  progressLabel: { flexDirection: 'row', justifyContent: 'space-between' },
});
