import type { ColorCount, Difficulty, GridSize } from '../types';

export interface LevelConfig {
  size: GridSize;
  colors: ColorCount;
  /** Inclusive range for the optimal (minimum) solution length. */
  minPar: number;
  maxPar: number;
}

const lerp = (from: number, to: number, t: number) => Math.round(from + (to - from) * t);
const progress = (n: number, first: number, last: number) =>
  Math.min(1, Math.max(0, (n - first) / (last - first)));

/** Difficulty curve: board size sets the stage, solution length sets the challenge. */
export function levelConfig(levelNumber: number): LevelConfig {
  const n = Math.max(1, Math.floor(levelNumber));

  if (n <= 10) {
    if (n <= 2) return { size: 3, colors: 2, minPar: n, maxPar: n };
    if (n <= 5) return { size: 3, colors: 2, minPar: 2, maxPar: 3 };
    return { size: 3, colors: 2, minPar: 3, maxPar: 5 };
  }

  if (n <= 25) {
    const t = progress(n, 11, 25);
    return { size: 4, colors: 2, minPar: lerp(3, 6, t), maxPar: lerp(5, 8, t) };
  }

  if (n <= 50) {
    const t = progress(n, 26, 50);
    if (n >= 41 && n % 2 === 1) {
      return { size: 5, colors: 3, minPar: lerp(4, 6, t), maxPar: lerp(6, 9, t) };
    }
    return { size: 5, colors: 2, minPar: lerp(5, 9, t), maxPar: lerp(7, 12, t) };
  }

  if (n <= 100) {
    const t = progress(n, 51, 100);
    if (n % 3 === 0) {
      return { size: 6, colors: 3, minPar: lerp(6, 10, t), maxPar: lerp(8, 13, t) };
    }
    return { size: 6, colors: 2, minPar: lerp(8, 13, t), maxPar: lerp(10, 16, t) };
  }

  const t = progress(n, 101, 300);
  if (n % 2 === 0) {
    return { size: 6, colors: 3, minPar: lerp(10, 15, t), maxPar: lerp(13, 19, t) };
  }
  return { size: 6, colors: 2, minPar: lerp(13, 19, t), maxPar: lerp(16, 24, t) };
}

export function dailyConfig(dateKey: string): LevelConfig {
  const day = Number(dateKey.slice(-2)) || 1;
  if (day % 2 === 1) return { size: 5, colors: 3, minPar: 6, maxPar: 9 };
  return { size: 5, colors: 2, minPar: 8, maxPar: 11 };
}

export function difficultyFor(par: number, colors: ColorCount): Difficulty {
  const score = par * (colors === 3 ? 1.5 : 1);
  if (score < 4) return 'easy';
  if (score < 7) return 'medium';
  if (score < 11) return 'hard';
  if (score < 15) return 'expert';
  return 'master';
}
