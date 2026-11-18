import type { Difficulty, MascotId } from './types';

export const CODE_LENGTH = 4;

export const ATTEMPT_LIMIT: Record<Difficulty, number> = {
  easy: 10,
  medium: 8,
  hard: 7,
};

const MASCOTS: MascotId[] = [0, 1, 2, 3];

/** 3 stars within 4 attempts, 2 within 6, otherwise 1. */
export function starsForAttempts(attempts: number): number {
  if (attempts <= 4) return 3;
  if (attempts <= 6) return 2;
  return 1;
}

/** Upper bits of the generator. The lowest bits cycle through 0–3 and cannot repeat. */
function randomBits(seed: number): () => number {
  let state = seed >>> 0;
  if (state === 0) state = 1;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state >>> 16;
  };
}

function shuffle<T>(items: readonly T[], next: () => number): T[] {
  const copy = items.slice();
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = next() % (index + 1);
    const current = copy[index];
    copy[index] = copy[swap];
    copy[swap] = current;
  }
  return copy;
}

/**
 * Four mascot ids. The same seed and difficulty always return the same code.
 * Easy is four different mascots. Medium repeats one. Hard repeats more heavily.
 */
export function createCode(seed: number, difficulty: Difficulty): MascotId[] {
  const next = randomBits(seed);
  const order = shuffle(MASCOTS, next);
  if (difficulty === 'easy') return order;

  if (difficulty === 'medium') {
    return shuffle([order[0], order[0], order[1], order[2]], next);
  }

  const pattern = next() % 3;
  if (pattern === 0) return shuffle([order[0], order[0], order[1], order[1]], next);
  if (pattern === 1) return shuffle([order[0], order[0], order[0], order[1]], next);
  return [order[0], order[0], order[0], order[0]];
}
