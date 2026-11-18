import { StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/ui/IconButton';
import { useI18n } from '@/i18n';
import { spacing } from '@/theme';

interface GameControlsProps {
  canUndo: boolean;
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
  canRestart,
  hintsLeft,
  hintActive,
  disabled,
  onUndo,
  onRestart,
  onHint,
}: GameControlsProps) {
  const { t } = useI18n();
  return (
    <View style={styles.row}>
      <IconButton
        icon="arrow-undo"
        label={t('undo')}
        accessibilityLabel={t('undoLast')}
        onPress={onUndo}
        disabled={disabled || !canUndo}
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
        badge={hintsLeft}
        size={60}
        silent
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-evenly', paddingTop: spacing.sm },
});
