import { useEffect, useState } from 'react';
import { isLanguage } from '@/i18n/languages';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { TOTAL_LEVELS } from '@/game/levels';
import { storage } from '@/services/storage';
import {
  applyLevelWin,
  createDefaultProgress,
  CURRENT_SAVE_VERSION,
  migrateProgress,
  type ProgressData,
  type SavedSession,
  type Settings,
} from './progressModel';

interface ProgressActions {
  recordLevelWin: (levelNumber: number, moves: number, stars: number) => void;
  recordDailyWin: (dateKey: string, moves: number, stars: number) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  saveSession: (session: SavedSession) => void;
  clearSession: () => void;
  markTutorialSeen: () => void;
  /** Wipes progress but keeps the player's settings and the seen tutorial. */
  resetProgress: () => void;
}

export type ProgressState = ProgressData & ProgressActions;

const dataOf = (state: ProgressState): ProgressData => ({
  saveVersion: state.saveVersion,
  unlockedLevel: state.unlockedLevel,
  stars: state.stars,
  bestMoves: state.bestMoves,
  daily: state.daily,
  settings: state.settings,
  session: state.session,
  tutorialSeen: state.tutorialSeen,
});

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      ...createDefaultProgress(),

      recordLevelWin: (levelNumber, moves, stars) =>
        set(applyLevelWin(dataOf(get()), levelNumber, moves, stars, TOTAL_LEVELS)),

      recordDailyWin: (dateKey, moves, stars) => {
        const previous = get().daily[dateKey];
        const best = previous
          ? { stars: Math.max(previous.stars, stars), moves: Math.min(previous.moves, moves) }
          : { stars, moves };
        set({ daily: { ...get().daily, [dateKey]: best } });
      },

      updateSettings: (patch) => {
        const settings = { ...get().settings, ...patch };
        if (!isLanguage(settings.language)) settings.language = 'en';
        set({ settings });
      },

      saveSession: (session) => set({ session }),

      clearSession: () => set({ session: null }),

      markTutorialSeen: () => set({ tutorialSeen: true }),

      resetProgress: () =>
        set({ ...createDefaultProgress(), settings: get().settings, tutorialSeen: get().tutorialSeen }),
    }),
    {
      name: 'flip-it-save',
      version: CURRENT_SAVE_VERSION,
      storage: createJSONStorage(() => storage),
      partialize: dataOf,
      migrate: (persisted, version) => migrateProgress(persisted, version),
      merge: (persisted, current) => ({
        ...current,
        ...migrateProgress(persisted, CURRENT_SAVE_VERSION),
      }),
    },
  ),
);

/** True once saved progress has been loaded from device storage. */
export function useHasHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useProgressStore.persist.hasHydrated());
  useEffect(() => {
    if (hydrated) return undefined;
    const unsubscribe = useProgressStore.persist.onFinishHydration(() => setHydrated(true));
    if (useProgressStore.persist.hasHydrated()) setHydrated(true);
    return unsubscribe;
  }, [hydrated]);
  return hydrated;
}
