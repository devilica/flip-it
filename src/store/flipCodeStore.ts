import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { FlipCodeSession } from '@/flip-code/types';
import { storage } from '@/services/storage';

interface FlipCodeData {
  played: number;
  won: number;
  /** Attempts used across wins, for the average. */
  attemptsTotal: number;
  streak: number;
  bestStreak: number;
  /** YYYYMMDD of the daily code that has been cleared. */
  dailyCleared: string | null;
  session: FlipCodeSession | null;
}

interface FlipCodeActions {
  saveSession: (session: FlipCodeSession) => void;
  clearSession: () => void;
  recordResult: (won: boolean, attempts: number, daily: boolean, dateKey: string | null) => void;
}

const empty = (): FlipCodeData => ({
  played: 0,
  won: 0,
  attemptsTotal: 0,
  streak: 0,
  bestStreak: 0,
  dailyCleared: null,
  session: null,
});

export const useFlipCodeStore = create<FlipCodeData & FlipCodeActions>()(
  persist(
    (set, get) => ({
      ...empty(),

      saveSession: (session) => set({ session }),
      clearSession: () => set({ session: null }),

      recordResult: (won, attempts, daily, dateKey) => {
        if (daily && won && dateKey && get().dailyCleared === dateKey) {
          set({ session: null });
          return;
        }
        const streak = won ? get().streak + 1 : 0;
        set({
          played: get().played + 1,
          won: get().won + (won ? 1 : 0),
          attemptsTotal: get().attemptsTotal + (won ? attempts : 0),
          streak,
          bestStreak: Math.max(get().bestStreak, streak),
          dailyCleared: daily && won && dateKey ? dateKey : get().dailyCleared,
          session: null,
        });
      },
    }),
    {
      name: 'flip-code-save',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({
        played: state.played,
        won: state.won,
        attemptsTotal: state.attemptsTotal,
        streak: state.streak,
        bestStreak: state.bestStreak,
        dailyCleared: state.dailyCleared,
        session: state.session,
      }),
      merge: (persisted, current) => ({
        ...current,
        ...empty(),
        ...(persisted as Partial<FlipCodeData>),
      }),
    },
  ),
);

/** True once the flip-code save has been read. */
export function useFlipCodeHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useFlipCodeStore.persist.hasHydrated());
  useEffect(() => {
    if (hydrated) return undefined;
    const unsubscribe = useFlipCodeStore.persist.onFinishHydration(() => setHydrated(true));
    if (useFlipCodeStore.persist.hasHydrated()) setHydrated(true);
    return unsubscribe;
  }, [hydrated]);
  return hydrated;
}
