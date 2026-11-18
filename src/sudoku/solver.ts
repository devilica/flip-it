import { cellIndex, colOf, rowOf } from './rules';
import type { SudokuLevel } from './types';

/**
 * Finds up to `limit` ways to place one mascot in every row, column, and region.
 * Givens are required. Blocked cells are refused.
 */
export function solveLevel(level: SudokuLevel, limit = 2): number[][] {
  const size = level.size;
  const givenColumn = Array.from({ length: size }, () => -1);
  for (const index of level.given) givenColumn[rowOf(size, index)] = colOf(size, index);

  const blocked = new Set(level.blocked);
  const columnUsed = Array.from({ length: size }, () => false);
  const regionUsed = Array.from({ length: size }, () => false);
  const placement: number[] = [];
  const solutions: number[][] = [];

  const search = (row: number) => {
    if (solutions.length >= limit) return;
    if (row === size) {
      solutions.push(placement.slice());
      return;
    }

    const fixed = givenColumn[row];
    for (let col = 0; col < size; col += 1) {
      if (fixed !== -1 && col !== fixed) continue;
      const index = cellIndex(size, row, col);
      if (blocked.has(index) || columnUsed[col]) continue;
      const region = level.regions[index];
      if (regionUsed[region]) continue;

      columnUsed[col] = true;
      regionUsed[region] = true;
      placement.push(index);
      search(row + 1);
      placement.pop();
      regionUsed[region] = false;
      columnUsed[col] = false;
      if (solutions.length >= limit) return;
    }
  };

  search(0);
  return solutions;
}

/** The single solution, or null when the level is ambiguous or impossible. */
export function uniqueSolution(level: SudokuLevel): number[] | null {
  const found = solveLevel(level, 2);
  return found.length === 1 ? found[0] : null;
}
