import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { FlipMascot } from '@/components/mascot/FlipMascot';
import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/hooks/useTheme';
import { Highlighted } from '@/i18n/Highlighted';
import { useI18n } from '@/i18n';
import { palette, radius, spacing } from '@/theme';

const TILE = '#F3C7A6';

type CellKind = 'mascot' | 'x';

interface SudokuRulesCardProps {
  cellSize?: number;
}

/** The tap rule, then the three placement rules, each shown on a tiny board. */
export function SudokuRulesCard({ cellSize = 16 }: SudokuRulesCardProps) {
  const theme = useTheme();
  const { t } = useI18n();
  return (
    <View style={[styles.card, { backgroundColor: theme.surfaceStrong }]}>
      <View style={styles.tap}>
        <Highlighted template={t('tapOnce')} words={{ once: t('once'), x: t('markX') }} />
        <Highlighted template={t('tapAgain')} words={{ again: t('again'), mascot: t('mascotWord') }} />
      </View>
      <View style={styles.rules}>
      <Rule
        caption={t('onePerColor')}
        board={
          <View style={styles.grid}>
            <View style={styles.row}>
              <MiniCell kind="mascot" size={cellSize} />
              <MiniCell kind="x" size={cellSize} />
            </View>
            <View style={styles.row}>
              <MiniCell kind="x" size={cellSize} />
              <MiniCell kind="x" size={cellSize} />
            </View>
          </View>
        }
      />
      <View style={[styles.divider, { backgroundColor: theme.divider }]} />
      <Rule
        caption={t('onePerRow')}
        board={
          <View style={styles.plus}>
            <MiniCell kind="x" size={cellSize} />
            <View style={styles.row}>
              <MiniCell kind="x" size={cellSize} />
              <MiniCell kind="mascot" size={cellSize} />
              <MiniCell kind="x" size={cellSize} />
            </View>
            <MiniCell kind="x" size={cellSize} />
          </View>
        }
      />
      <View style={[styles.divider, { backgroundColor: theme.divider }]} />
      <Rule
        caption={t('notAdjacent')}
        board={
          <View style={styles.grid}>
            {(
              [
                ['mascot', 'x', 'mascot'],
                ['x', 'x', 'x'],
                ['mascot', 'x', 'mascot'],
              ] as CellKind[][]
            ).map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {row.map((kind, colIndex) => (
                  <MiniCell key={colIndex} kind={kind} size={cellSize} />
                ))}
              </View>
            ))}
          </View>
        }
      />
      </View>
    </View>
  );
}

function Rule({ board, caption }: { board: ReactNode; caption: string }) {
  return (
    <View style={styles.rule}>
      <View style={styles.preview}>{board}</View>
      <AppText size={11} weight="semibold" tone="muted" align="center">
        {caption}
      </AppText>
    </View>
  );
}

function MiniCell({ kind, size }: { kind: CellKind; size: number }) {
  return (
    <View style={[styles.cell, { width: size, height: size, borderRadius: size * 0.22 }]}>
      {kind === 'mascot' ? <FlipMascot size={Math.floor(size * 0.92)} /> : null}
      {kind === 'x' ? (
        <AppText size={Math.floor(size * 0.55)} weight="bold" color={palette.navy}>
          X
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  tap: { gap: 2 },
  rules: { flexDirection: 'row', alignItems: 'stretch' },
  rule: { flex: 1, alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.xs },
  preview: { minHeight: 58, alignItems: 'center', justifyContent: 'center' },
  divider: { width: 1, marginVertical: spacing.xs },
  grid: { gap: 2 },
  plus: { alignItems: 'center', gap: 2 },
  row: { flexDirection: 'row', gap: 2 },
  cell: { backgroundColor: TILE, alignItems: 'center', justifyContent: 'center' },
});
