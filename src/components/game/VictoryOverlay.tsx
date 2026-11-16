import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Confetti } from '@/components/effects/Confetti';
import { AppText } from '@/components/ui/AppText';
import { GameButton } from '@/components/ui/GameButton';
import { OverlayPanel } from '@/components/ui/OverlayPanel';
import { StarRow } from '@/components/ui/StarRow';
import { useTheme } from '@/hooks/useTheme';
import { radius, spacing } from '@/theme';

const headlines = ['Solved!', 'Solved!', 'Great job!', 'Perfect!'];

interface VictoryOverlayProps {
  stars: number;
  movesUsed: number;
  par: number;
  bestMoves: number | null;
  continueLabel: string;
  continueDisabled?: boolean;
  onContinue: () => void;
  onReplay: () => void;
  onHome: () => void;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <AppText size={24} weight="bold">
        {value}
      </AppText>
      <AppText size={12} weight="semibold" tone="subtle">
        {label}
      </AppText>
    </View>
  );
}

export function VictoryOverlay({
  stars,
  movesUsed,
  par,
  bestMoves,
  continueLabel,
  continueDisabled = false,
  onContinue,
  onReplay,
  onHome,
}: VictoryOverlayProps) {
  const theme = useTheme();
  return (
    <OverlayPanel backdropContent={<Confetti />}>
      <View style={styles.starsWrap}>
        <StarRow count={stars} size={52} animated gap={6} />
      </View>
      <Animated.View entering={FadeInUp.delay(250).springify()}>
        <AppText size={34} weight="bold" align="center">
          {headlines[stars]}
        </AppText>
        <AppText size={15} tone="muted" align="center">
          {stars === 3 ? 'Solved in the fewest possible moves.' : `Solve it in ${par} moves for 3 stars.`}
        </AppText>
      </Animated.View>
      <View style={[styles.stats, { backgroundColor: theme.surface }]}>
        <Stat label="MOVES" value={String(movesUsed)} />
        <Stat label="POSSIBLE" value={String(par)} />
        <Stat label="BEST" value={bestMoves === null ? '-' : String(bestMoves)} />
      </View>
      <GameButton
        label={continueDisabled ? 'Loading ad...' : continueLabel}
        icon="arrow-forward"
        size="lg"
        onPress={onContinue}
        disabled={continueDisabled}
        style={styles.full}
      />
      <View style={styles.row}>
        <GameButton label="Replay" icon="refresh" variant="secondary" size="sm" onPress={onReplay} style={styles.half} />
        <GameButton label="Home" icon="home" variant="secondary" size="sm" onPress={onHome} style={styles.half} />
      </View>
    </OverlayPanel>
  );
}

const styles = StyleSheet.create({
  starsWrap: { paddingTop: spacing.md, paddingBottom: spacing.xs },
  stats: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    justifyContent: 'space-around',
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    marginVertical: spacing.xs,
  },
  stat: { alignItems: 'center' },
  full: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', gap: spacing.md, alignSelf: 'stretch' },
  half: { flex: 1 },
});
