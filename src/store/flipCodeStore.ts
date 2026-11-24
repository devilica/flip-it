import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { canSaveDailyStreak, nextDailyStreak, shiftDateKey } from '@/flip-code/daily';
import type { FlipCodeSession } from '@/flip-code/types';
import { storage } from '@/services/storage';

interface FlipCodeData {
  played: number;
  won: number;
  /** Attempts used across wins, for the average. */
  attemptsTotal: number;
  streak: number;
  bestStreak: number;
  /** Consecutive daily clears. A missed day breaks it unless an ad saved yesterday. */
  dailyStreak: number;
  /** YYYYMMDD of a missed day an ad kept in the streak. */
  streakBridge: string | null;
  /** YYYYMMDD of the daily code that has been cleared. */
  dailyCleared: string | null;
  session: FlipCodeSession | null;
}

interface FlipCodeActions {
  saveSession: (session: FlipCodeSession) => void;
  clearSession: () => void;
  recordResult: (won: boolean, attempts: number, daily: boolean, dateKey: string | null) => void;
  /** Keeps the daily streak across exactly one missed day. */
  saveDailyStreak: (today: string) => boolean;
}

const empty = (): FlipCodeData => ({
  played: 0,
  won: 0,
  attemptsTotal: 0,
  streak: 0,
  bestStreak: 0,
  dailyStreak: 0,
  streakBridge: null,
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
        const continuesDaily = daily && won && dateKey;
        set({
          played: get().played + 1,
          won: get().won + (won ? 1 : 0),
          attemptsTotal: get().attemptsTotal + (won ? attempts : 0),
          streak,
          bestStreak: Math.max(get().bestStreak, streak),
          dailyStreak: continuesDaily
            ? nextDailyStreak(get().dailyCleared, get().streakBridge, get().dailyStreak, dateKey)
            : get().dailyStreak,
          streakBridge: continuesDaily ? null : get().streakBridge,
          dailyCleared: continuesDaily ? dateKey : get().dailyCleared,
          session: null,
        });
      },

      saveDailyStreak: (today) => {
        const { dailyCleared, streakBridge, dailyStreak } = get();
        if (!canSaveDailyStreak(dailyCleared, streakBridge, dailyStreak, today)) return false;
        set({ streakBridge: shiftDateKey(today, -1) });
        return true;
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
        dailyStreak: state.dailyStreak,
        streakBridge: state.streakBridge,
        dailyCleared: state.dailyCleared,
        session: state.session,
      }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<FlipCodeData>;
        return {
          ...current,
          ...empty(),
          ...saved,
          dailyStreak: typeof saved.dailyStreak === 'number' && saved.dailyStreak >= 0 ? saved.dailyStreak : 0,
          streakBridge: typeof saved.streakBridge === 'string' ? saved.streakBridge : null,
        };
      },
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
