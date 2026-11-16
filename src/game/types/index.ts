/** Number of tile colors on a board. Must be prime so the solver can work in Z_k. */
export type ColorCount = 2 | 3;

export type GridSize = 3 | 4 | 5 | 6;

export interface Board {
  size: GridSize;
  colors: ColorCount;
  /** Row-major color indices in the range [0, colors). */
  cells: number[];
}

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'master';

export interface StarThresholds {
  /** Max moves for three stars. */
  three: number;
  /** Max moves for two stars. Any solve within the move limit earns one star. */
  two: number;
}

export interface LevelDef {
  /** Stable identifier, e.g. "level-12" or "daily-20261116". */
  id: string;
  /** 1-based level number. Daily challenges use 0. */
  number: number;
  board: Board;
  /** A known tap sequence that solves the board (from the scramble). */
  solution: number[];
  /** Minimum number of moves required, computed by the solver. */
  par: number;
  moveLimit: number;
  stars: StarThresholds;
  difficulty: Difficulty;
}

export interface SolveResult {
  /** Tap indices in any order; a cell may appear multiple times with 3 colors. */
  taps: number[];
  /** The uniform color the board ends up with. */
  targetColor: number;
}
