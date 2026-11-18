import { createSudokuLevel } from './generate';
import type { SudokuLevel } from './types';

export function sudokuDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}${month}${day}`;
}

const dailyBoards = new Map<string, SudokuLevel>();

/** A fresh board for this date. The same day always returns the same puzzle. */
export function getDailySudoku(date: Date): SudokuLevel {
  const key = sudokuDateKey(date);
  const cached = dailyBoards.get(key);
  if (cached) return cached;

  const numeric = Number(key);
  const sizes = [4, 5, 5, 6];
  const size = sizes[numeric % sizes.length];
  const blocks = size <= 4 ? 2 : size === 5 ? 3 : 4;
  let seed = numeric;
  let built: SudokuLevel | null = null;
  while (!built) {
    seed += 1;
    built = createSudokuLevel(size, seed, blocks);
  }
  const level: SudokuLevel = { ...built, id: 0, magnifier: 2, lightbulb: 2, eraser: 2 };
  dailyBoards.set(key, level);
  return level;
}
