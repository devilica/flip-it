import { TOTAL_LEVELS } from '@/game/levels';
import { SUDOKU_LEVEL_COUNT } from '@/sudoku/levels';

export type GameMode = 'flip-it' | 'flip-sudoku' | 'flip-code';

export interface LeaderboardConfig {
  id: string;
  /** Largest score this mode can honestly produce. */
  maxScore: number;
}

/** One entry per game. A new mode is another key and one submit call at its win. */
export const LEADERBOARDS: Record<GameMode, LeaderboardConfig> = {
  'flip-it': { id: 'CgkIoM_MoesMEAIQAQ', maxScore: TOTAL_LEVELS * 3 },
  'flip-sudoku': { id: 'CgkIoM_MoesMEAIQAg', maxScore: SUDOKU_LEVEL_COUNT * 3 },
  'flip-code': { id: 'CgkIoM_MoesMEAIQAw', maxScore: 1_000_000 },
};

export const GAME_MODES = Object.keys(LEADERBOARDS) as GameMode[];
