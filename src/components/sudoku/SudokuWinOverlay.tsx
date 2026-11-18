import { StyleSheet, View } from 'react-native';

import { Confetti } from '@/components/effects/Confetti';
import { FlipMascot } from '@/components/mascot/FlipMascot';
import { AppText } from '@/components/ui/AppText';
import { GameButton } from '@/components/ui/GameButton';
import { OverlayPanel } from '@/components/ui/OverlayPanel';
import { StarRow } from '@/components/ui/StarRow';
import { useI18n } from '@/i18n';
import { spacing } from '@/theme';

interface SudokuWinOverlayProps {
  stars: number;
  nextLabel: string;
  onNext: () => void;
  onReplay: () => void;
  onHome: () => void;
}

export function SudokuWinOverlay({ stars, nextLabel, onNext, onReplay, onHome }: SudokuWinOverlayProps) {
  const { t } = useI18n();
  return (
    <OverlayPanel backdropContent={<Confetti />}>
      <View style={styles.mascot}>
        <FlipMascot state="jumping" size={72} />
      </View>
      <StarRow count={stars} size={42} animated gap={6} />
      <AppText size={32} weight="bold" align="center">
        {stars === 3 ? t('perfect') : t('solvedBang')}
      </AppText>
      <AppText size={15} tone="muted" align="center">
        {stars === 3 ? t('noHintsNeeded') : t('solveWithoutBulb')}
      </AppText>
      <GameButton label={nextLabel} icon="arrow-forward" size="lg" onPress={onNext} style={styles.full} />
      <View style={styles.row}>
        <GameButton label={t('replay')} icon="refresh" variant="secondary" size="sm" onPress={onReplay} style={styles.half} />
        <GameButton label={t('home')} icon="home" variant="secondary" size="sm" onPress={onHome} style={styles.half} />
      </View>
    </OverlayPanel>
  );
}

const styles = StyleSheet.create({
  mascot: { alignItems: 'center' },
  full: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', gap: spacing.sm },
  half: { flex: 1 },
});
