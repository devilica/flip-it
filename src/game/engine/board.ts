import type { Board, ColorCount, GridSize } from '../types';

export function createBoard(size: GridSize, colors: ColorCount, fill = 0): Board {
  return { size, colors, cells: new Array<number>(size * size).fill(fill) };
}

export function cloneBoard(board: Board): Board {
  return { size: board.size, colors: board.colors, cells: board.cells.slice() };
}

export function isValidIndex(board: Board, index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < board.size * board.size;
}

/** The tapped cell followed by its orthogonal neighbors that exist on the grid. */
export function affectedCells(size: number, index: number): number[] {
  const row = Math.floor(index / size);
  const col = index % size;
  const result = [index];
  if (row > 0) result.push(index - size);
  if (row < size - 1) result.push(index + size);
  if (col > 0) result.push(index - 1);
  if (col < size - 1) result.push(index + 1);
  return result;
}

/** Returns a new board with the tap applied. Each affected tile advances to the next color. */
export function applyTap(board: Board, index: number): Board {
  if (!isValidIndex(board, index)) {
    throw new RangeError(`Invalid tile index ${index} for ${board.size}x${board.size} board`);
  }
  const cells = board.cells.slice();
  for (const cell of affectedCells(board.size, index)) {
    cells[cell] = (cells[cell] + 1) % board.colors;
  }
  return { size: board.size, colors: board.colors, cells };
}

export function applyTaps(board: Board, taps: readonly number[]): Board {
  return taps.reduce<Board>((current, tap) => applyTap(current, tap), board);
}

export function isSolved(board: Board): boolean {
  const first = board.cells[0];
  return board.cells.every((cell) => cell === first);
}

export function hashBoard(board: Board): string {
  return `${board.size}x${board.colors}:${board.cells.join('')}`;
}

/** Fraction of tiles matching the most common color, used for the progress indicator. */
export function uniformity(board: Board): number {
  const counts = new Array<number>(board.colors).fill(0);
  for (const cell of board.cells) counts[cell] += 1;
  return Math.max(...counts) / board.cells.length;
}
