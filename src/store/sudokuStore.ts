import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { storage } from '@/services/storage';
import { SUDOKU_LEVEL_COUNT } from '@/sudoku/levels';
import type { SudokuSession } from '@/sudoku/types';
import { openClearedEnding } from './progressModel';

interface SudokuData {
  unlockedLevel: number;
  stars: Record<string, number>;
  /** Fewest lightbulbs used for a completed level. */
  bestTools: Record<string, number>;
  session: SudokuSession | null;
  /** YYYYMMDD of the daily puzzle that has been cleared. */
  dailyCleared: string | null;
}

interface SudokuActions {
  saveSession: (session: SudokuSession) => void;
  clearSession: () => void;
  recordWin: (levelNumber: number, stars: number, lightbulbsUsed: number) => void;
  clearDaily: (dateKey: string) => void;
  /** Wipes levels, stars, the daily clear, and any unfinished puzzle. */
  resetProgress: () => void;
}

const empty = (): SudokuData => ({
  unlockedLevel: 1,
  stars: {},
  bestTools: {},
  session: null,
  dailyCleared: null,
});

export const useSudokuStore = create<SudokuData & SudokuActions>()(
  persist(
    (set, get) => ({
      ...empty(),

      saveSession: (session) => set({ session }),
      clearSession: () => set({ session: null }),

      recordWin: (levelNumber, stars, lightbulbsUsed) => {
        const key = String(levelNumber);
        const previousStars = get().stars[key] ?? 0;
        const previousTools = get().bestTools[key];
        set({
          stars: { ...get().stars, [key]: Math.max(previousStars, stars) },
          bestTools: {
            ...get().bestTools,
            [key]: previousTools === undefined ? lightbulbsUsed : Math.min(previousTools, lightbulbsUsed),
          },
          unlockedLevel: Math.min(SUDOKU_LEVEL_COUNT, Math.max(get().unlockedLevel, levelNumber + 1)),
          session: null,
        });
      },

      clearDaily: (dateKey) => set({ dailyCleared: dateKey, session: null }),

      resetProgress: () => set(empty()),
    }),
    {
      name: 'flip-sudoku-save',
      storage: createJSONStorage(() => storage),
      partialize: ({ unlockedLevel, stars, bestTools, session, dailyCleared }) => ({
        unlockedLevel,
        stars,
        bestTools,
        session,
        dailyCleared,
      }),
      merge: (persisted, current) => {
        const saved = { ...empty(), ...(persisted as Partial<SudokuData>) };
        return {
          ...current,
          ...saved,
          unlockedLevel: openClearedEnding(saved.unlockedLevel, saved.stars, 200, SUDOKU_LEVEL_COUNT),
        };
      },
    },
  ),
);

/** True once the sudoku save has been read. The play screen waits so it cannot overwrite that save. */
export function useSudokuHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useSudokuStore.persist.hasHydrated());
  useEffect(() => {
    if (hydrated) return undefined;
    const unsubscribe = useSudokuStore.persist.onFinishHydration(() => setHydrated(true));
    if (useSudokuStore.persist.hasHydrated()) setHydrated(true);
    return unsubscribe;
  }, [hydrated]);
  return hydrated;
}
