import { cellIndex, colOf, rowOf } from './rules';
import type { SudokuLevel } from './types';

export const ORIENTATION_COUNT = 8;

type MapPoint = (size: number, row: number, col: number) => [number, number];

/** Identity, three turns, then four mirrors. Each one keeps rows, columns, and colors legal. */
const maps: MapPoint[] = [
  (_size, row, col) => [row, col],
  (size, row, col) => [col, size - 1 - row],
  (size, row, col) => [size - 1 - row, size - 1 - col],
  (size, row, col) => [size - 1 - col, row],
  (size, row, col) => [row, size - 1 - col],
  (size, row, col) => [size - 1 - row, col],
  (_size, row, col) => [col, row],
  (size, row, col) => [size - 1 - col, size - 1 - row],
];

function mapOf(orientation: number): MapPoint {
  const index = ((orientation % ORIENTATION_COUNT) + ORIENTATION_COUNT) % ORIENTATION_COUNT;
  return maps[index];
}

export function mapCell(size: number, index: number, orientation: number): number {
  const [row, col] = mapOf(orientation)(size, rowOf(size, index), colOf(size, index));
  return cellIndex(size, row, col);
}

export function orientLevel(level: SudokuLevel, orientation: number): SudokuLevel {
  if (mapOf(orientation) === maps[0]) return level;
  const size = level.size;
  const regions = Array.from({ length: size * size }, () => 0);
  for (let index = 0; index < regions.length; index += 1) {
    regions[mapCell(size, index, orientation)] = level.regions[index];
  }
  return {
    ...level,
    regions,
    given: level.given.map((index) => mapCell(size, index, orientation)),
    blocked: level.blocked.map((index) => mapCell(size, index, orientation)),
  };
}

function signature(level: SudokuLevel): string {
  return `${level.regions.join(',')}|${[...level.given].sort((a, b) => a - b).join(',')}|${[...level.blocked].sort((a, b) => a - b).join(',')}`;
}

/** A turn or mirror that does not leave the board looking the same. */
export function differentOrientation(level: SudokuLevel, current: number): number {
  const now = signature(orientLevel(level, current));
  const options: number[] = [];
  for (let kind = 0; kind < ORIENTATION_COUNT; kind += 1) {
    if (kind !== current && signature(orientLevel(level, kind)) !== now) options.push(kind);
  }
  const pool = options.length > 0 ? options : [(current + 1) % ORIENTATION_COUNT];
  return pool[Math.floor(Math.random() * pool.length)];
}
