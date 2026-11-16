import {
  affectedCells,
  applyTap,
  applyTaps,
  createBoard,
  findHint,
  hashBoard,
  isSolved,
  minimumMoves,
  solve,
  starsForMoves,
} from '../engine';
import { createRandom, randomInt } from '../generator';
import type { Board, ColorCount, GridSize } from '../types';

describe('tap rule', () => {
  it('flips the tapped tile and its orthogonal neighbours only', () => {
    const board = applyTap(createBoard(3, 2), 4);
    expect(board.cells).toEqual([0, 1, 0, 1, 1, 1, 0, 1, 0]);
  });

  it('handles corners and edges without wrapping', () => {
    expect(applyTap(createBoard(3, 2), 0).cells).toEqual([1, 1, 0, 1, 0, 0, 0, 0, 0]);
    expect(applyTap(createBoard(4, 2), 7).cells).toEqual([
      0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0,
    ]);
    expect(affectedCells(4, 3).sort()).toEqual([2, 3, 7]);
  });

  it('cycles through colors and wraps around', () => {
    let board = createBoard(3, 3);
    board = applyTap(board, 0);
    expect(board.cells[0]).toBe(1);
    board = applyTap(board, 0);
    expect(board.cells[0]).toBe(2);
    board = applyTap(board, 0);
    expect(board.cells[0]).toBe(0);
  });

  it('does not mutate the input board', () => {
    const board = createBoard(3, 2);
    applyTap(board, 4);
    expect(board.cells.every((c) => c === 0)).toBe(true);
  });

  it('rejects invalid indices', () => {
    expect(() => applyTap(createBoard(3, 2), 9)).toThrow(RangeError);
    expect(() => applyTap(createBoard(3, 2), -1)).toThrow(RangeError);
  });

  it('recognises solved boards of any color', () => {
    expect(isSolved(createBoard(4, 2, 1))).toBe(true);
    expect(isSolved(applyTap(createBoard(4, 2), 5))).toBe(false);
  });

  it('hashes boards by size, colors and cells', () => {
    expect(hashBoard(createBoard(3, 2))).not.toBe(hashBoard(createBoard(3, 3)));
  });
});

describe('solver', () => {
  const sizes: GridSize[] = [3, 4, 5, 6];
  const colorCounts: ColorCount[] = [2, 3];

  for (const size of sizes) {
    for (const colors of colorCounts) {
      it(`solves random ${size}x${size} boards with ${colors} colors`, () => {
        const random = createRandom(size * 31 + colors);
        for (let run = 0; run < 15; run += 1) {
          let board: Board = createBoard(size, colors, randomInt(random, 0, colors - 1));
          const scrambleLength = randomInt(random, 1, size * 2);
          const scramble: number[] = [];
          for (let i = 0; i < scrambleLength; i += 1) {
            const tap = randomInt(random, 0, size * size - 1);
            scramble.push(tap);
            board = applyTap(board, tap);
          }
          const result = solve(board);
          expect(result).not.toBeNull();
          expect(isSolved(applyTaps(board, result!.taps))).toBe(true);
          // The optimum can never be longer than undoing the scramble.
          expect(result!.taps.length).toBeLessThanOrEqual(scrambleLength * (colors - 1));
        }
      });
    }
  }

  it('returns zero moves for a solved board', () => {
    expect(minimumMoves(createBoard(5, 2))).toBe(0);
    expect(findHint(createBoard(5, 2))).toBeNull();
  });

  it('finds the single-tap optimum', () => {
    const board = applyTap(createBoard(5, 2), 12);
    expect(solve(board)!.taps).toEqual([12]);
    expect(findHint(board)).toBe(12);
  });

  it('reports unsolvable 4x4 positions', () => {
    // A single isolated tile is not reachable on 4x4 two-color Lights Out.
    const board = createBoard(4, 2);
    board.cells[0] = 1;
    expect(solve(board)).toBeNull();
  });

  it('hints always lead toward the solution', () => {
    let board = applyTaps(createBoard(5, 2), [0, 7, 13, 21, 24]);
    let remaining = minimumMoves(board);
    while (remaining > 0) {
      const hint = findHint(board);
      expect(hint).not.toBeNull();
      board = applyTap(board, hint!);
      const next = minimumMoves(board);
      expect(next).toBe(remaining - 1);
      remaining = next;
    }
    expect(isSolved(board)).toBe(true);
  });
});

describe('scoring', () => {
  const level = { stars: { three: 4, two: 5 } };
  it('awards stars by moves used', () => {
    expect(starsForMoves(level, 4)).toBe(3);
    expect(starsForMoves(level, 5)).toBe(2);
    expect(starsForMoves(level, 7)).toBe(1);
  });
});
