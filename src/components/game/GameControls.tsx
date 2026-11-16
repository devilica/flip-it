import { StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/ui/IconButton';
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
  return (
    <View style={styles.row}>
      <IconButton
        icon="arrow-undo"
        label="Undo"
        accessibilityLabel="Undo last move"
        onPress={onUndo}
        disabled={disabled || !canUndo}
        size={60}
        silent
      />
      <IconButton
        icon="refresh"
        label="Restart"
        accessibilityLabel="Restart level"
        onPress={onRestart}
        disabled={disabled || !canRestart}
        size={60}
        silent
      />
      <IconButton
        icon={hintActive ? 'bulb' : 'bulb-outline'}
        label="Hint"
        accessibilityLabel={
          hintsLeft <= 0 && !hintActive ? 'Watch an ad for more hints' : `Show hint, ${hintsLeft} left`
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
