import { Pressable, StyleSheet, View } from 'react-native';

import { CodeMascot } from '@/components/flip-code/CodeMascot';
import { FeedbackIndicators } from '@/components/flip-code/FeedbackIndicators';
import { useTheme } from '@/hooks/useTheme';
import type { MascotId, Peg } from '@/flip-code/types';
import { palette, radius } from '@/theme';

const EMPTY_PEGS: Peg[] = ['empty', 'empty', 'empty', 'empty'];

interface GuessRowProps {
  slots: (MascotId | null)[];
  pegs: Peg[] | null;
  active: boolean;
  selectedIndex: number | null;
  onPressSlot: (index: number) => void;
}

export function GuessRow({ slots, pegs, active, selectedIndex, onPressSlot }: GuessRowProps) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.slots}>
        {slots.map((id, index) => {
          const selected = active && selectedIndex === index;
          return (
            <Pressable
              key={index}
              accessibilityRole="button"
              accessibilityLabel={id === null ? 'Empty slot' : 'Chosen mascot'}
              disabled={!active}
              onPress={() => onPressSlot(index)}
              style={[
                styles.slot,
                { backgroundColor: theme.surfaceStrong },
                selected && { borderColor: palette.purple, borderWidth: 2 },
              ]}
            >
              {id !== null ? <CodeMascot id={id} size={44} /> : null}
            </Pressable>
          );
        })}
      </View>
      <FeedbackIndicators pegs={pegs ?? EMPTY_PEGS} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  slots: { flex: 1, flexDirection: 'row', gap: 8 },
  slot: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 64,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
});
