import { useMemo } from 'react';

import { SudokuScreen } from '@/screens/SudokuScreen';
import { sudokuDateKey } from '@/sudoku/daily';

export default function DailySudokuRoute() {
  const today = useMemo(() => new Date(), []);
  return <SudokuScreen key={sudokuDateKey(today)} levelNumber={0} daily />;
}
