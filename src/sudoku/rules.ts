import type { PlayerMark, SudokuLevel } from './types';

export const cellIndex = (size: number, row: number, col: number) => row * size + col;

export const rowOf = (size: number, index: number) => Math.floor(index / size);

export const colOf = (size: number, index: number) => index % size;

export function isGiven(level: SudokuLevel, index: number): boolean {
  return level.given.includes(index);
}

export function isBlocked(level: SudokuLevel, index: number): boolean {
  return level.blocked.includes(index);
}

/** Mascot cells currently on the board, including locked givens. */
export function mascotCells(level: SudokuLevel, marks: PlayerMark[]): number[] {
  const placed = level.given.slice();
  marks.forEach((mark, index) => {
    if (mark === 'mascot' && !placed.includes(index)) placed.push(index);
  });
  return placed;
}

/**
 * A mascot may be added here when it would not share a row, column, or region
 * with a mascot already on the board.
 */
export function canPlaceMascot(level: SudokuLevel, marks: PlayerMark[], index: number): boolean {
  if (isBlocked(level, index) || isGiven(level, index) || marks[index] === 'mascot') return false;
  const size = level.size;
  const row = rowOf(size, index);
  const col = colOf(size, index);
  const region = level.regions[index];
  return mascotCells(level, marks).every((other) => {
    return rowOf(size, other) !== row && colOf(size, other) !== col && level.regions[other] !== region;
  });
}

/** True when the placed mascots are exactly the solved set. */
export function matchesSolution(level: SudokuLevel, marks: PlayerMark[], solution: number[]): boolean {
  if (solution.length !== level.size) return false;
  const placed = mascotCells(level, marks).sort((a, b) => a - b);
  const expected = solution.slice().sort((a, b) => a - b);
  return placed.length === expected.length && placed.every((cell, index) => cell === expected[index]);
}

/** The only legal mascot cell in some open row, or null when nothing is forced yet. */
export function forcedCell(level: SudokuLevel, marks: PlayerMark[]): number | null {
  const size = level.size;
  const occupiedRows = new Set(mascotCells(level, marks).map((cell) => rowOf(size, cell)));
  for (let row = 0; row < size; row += 1) {
    if (occupiedRows.has(row)) continue;
    const options: number[] = [];
    for (let col = 0; col < size; col += 1) {
      const index = cellIndex(size, row, col);
      if (canPlaceMascot(level, marks, index)) options.push(index);
    }
    if (options.length === 1) return options[0];
  }
  return null;
}

export function starsForLightbulbs(used: number): number {
  if (used <= 0) return 3;
  if (used === 1) return 2;
  return 1;
}

export function emptyMarks(level: SudokuLevel): PlayerMark[] {
  return Array.from({ length: level.size * level.size }, () => 'empty');
}
