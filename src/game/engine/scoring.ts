import type { LevelDef } from '../types';

export type StarCount = 0 | 1 | 2 | 3;

export function starsForMoves(level: Pick<LevelDef, 'stars'>, movesUsed: number): StarCount {
  if (movesUsed <= level.stars.three) return 3;
  if (movesUsed <= level.stars.two) return 2;
  return 1;
}
