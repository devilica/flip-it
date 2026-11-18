import { solveLevel } from './solver';
import type { SudokuLevel } from './types';

function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function permutation(size: number, next: () => number): number[] {
  const values = Array.from({ length: size }, (_, index) => index);
  for (let index = size - 1; index > 0; index -= 1) {
    const swap = Math.floor(next() * (index + 1));
    [values[index], values[swap]] = [values[swap], values[index]];
  }
  return values;
}

function orthogonal(size: number, index: number): number[] {
  const row = Math.floor(index / size);
  const col = index % size;
  const neighbors: number[] = [];
  if (row > 0) neighbors.push(index - size);
  if (row < size - 1) neighbors.push(index + size);
  if (col > 0) neighbors.push(index - 1);
  if (col < size - 1) neighbors.push(index + 1);
  return neighbors;
}

function growRegions(size: number, columns: number[], next: () => number, frozen: number): number[] {
  const regions = Array.from({ length: size * size }, () => -1);
  const seeds = columns.map((col, row) => row * size + col);
  seeds.forEach((cell, region) => {
    regions[cell] = region;
  });

  const pending = regions.flatMap((region, index) => (region === -1 ? [index] : []));
  let progressed = true;
  while (pending.length > 0 && progressed) {
    progressed = false;
    for (let look = 0; look < pending.length; look += 1) {
      const index = pending[look];
      const options = orthogonal(size, index).filter((neighbor) => {
        const region = regions[neighbor];
        return region !== -1 && region !== frozen;
      });
      if (options.length === 0) continue;
      pending.splice(look, 1);
      const neighbor = options[Math.floor(next() * options.length)];
      regions[index] = regions[neighbor];
      progressed = true;
      break;
    }
  }
  return regions;
}

function unique(level: SudokuLevel): number[] | null {
  const found = solveLevel(level, 2);
  return found.length === 1 ? found[0] : null;
}

function singletonRegion(regions: number[]): number | null {
  const counts = new Map<number, number>();
  for (const region of regions) counts.set(region, (counts.get(region) ?? 0) + 1);
  const singles = [...counts.entries()].filter(([, count]) => count === 1);
  return singles.length === 1 ? singles[0][0] : null;
}

/** One valid puzzle for this size and seed, or null when the layout is not unique. */
export function createSudokuLevel(size: number, seed: number, blocks: number): SudokuLevel | null {
  const next = random(seed);
  const columns = permutation(size, next);
  const frozen = Math.floor(next() * size);
  const regions = growRegions(size, columns, next, frozen);
  if (regions.some((region) => region < 0)) return null;
  if (singletonRegion(regions) === null) return null;

  const level: SudokuLevel = {
    id: 0,
    size,
    regions,
    given: [],
    blocked: [],
    magnifier: 0,
    lightbulb: 0,
    eraser: 0,
  };

  let guard = 0;
  while (!unique(level) && guard < size * size) {
    guard += 1;
    const found = solveLevel(level, 2);
    if (found.length < 2) return null;
    const kept = new Set(found[0]);
    const extra = found[1].filter((cell) => !kept.has(cell));
    if (extra.length === 0) return null;
    level.blocked = [...level.blocked, extra[Math.floor(next() * extra.length)]];
  }
  if (!unique(level)) return null;

  const solved = new Set(unique(level) ?? []);
  const open = regions.flatMap((_, index) => (solved.has(index) || level.blocked.includes(index) ? [] : [index]));
  while (level.blocked.length < blocks && open.length > 0) {
    const pick = Math.floor(next() * open.length);
    const [cell] = open.splice(pick, 1);
    const blocked = [...level.blocked, cell];
    if (unique({ ...level, blocked })) level.blocked = blocked;
  }
  return level;
}
