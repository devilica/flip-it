/** One cell mark the player can change. Locked mascots are not stored here. */
export type PlayerMark = 'empty' | 'mascot' | 'x' | 'wrong';

export interface SudokuLevel {
  id: number;
  size: number;
  /** Region id for every cell, row by row. Ids run from 0 to size - 1. */
  regions: number[];
  /** Cell indexes that start with a locked mascot. */
  given: number[];
  /** Cell indexes that cannot hold a mascot. */
  blocked: number[];
  magnifier: number;
  lightbulb: number;
  eraser: number;
}

export interface SudokuSession {
  levelNumber: number;
  marks: PlayerMark[];
  magnifier: number;
  lightbulb: number;
  eraser: number;
  lightbulbsUsed: number;
  /** Cell the eraser will clear. */
  selected: number | null;
  /** Cell the magnifier is pointing at. */
  hint: number | null;
  /** True when this board is today's daily puzzle. */
  daily: boolean;
  /** Wrong guesses remaining. A level starts with 3. */
  lives: number;
  /** Turn or mirror of the stored level. 0 is the original board. */
  orientation: number;
}
