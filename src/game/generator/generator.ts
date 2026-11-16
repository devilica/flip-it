import { applyTap, createBoard, hashBoard, solve } from '../engine';
import type { Board, LevelDef } from '../types';
import { difficultyFor, type LevelConfig } from './curve';
import { createRandom, hashString, randomInt, shuffle, type Random } from './random';

const STRICT_ATTEMPTS = 400;
const RELAXED_ATTEMPTS = 400;

/** Taps allowed beyond the shortest solution. The same budget applies to every puzzle. */
export const EXTRA_MOVES = 20;

interface Scramble {
  board: Board;
  /** Taps that undo the scramble and restore the uniform board. */
  solution: number[];
}

/**
 * Builds a puzzle backwards from a solved board: tap random cells, then record the
 * inverse taps as the reference solution. Solvability is guaranteed by construction.
 */
function scramble(random: Random, config: LevelConfig): Scramble {
  const { size, colors } = config;
  let board = createBoard(size, colors, randomInt(random, 0, colors - 1));
  const tapTarget = randomInt(random, config.minPar, config.maxPar);
  const cellCount = colors === 2 ? tapTarget : Math.max(1, Math.ceil(tapTarget * 0.75));
  const cells = shuffle(
    random,
    Array.from({ length: size * size }, (_, i) => i),
  ).slice(0, Math.min(cellCount, size * size));

  const solution: number[] = [];
  for (const cell of cells) {
    const taps = colors === 2 ? 1 : randomInt(random, 1, colors - 1);
    for (let i = 0; i < taps; i += 1) board = applyTap(board, cell);
    for (let i = 0; i < colors - taps; i += 1) solution.push(cell);
  }
  return { board, solution };
}

export interface GenerateOptions {
  id: string;
  number: number;
  seed: string;
  config: LevelConfig;
  /** Board hashes that must not be reused. Accepted boards are added to it. */
  usedHashes?: Set<string>;
}

export function generateLevel({ id, number, seed, config, usedHashes }: GenerateOptions): LevelDef {
  const random = createRandom(hashString(seed));

  for (let attempt = 0; attempt < STRICT_ATTEMPTS + RELAXED_ATTEMPTS; attempt += 1) {
    const strict = attempt < STRICT_ATTEMPTS;
    const { board, solution } = scramble(random, config);
    const hash = hashBoard(board);
    if (usedHashes?.has(hash)) continue;

    const optimal = solve(board);
    if (!optimal) continue;
    const par = optimal.taps.length;
    if (par === 0) continue;
    if (strict && (par < config.minPar || par > config.maxPar)) continue;

    usedHashes?.add(hash);
    const moveLimit = par + EXTRA_MOVES;
    return {
      id,
      number,
      board,
      solution,
      par,
      moveLimit,
      stars: { three: par, two: par + EXTRA_MOVES / 2 },
      difficulty: difficultyFor(par, config.colors),
    };
  }

  throw new Error(`Unable to generate a unique puzzle for ${id}`);
}
