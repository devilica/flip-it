export type MascotId = 0 | 1 | 2 | 3;

export type Difficulty = 'easy' | 'medium' | 'hard';

/** Exact is purple, misplaced is white, empty is unused. Order is not tied to a column. */
export type Peg = 'exact' | 'misplaced' | 'empty';

export interface FlipCodeSession {
  difficulty: Difficulty;
  daily: boolean;
  dateKey: string | null;
  secret: MascotId[];
  guesses: MascotId[][];
  draft: (MascotId | null)[];
  seed: number;
  /** Free or earned hints still available for this code. */
  hintsLeft: number;
  /** One rewarded extra attempt has been added after the last miss. */
  extraAttempt?: boolean;
  /** The player skipped the extra-attempt ad, so the loss is final. */
  extraDeclined?: boolean;
}
