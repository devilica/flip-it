import { applyTaps, minimumMoves } from '@/game/engine';
import { getLevel } from '@/game/levels';
import { BONUS_MOVES, HINTS_PER_LEVEL, TAP_LOCK_MS, useGameStore } from '../gameStore';

const store = () => useGameStore.getState();
/** Taps with a timestamp far enough apart that the animation lock never interferes. */
let clock = 1_000_000;
const tap = (index: number) => {
  clock += TAP_LOCK_MS + 1;
  return store().tap(index, clock);
};

/** A tap that is not part of the optimal solution, used to burn moves. */
function wastefulTap(): number {
  const level = store().level!;
  const n = level.board.size * level.board.size;
  for (let i = 0; i < n; i += 1) {
    if (!level.solution.includes(i)) return i;
  }
  return 0;
}

describe('game store', () => {
  const level = getLevel(6);

  beforeEach(() => store().start(level, 'level'));

  it('starts a level in the playing state', () => {
    expect(store().status).toBe('playing');
    expect(store().board!.cells).toEqual(level.board.cells);
    expect(store().history).toHaveLength(0);
    expect(store().hintsLeft).toBe(HINTS_PER_LEVEL);
  });

  it('gives short puzzles 3 hints and longer puzzles two fewer than the solution', () => {
    store().start(getLevel(1), 'level');
    expect(store().level!.par).toBeLessThanOrEqual(5);
    expect(store().hintsLeft).toBe(HINTS_PER_LEVEL);

    const long = getLevel(51);
    store().start(long, 'level');
    expect(long.par).toBeGreaterThan(5);
    expect(store().hintsLeft).toBe(long.par - 2);
  });

  it('counts only accepted taps', () => {
    expect(tap(0)).toBe(true);
    expect(store().history).toEqual([0]);
    // A second tap inside the animation window is ignored.
    expect(store().tap(1, clock + 10)).toBe(false);
    expect(store().history).toEqual([0]);
    // Out-of-range taps are ignored.
    expect(tap(99)).toBe(false);
    expect(store().history).toEqual([0]);
  });

  it('undoes the last move exactly', () => {
    tap(0);
    tap(4);
    expect(store().undo()).toBe(true);
    expect(store().board!.cells).toEqual(applyTaps(level.board, [0]).cells);
    store().undo();
    expect(store().board!.cells).toEqual(level.board.cells);
    expect(store().undo()).toBe(false);
  });

  it('undoes moves on three-color boards', () => {
    const threeColor = getLevel(41);
    expect(threeColor.board.colors).toBe(3);
    store().start(threeColor, 'level');
    tap(7);
    store().undo();
    expect(store().board!.cells).toEqual(threeColor.board.cells);
  });

  it('restarts to the original board', () => {
    tap(0);
    tap(1);
    store().restart();
    expect(store().board!.cells).toEqual(level.board.cells);
    expect(store().history).toHaveLength(0);
    expect(store().status).toBe('playing');
  });

  it('wins with three stars when solved optimally', () => {
    for (const index of [...level.solution]) tap(index);
    expect(store().status).toBe('won');
    expect(store().history.length).toBeGreaterThanOrEqual(level.par);
    expect(store().earnedStars).toBeGreaterThanOrEqual(1);
    // Further taps are ignored after winning.
    expect(tap(0)).toBe(false);
  });

  it('follows hints to an optimal win', () => {
    let guard = 0;
    while (store().status === 'playing' && guard < 20) {
      useGameStore.setState({ hintsLeft: HINTS_PER_LEVEL });
      const hint = store().requestHint();
      expect(hint).not.toBeNull();
      tap(hint!);
      guard += 1;
    }
    expect(store().status).toBe('won');
    expect(store().history).toHaveLength(level.par);
    expect(store().earnedStars).toBe(3);
  });

  it('limits hints per level and reuses an active hint', () => {
    const first = store().requestHint();
    expect(store().requestHint()).toBe(first);
    expect(store().hintsLeft).toBe(HINTS_PER_LEVEL - 1);
    useGameStore.setState({ hintsLeft: 0, hintCell: null });
    expect(store().requestHint()).toBeNull();

    expect(store().grantHints()).toBe(true);
    expect(store().hintsLeft).toBe(HINTS_PER_LEVEL);
    expect(store().requestHint()).not.toBeNull();
  });

  it('does not grant hints unless the level is being played', () => {
    useGameStore.setState({ status: 'failed', hintsLeft: 0 });
    expect(store().grantHints()).toBe(false);
    expect(store().hintsLeft).toBe(0);
  });

  it('fails when moves run out and grants bonus moves once', () => {
    const waste = wastefulTap();
    while (store().status === 'playing') tap(waste);
    expect(store().status).toBe('failed');
    expect(store().history).toHaveLength(level.moveLimit);
    expect(tap(waste)).toBe(false);

    expect(store().grantBonusMoves()).toBe(true);
    expect(store().status).toBe('playing');
    expect(store().bonusMoves).toBe(BONUS_MOVES);
    while (store().status === 'playing') tap(waste);
    expect(store().grantBonusMoves()).toBe(false);
  });

  it('pauses and resumes, ignoring taps while paused', () => {
    store().pause();
    expect(tap(0)).toBe(false);
    store().resume();
    expect(tap(0)).toBe(true);
  });

  it('resumes a saved session', () => {
    store().start(level, 'level', { history: [0, 4], hintsLeft: 1, bonusMoves: 0 });
    expect(store().history).toEqual([0, 4]);
    expect(store().board!.cells).toEqual(applyTaps(level.board, [0, 4]).cells);
    expect(store().hintsLeft).toBe(1);
    expect(minimumMoves(store().board!)).toBeLessThan(Infinity);
  });
});
