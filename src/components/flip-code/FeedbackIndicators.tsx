import { StyleSheet, View } from 'react-native';

import type { Peg } from '@/flip-code/types';
import { useTheme } from '@/hooks/useTheme';
import { palette } from '@/theme';

interface FeedbackIndicatorsProps {
  pegs: Peg[];
}

/** Four dots, ordered exact then misplaced then empty, so they never point at a column. */
export function FeedbackIndicators({ pegs }: FeedbackIndicatorsProps) {
  const theme = useTheme();
  return (
    <View style={styles.grid}>
      {pegs.map((peg, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            peg === 'exact' && { backgroundColor: '#22C55E', borderColor: '#22C55E' },
            peg === 'misplaced' && { backgroundColor: palette.gold, borderColor: palette.gold },
            peg === 'empty' && { backgroundColor: 'transparent', borderColor: theme.divider },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { width: 28, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5 },
});
