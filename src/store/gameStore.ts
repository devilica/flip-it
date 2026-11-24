import { create } from 'zustand';

import { applyTap, findHint, isSolved, isValidIndex, starsForMoves, type StarCount } from '@/game/engine';
import type { Board, LevelDef } from '@/game/types';

export const TAP_LOCK_MS = 200;
export const HINTS_PER_LEVEL = 2;
export const HINTS_PER_AD = 1;
export const BONUS_MOVES = 10;
export const BONUS_MOVES_EXTRA = 5;
export const FREE_UNDOS = 3;
export const UNDOS_PER_AD = 2;

/** Every level starts with the same two hints. A rewarded ad adds one more. */
export function hintsForPar(_par: number): number {
  return HINTS_PER_LEVEL;
}

export type GameMode = 'level' | 'daily';
export type GameStatus = 'idle' | 'playing' | 'paused' | 'won' | 'failed';

export interface TapEvent {
  index: number;
  /** Increments on every tap or undo so the board can replay its ripple. */
  seq: number;
}

export interface ResumeData {
  history: number[];
  hintsLeft: number;
  bonusMoves: number;
  undosLeft: number;
}

interface GameState {
  level: LevelDef | null;
  mode: GameMode;
  board: Board | null;
  history: number[];
  bonusMoves: number;
  hintsLeft: number;
  undosLeft: number;
  hintCell: number | null;
  status: GameStatus;
  earnedStars: StarCount;
  lastTap: TapEvent | null;
  /** Taps are ignored until this timestamp, preventing double taps mid-animation. */
  lockUntil: number;

  start: (level: LevelDef, mode: GameMode, resume?: ResumeData) => void;
  tap: (index: number, now?: number) => boolean;
  undo: () => boolean;
  restart: () => void;
  requestHint: () => number | null;
  pause: () => void;
  resume: () => void;
  grantBonusMoves: () => boolean;
  /** Adds another set of hints after a rewarded ad. Only while the level is in play. */
  grantHints: () => boolean;
  /** Adds two undos after a rewarded ad. Only while the level is in play. */
  grantUndos: () => boolean;
  exit: () => void;
}

const undoTap = (board: Board, index: number): Board => {
  let result = board;
  for (let i = 1; i < board.colors; i += 1) result = applyTap(result, index);
  return result;
};

const initialState = {
  level: null,
  mode: 'level' as GameMode,
  board: null,
  history: [],
  bonusMoves: 0,
  hintsLeft: HINTS_PER_LEVEL,
  undosLeft: FREE_UNDOS,
  hintCell: null,
  status: 'idle' as GameStatus,
  earnedStars: 0 as StarCount,
  lastTap: null,
  lockUntil: 0,
};

export const useGameStore = create<GameState>()((set, get) => ({
  ...initialState,

  start: (level, mode, resume) => {
    let board = level.board;
    const history: number[] = [];
    // Replay a saved session, discarding anything that no longer fits the level.
    for (const tap of resume?.history ?? []) {
      if (!isValidIndex(board, tap) || history.length >= level.moveLimit + (resume?.bonusMoves ?? 0)) break;
      board = applyTap(board, tap);
      history.push(tap);
      if (isSolved(board)) break;
    }
    const solvedOnResume = history.length > 0 && isSolved(board);
    const bonusMoves = resume?.bonusMoves ?? 0;
    const outOfMoves = !solvedOnResume && history.length >= level.moveLimit + bonusMoves;
    set({
      ...initialState,
      level,
      mode,
      board: solvedOnResume ? level.board : board,
      history: solvedOnResume ? [] : history,
      bonusMoves,
      hintsLeft: resume?.hintsLeft ?? hintsForPar(level.par),
      undosLeft: resume?.undosLeft ?? FREE_UNDOS,
      status: outOfMoves ? 'failed' : 'playing',
    });
  },

  tap: (index, now = Date.now()) => {
    const { board, level, status, lockUntil, history, bonusMoves, lastTap } = get();
    if (!board || !level || status !== 'playing' || now < lockUntil) return false;
    if (!isValidIndex(board, index)) return false;

    const next = applyTap(board, index);
    const nextHistory = [...history, index];
    const movesUsed = nextHistory.length;
    const solved = isSolved(next);
    const outOfMoves = movesUsed >= level.moveLimit + bonusMoves;

    set({
      board: next,
      history: nextHistory,
      hintCell: null,
      lastTap: { index, seq: (lastTap?.seq ?? 0) + 1 },
      lockUntil: now + TAP_LOCK_MS,
      status: solved ? 'won' : outOfMoves ? 'failed' : 'playing',
      earnedStars: solved ? starsForMoves(level, movesUsed) : 0,
    });
    return true;
  },

  undo: () => {
    const { board, history, status, lastTap, undosLeft } = get();
    if (!board || status !== 'playing' || history.length === 0 || undosLeft <= 0) return false;
    const index = history[history.length - 1];
    set({
      board: undoTap(board, index),
      history: history.slice(0, -1),
      hintCell: null,
      undosLeft: undosLeft - 1,
      lastTap: { index, seq: (lastTap?.seq ?? 0) + 1 },
      lockUntil: 0,
    });
    return true;
  },

  restart: () => {
    const { level, mode, lastTap } = get();
    if (!level) return;
    set({
      ...initialState,
      level,
      mode,
      board: level.board,
      status: 'playing',
      lastTap: lastTap ? { index: -1, seq: lastTap.seq + 1 } : null,
    });
  },

  requestHint: () => {
    const { board, status, hintsLeft, hintCell } = get();
    if (!board || status !== 'playing') return null;
    if (hintCell !== null) return hintCell;
    if (hintsLeft <= 0) return null;
    const cell = findHint(board);
    if (cell === null) return null;
    set({ hintCell: cell, hintsLeft: hintsLeft - 1 });
    return cell;
  },

  pause: () => {
    if (get().status === 'playing') set({ status: 'paused' });
  },

  resume: () => {
    if (get().status === 'paused') set({ status: 'playing', lockUntil: 0 });
  },

  grantBonusMoves: () => {
    const { status, bonusMoves } = get();
    if (status !== 'failed') return false;
    const next = bonusMoves === 0 ? BONUS_MOVES : bonusMoves === BONUS_MOVES ? BONUS_MOVES + BONUS_MOVES_EXTRA : 0;
    if (next === 0) return false;
    set({ status: 'playing', bonusMoves: next, lockUntil: 0 });
    return true;
  },

  grantHints: () => {
    if (get().status !== 'playing') return false;
    set({ hintsLeft: get().hintsLeft + HINTS_PER_AD });
    return true;
  },

  grantUndos: () => {
    if (get().status !== 'playing') return false;
    set({ undosLeft: get().undosLeft + UNDOS_PER_AD });
    return true;
  },

  exit: () => set({ ...initialState }),
}));

export const selectMovesUsed = (state: GameState) => state.history.length;
export const selectMoveLimit = (state: GameState) =>
  (state.level?.moveLimit ?? 0) + state.bonusMoves;
