import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { IconButton } from '@/components/ui/IconButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StarRow } from '@/components/ui/StarRow';
import { starsForMoves } from '@/game/engine';
import type { Difficulty, LevelDef } from '@/game/types';
import { useTheme } from '@/hooks/useTheme';
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
  onPause: () => void;
}

export function GameHud({ title, level, movesUsed, moveLimit, boardProgress, onPause }: GameHudProps) {
  const theme = useTheme();
  const remaining = Math.max(0, moveLimit - movesUsed);
  const low = remaining <= 2;
  // Stars the player can still earn if they solve the board with the next move.
  const potentialStars = starsForMoves(level, movesUsed + 1);

  return (
    <View style={styles.root}>
      <View style={styles.topRow}>
        <IconButton icon="pause" accessibilityLabel="Pause" onPress={onPause} size={48} />
        <View style={styles.titleBlock}>
          <AppText size={24} weight="bold" align="center">
            {title}
          </AppText>
          <View style={[styles.chip, { backgroundColor: theme.surface }]}>
            <View style={[styles.dot, { backgroundColor: difficultyColor[level.difficulty] }]} />
            <AppText size={12} weight="semibold" tone="muted">
              {level.difficulty.toUpperCase()} · {level.board.size}×{level.board.size}
              {level.board.colors === 3 ? ' · 3 COLORS' : ''}
            </AppText>
          </View>
        </View>
        <View style={styles.starSlot}>
          <StarRow count={potentialStars} size={16} />
        </View>
      </View>

      <View style={[styles.panel, { backgroundColor: theme.surfaceStrong }]}>
        <View style={styles.stat}>
          <AppText size={12} weight="semibold" tone="subtle">
            MOVES
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
              MATCHED
            </AppText>
            <AppText size={12} weight="semibold" tone="muted">
              {Math.round(boardProgress * 100)}%
            </AppText>
          </View>
          <ProgressBar value={boardProgress} height={10} />
          <AppText size={12} weight="medium" tone="subtle">
            {remaining === 1 ? '1 move left' : `${remaining} moves left`} · Can be solved in {level.par}
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
  starSlot: { width: 64, alignItems: 'flex-end' },
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
