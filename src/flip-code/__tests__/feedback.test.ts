import { canSaveDailyStreak, flipCodeDateKey, getDailyCode, nextDailyStreak, shiftDateKey } from '../daily';
import { canSubmit, hintSlot, isLosingBoard, isWinningScore, scoreGuess } from '../feedback';
import { ATTEMPT_LIMIT, createCode, starsForAttempts } from '../generate';
import type { MascotId } from '../types';

const code = (...ids: number[]) => ids as MascotId[];

function countMascots(secret: MascotId[]): number[] {
  const counts = [0, 0, 0, 0];
  secret.forEach((id) => {
    counts[id] += 1;
  });
  return counts;
}

describe('FLIP CODE feedback', () => {
  it('marks a perfect guess as four exact pegs', () => {
    const secret = code(0, 1, 2, 3);
    expect(scoreGuess(secret, secret)).toEqual(['exact', 'exact', 'exact', 'exact']);
    expect(isWinningScore(scoreGuess(secret, secret))).toBe(true);
  });

  it('marks the right mascots in the wrong places', () => {
    expect(scoreGuess(code(0, 1, 2, 3), code(1, 2, 3, 0))).toEqual([
      'misplaced',
      'misplaced',
      'misplaced',
      'misplaced',
    ]);
  });

  it('does not reuse a secret mascot for a second duplicate', () => {
    expect(scoreGuess(code(0, 0, 1, 2), code(0, 1, 0, 3))).toEqual([
      'exact',
      'misplaced',
      'misplaced',
      'empty',
    ]);
    expect(scoreGuess(code(0, 1, 2, 3), code(0, 0, 0, 0))).toEqual(['exact', 'empty', 'empty', 'empty']);
    expect(scoreGuess(code(0, 0, 0, 1), code(1, 1, 1, 1))).toEqual(['exact', 'empty', 'empty', 'empty']);
  });

  it('counts every duplicate that still exists in the secret', () => {
    expect(scoreGuess(code(0, 0, 0, 1), code(1, 0, 0, 0))).toEqual([
      'exact',
      'exact',
      'misplaced',
      'misplaced',
    ]);
  });

  it('scores a completely wrong guess as empty', () => {
    expect(scoreGuess(code(0, 0, 0, 0), code(1, 1, 1, 1))).toEqual(['empty', 'empty', 'empty', 'empty']);
    expect(isWinningScore(scoreGuess(code(0, 0, 0, 0), code(1, 1, 1, 1)))).toBe(false);
  });

  it('loses only after the attempt limit without a win', () => {
    expect(isLosingBoard(9, 10, false)).toBe(false);
    expect(isLosingBoard(10, 10, false)).toBe(true);
    expect(isLosingBoard(10, 10, true)).toBe(false);
    expect(canSubmit([0, 1, 2, null])).toBe(false);
    expect(canSubmit([0, 1, 2, 3])).toBe(true);
  });

  it('uses shorter limits for harder games and the same code for a seed', () => {
    expect(ATTEMPT_LIMIT).toEqual({ easy: 10, medium: 8, hard: 7 });
    expect(createCode(42, 'easy')).toEqual(createCode(42, 'easy'));
    expect(createCode(42, 'hard')).toHaveLength(4);
    expect(starsForAttempts(4)).toBe(3);
    expect(starsForAttempts(6)).toBe(2);
    expect(starsForAttempts(7)).toBe(1);
  });

  it('keeps easy codes unique and repeats mascots on medium and hard', () => {
    const hardShapes = new Set<string>();
    for (let seed = 1; seed <= 60; seed += 1) {
      const easy = createCode(seed, 'easy');
      expect(new Set(easy).size).toBe(4);

      const medium = createCode(seed, 'medium');
      const mediumCounts = countMascots(medium);
      expect(mediumCounts.filter((count) => count > 0).sort((a, b) => b - a)).toEqual([2, 1, 1]);

      const hard = createCode(seed, 'hard');
      const hardCounts = countMascots(hard).filter((count) => count > 0);
      expect(Math.max(...hardCounts)).toBeGreaterThan(1);
      hardShapes.add(hardCounts.sort((a, b) => b - a).join(','));
    }
    expect(hardShapes).toEqual(new Set(['2,2', '3,1', '4']));
  });

  it('fills the selected slot unless that mascot is already correct', () => {
    const secret = code(0, 1, 2, 3);
    expect(hintSlot(secret, [null, null, null, null], 2)).toBe(2);
    expect(hintSlot(secret, [0, 3, null, null], 1)).toBe(1);
    expect(hintSlot(secret, [0, 3, null, null], 0)).toBe(1);
    expect(hintSlot(secret, [null, 1, null, null], null)).toBe(0);
    expect(hintSlot(secret, [0, 1, 2, 3], 0)).toBeNull();
  });

  it('keeps the daily combination stable for one date', () => {
    const day = new Date(2026, 10, 17);
    const next = new Date(2026, 10, 18);
    expect(flipCodeDateKey(day)).toBe('20261117');
    expect(getDailyCode(day)).toEqual(getDailyCode(day));
    expect(getDailyCode(day)).toEqual(createCode(20261117, 'medium'));
    expect(getDailyCode(next)).toEqual(createCode(20261118, 'medium'));
  });

  it('saves a daily streak only across one missed day', () => {
    const today = '20261120';
    const yesterday = shiftDateKey(today, -1);
    const missed = shiftDateKey(today, -2);
    expect(canSaveDailyStreak(missed, null, 4, today)).toBe(true);
    expect(canSaveDailyStreak(yesterday, null, 4, today)).toBe(false);
    expect(canSaveDailyStreak(missed, null, 0, today)).toBe(false);
    expect(canSaveDailyStreak(shiftDateKey(today, -3), null, 4, today)).toBe(false);
    expect(nextDailyStreak(yesterday, null, 4, today)).toBe(5);
    expect(nextDailyStreak(missed, yesterday, 4, today)).toBe(5);
    expect(nextDailyStreak(missed, null, 4, today)).toBe(1);
  });
});
