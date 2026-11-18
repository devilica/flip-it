import { useLocalSearchParams } from 'expo-router';

import { SudokuScreen } from '@/screens/SudokuScreen';
import { SUDOKU_LEVEL_COUNT } from '@/sudoku/levels';

export default function SudokuLevelRoute() {
  const params = useLocalSearchParams<{ level: string }>();
  const levelNumber = Number.parseInt(params.level ?? '1', 10);
  const level = Number.isInteger(levelNumber) && levelNumber >= 1 && levelNumber <= SUDOKU_LEVEL_COUNT ? levelNumber : 1;
  return <SudokuScreen key={level} levelNumber={level} />;
}
