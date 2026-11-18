import type { MascotId, Peg } from './types';

const LENGTH = 4;

/**
 * Scores a guess without pointing at a column.
 * Exact matches are taken first. Each remaining secret mascot can match only once.
 * Pegs are ordered exact, then misplaced, then empty.
 */
export function scoreGuess(secret: MascotId[], guess: MascotId[]): Peg[] {
  const used = Array<boolean>(LENGTH).fill(false);
  const exactAt = Array<boolean>(LENGTH).fill(false);
  let exact = 0;

  for (let index = 0; index < LENGTH; index += 1) {
    if (guess[index] !== secret[index]) continue;
    used[index] = true;
    exactAt[index] = true;
    exact += 1;
  }

  let misplaced = 0;
  for (let index = 0; index < LENGTH; index += 1) {
    if (exactAt[index]) continue;
    for (let secretIndex = 0; secretIndex < LENGTH; secretIndex += 1) {
      if (used[secretIndex] || secret[secretIndex] !== guess[index]) continue;
      used[secretIndex] = true;
      misplaced += 1;
      break;
    }
  }

  const pegs: Peg[] = [];
  for (let count = 0; count < exact; count += 1) pegs.push('exact');
  for (let count = 0; count < misplaced; count += 1) pegs.push('misplaced');
  while (pegs.length < LENGTH) pegs.push('empty');
  return pegs;
}

export function isWinningScore(pegs: Peg[]): boolean {
  return pegs.every((peg) => peg === 'exact');
}

export function isLosingBoard(guessCount: number, maxAttempts: number, won: boolean): boolean {
  return !won && guessCount >= maxAttempts;
}

export function canSubmit(draft: (MascotId | null)[]): boolean {
  return draft.length === LENGTH && draft.every((slot) => slot !== null);
}

/**
 * Slot a hint should fill. The selected slot wins when it is empty or wrong.
 * Otherwise the first incorrect slot from the left. Null when the draft already matches.
 */
export function hintSlot(secret: MascotId[], draft: (MascotId | null)[], selected: number | null): number | null {
  const incorrect = (index: number) => index >= 0 && index < LENGTH && draft[index] !== secret[index];
  if (selected !== null && incorrect(selected)) return selected;
  for (let index = 0; index < LENGTH; index += 1) {
    if (incorrect(index)) return index;
  }
  return null;
}
