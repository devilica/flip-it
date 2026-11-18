import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';

import { FlipMascot } from '@/components/mascot/FlipMascot';
import { AppText } from '@/components/ui/AppText';
import { isGiven } from '@/sudoku/rules';
import type { PlayerMark, SudokuLevel } from '@/sudoku/types';
import { palette } from '@/theme';

const WRONG_COLOR = '#7F1D1D';

const REGION_COLORS = [
  '#FFE500',
  '#3A6BFF',
  '#FF6A00',
  '#0E8F4E',
  '#FF2E8A',
  '#00E5FF',
  '#FFB089',
  '#00C853',
  '#FF8AD0',
  '#70FF1A',
];

interface SudokuBoardProps {
  level: SudokuLevel;
  size: number;
  marks: PlayerMark[];
  selected: number | null;
  hint: number | null;
  shake: number | null;
  shakeNonce: number;
  happy: number | null;
  onPress: (index: number) => void;
}

export function SudokuBoard(props: SudokuBoardProps) {
  const { level, size } = props;
  const gap = 4;
  const cell = Math.floor((size - gap * (level.size + 1)) / level.size);

  return (
    <View style={[styles.board, { width: size, height: size, padding: gap, gap }]}>
      {Array.from({ length: level.size }, (_, row) => (
        <View key={row} style={[styles.row, { gap }]}>
          {Array.from({ length: level.size }, (_, col) => {
            const index = row * level.size + col;
            return (
              <BoardCell
                key={index}
                level={level}
                marks={props.marks}
                selected={props.selected}
                hint={props.hint}
                shake={props.shake}
                shakeNonce={props.shakeNonce}
                happy={props.happy}
                onPress={props.onPress}
                index={index}
                cell={cell}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

function BoardCell({
  level,
  marks,
  selected,
  hint,
  shake,
  shakeNonce,
  happy,
  onPress,
  index,
  cell,
}: Omit<SudokuBoardProps, 'size'> & { index: number; cell: number }) {
  const given = isGiven(level, index);
  const mark = given ? 'mascot' : marks[index];
  const shift = useSharedValue(0);

  useEffect(() => {
    if (shake !== index || shakeNonce === 0) return;
    shift.value = withSequence(
      withTiming(-4, { duration: 40 }),
      withTiming(4, { duration: 40 }),
      withTiming(-3, { duration: 40 }),
      withTiming(0, { duration: 40 }),
    );
  }, [index, shake, shakeNonce, shift]);

  const animated = useAnimatedStyle(() => ({ transform: [{ translateX: shift.value }] }));
  const region = REGION_COLORS[level.regions[index] % REGION_COLORS.length];

  return (
    <Animated.View style={animated}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={cellLabel(mark, given)}
        onPress={() => onPress(index)}
        style={[
          styles.cell,
          {
            width: cell,
            height: cell,
            borderRadius: cell * 0.22,
            backgroundColor: region,
            borderColor: hint === index ? palette.gold : selected === index ? palette.navy : 'transparent',
          },
        ]}
      >
        {mark === 'mascot' ? (
          <FlipMascot state={happy === index ? 'happy' : 'idle'} size={Math.floor(cell * 0.72)} />
        ) : null}
        {mark === 'x' ? (
          <AppText size={Math.floor(cell * 0.42)} weight="bold" color={palette.navy}>
            X
          </AppText>
        ) : null}
        {mark === 'wrong' ? (
          <AppText size={Math.floor(cell * 0.72)} weight="bold" color={WRONG_COLOR}>
            X
          </AppText>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

function cellLabel(mark: PlayerMark, given: boolean): string {
  if (given || mark === 'mascot') return 'Placed mascot';
  if (mark === 'wrong') return 'Wrong guess';
  if (mark === 'x') return 'Eliminated cell';
  return 'Empty cell';
}

const styles = StyleSheet.create({
  board: { borderRadius: 22, backgroundColor: 'rgba(16,20,38,0.08)' },
  row: { flexDirection: 'row' },
  cell: { alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
});
