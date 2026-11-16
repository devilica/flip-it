import type { Board, SolveResult } from '../types';
import { affectedCells } from './board';

/** Above this many free variables the null-space enumeration is skipped (never reached for grids up to 6x6). */
const MAX_FREE_VARIABLES = 12;

const mod = (value: number, k: number) => ((value % k) + k) % k;

function inverse(value: number, k: number): number {
  for (let candidate = 1; candidate < k; candidate += 1) {
    if ((value * candidate) % k === 1) return candidate;
  }
  throw new Error(`${value} has no inverse modulo ${k}`);
}

interface Reduced {
  /** Reduced row-echelon augmented matrix (n columns + 1 RHS). */
  rows: number[][];
  pivotCols: number[];
  freeCols: number[];
  consistent: boolean;
}

function reduce(size: number, k: number, rhs: number[]): Reduced {
  const n = size * size;
  // Column j is the effect of tapping cell j; the matrix is symmetric.
  const rows: number[][] = [];
  for (let r = 0; r < n; r += 1) {
    const row = new Array<number>(n + 1).fill(0);
    for (const c of affectedCells(size, r)) row[c] = 1;
    row[n] = mod(rhs[r], k);
    rows.push(row);
  }

  const pivotCols: number[] = [];
  let pivotRow = 0;
  for (let col = 0; col < n && pivotRow < n; col += 1) {
    let found = -1;
    for (let r = pivotRow; r < n; r += 1) {
      if (rows[r][col] !== 0) {
        found = r;
        break;
      }
    }
    if (found === -1) continue;
    [rows[pivotRow], rows[found]] = [rows[found], rows[pivotRow]];
    const inv = inverse(rows[pivotRow][col], k);
    for (let c = col; c <= n; c += 1) rows[pivotRow][c] = (rows[pivotRow][c] * inv) % k;
    for (let r = 0; r < n; r += 1) {
      if (r === pivotRow || rows[r][col] === 0) continue;
      const factor = rows[r][col];
      for (let c = col; c <= n; c += 1) {
        rows[r][c] = mod(rows[r][c] - factor * rows[pivotRow][c], k);
      }
    }
    pivotCols.push(col);
    pivotRow += 1;
  }

  let consistent = true;
  for (let r = pivotRow; r < n; r += 1) {
    if (rows[r][n] !== 0) consistent = false;
  }
  const pivotSet = new Set(pivotCols);
  const freeCols: number[] = [];
  for (let c = 0; c < n; c += 1) if (!pivotSet.has(c)) freeCols.push(c);
  return { rows, pivotCols, freeCols, consistent };
}

/**
 * Finds the tap counts (per cell, in [0, k)) with the fewest total taps that turn
 * the board into a single uniform color. Returns null if no uniform color is reachable.
 */
export function solve(board: Board): SolveResult | null {
  const { size, colors: k, cells } = board;
  const n = size * size;
  let best: { counts: number[]; cost: number; target: number } | null = null;

  for (let target = 0; target < k; target += 1) {
    const rhs = cells.map((cell) => target - cell);
    const { rows, pivotCols, freeCols, consistent } = reduce(size, k, rhs);
    if (!consistent) continue;

    const freeCount = Math.min(freeCols.length, MAX_FREE_VARIABLES);
    const combos = k ** freeCount;
    for (let combo = 0; combo < combos; combo += 1) {
      const counts = new Array<number>(n).fill(0);
      let rest = combo;
      for (let f = 0; f < freeCount; f += 1) {
        counts[freeCols[f]] = rest % k;
        rest = Math.floor(rest / k);
      }
      pivotCols.forEach((col, r) => {
        let value = rows[r][n];
        for (const free of freeCols) value -= rows[r][free] * counts[free];
        counts[col] = mod(value, k);
      });
      const cost = counts.reduce((sum, c) => sum + c, 0);
      if (!best || cost < best.cost) best = { counts, cost, target };
    }
  }

  if (!best) return null;
  const taps: number[] = [];
  best.counts.forEach((count, index) => {
    for (let i = 0; i < count; i += 1) taps.push(index);
  });
  return { taps, targetColor: best.target };
}

/** Minimum number of moves to solve the board, or Infinity if it is unsolvable. */
export function minimumMoves(board: Board): number {
  const result = solve(board);
  return result ? result.taps.length : Number.POSITIVE_INFINITY;
}

/** A single tap that is part of an optimal solution from the current position. */
export function findHint(board: Board): number | null {
  const result = solve(board);
  if (!result || result.taps.length === 0) return null;
  // Prefer the tap closest to the board center so hints feel deliberate.
  const center = (board.size - 1) / 2;
  const distance = (i: number) =>
    Math.abs(Math.floor(i / board.size) - center) + Math.abs((i % board.size) - center);
  return [...new Set(result.taps)].sort((a, b) => distance(a) - distance(b) || a - b)[0];
}
