import { StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/ui/IconButton';
import { useI18n } from '@/i18n';
import { spacing } from '@/theme';

interface GameControlsProps {
  canUndo: boolean;
  undosLeft: number;
  canRestart: boolean;
  hintsLeft: number;
  hintActive: boolean;
  disabled: boolean;
  onUndo: () => void;
  onRestart: () => void;
  onHint: () => void;
}

export function GameControls({
  canUndo,
  undosLeft,
  canRestart,
  hintsLeft,
  hintActive,
  disabled,
  onUndo,
  onRestart,
  onHint,
}: GameControlsProps) {
  const { t } = useI18n();
  const undoNeedsAd = undosLeft <= 0 && canUndo;
  const hintNeedsAd = hintsLeft <= 0 && !hintActive;
  return (
    <View style={styles.row}>
      <IconButton
        icon="arrow-undo"
        label={t('undo')}
        accessibilityLabel={undosLeft <= 0 ? t('watchMoreUndos') : t('undoLeft', { n: undosLeft })}
        onPress={onUndo}
        disabled={disabled || !canUndo}
        badge={undoNeedsAd ? t('adBadge') : undosLeft}
        size={60}
        silent
      />
      <IconButton
        icon="refresh"
        label={t('restart')}
        accessibilityLabel={t('restartLevel')}
        onPress={onRestart}
        disabled={disabled || !canRestart}
        size={60}
        silent
      />
      <IconButton
        icon={hintActive ? 'bulb' : 'bulb-outline'}
        label={t('hintLabel')}
        accessibilityLabel={
          hintsLeft <= 0 && !hintActive ? t('watchMoreHints') : t('showHintLeft', { n: hintsLeft })
        }
        onPress={onHint}
        disabled={disabled}
        badge={hintNeedsAd ? t('adBadge') : hintsLeft}
        size={60}
        silent
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-evenly', paddingTop: spacing.sm },
});
