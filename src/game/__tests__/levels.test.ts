import { applyTaps, hashBoard, isSolved, minimumMoves } from '../engine';
import { levelConfig } from '../generator';
import { getDailyLevel, getLevel, toDateKey, TOTAL_LEVELS } from '../levels';
import type { LevelDef } from '../types';

function expectPlayable(level: LevelDef) {
  expect(isSolved(level.board)).toBe(false);
  // The stored solution from the scramble solves the board.
  expect(isSolved(applyTaps(level.board, level.solution))).toBe(true);
  // The independent solver agrees on the optimum, which fits within the move limit.
  expect(minimumMoves(level.board)).toBe(level.par);
  expect(level.par).toBeGreaterThan(0);
  expect(level.par).toBeLessThanOrEqual(level.moveLimit);
  expect(level.stars.three).toBe(level.par);
  expect(level.stars.two).toBeGreaterThanOrEqual(level.stars.three);
  expect(level.stars.two).toBeLessThanOrEqual(level.moveLimit);
}

describe('level generation', () => {
  const levels = Array.from({ length: TOTAL_LEVELS }, (_, i) => getLevel(i + 1));

  it('generates every level as a solvable puzzle within its move limit', () => {
    levels.forEach(expectPlayable);
  });

  it('never repeats a board', () => {
    const hashes = new Set(levels.map((level) => hashBoard(level.board)));
    expect(hashes.size).toBe(levels.length);
  });

  it('follows the size and color progression', () => {
    for (const level of levels) {
      const config = levelConfig(level.number);
      expect(level.board.size).toBe(config.size);
      expect(level.board.colors).toBe(config.colors);
      expect(level.par).toBeGreaterThanOrEqual(config.minPar);
      expect(level.par).toBeLessThanOrEqual(config.maxPar);
    }
    expect(levels.slice(0, 10).every((l) => l.board.size === 3 && l.board.colors === 2)).toBe(true);
    expect(levels.slice(10, 25).every((l) => l.board.size === 4)).toBe(true);
    expect(levels.slice(25, 50).every((l) => l.board.size === 5)).toBe(true);
    expect(levels.slice(50, 100).every((l) => l.board.size === 6)).toBe(true);
  });

  it('is deterministic', () => {
    expect(getLevel(37)).toBe(levels[36]);
    expect(levels[0].par).toBe(1);
    expect(levels[1].par).toBe(2);
  });

  it('generates solvable daily challenges', () => {
    const start = new Date(2026, 0, 1);
    for (let day = 0; day < 30; day += 1) {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + day);
      const level = getDailyLevel(toDateKey(date));
      expectPlayable(level);
      expect(level.id).toBe(`daily-${toDateKey(date)}`);
    }
  });
});
