import { isLanguage } from '@/i18n/languages';
import { FREE_UNDOS } from '@/store/gameStore';

export const CURRENT_SAVE_VERSION = 1;

export type ThemeName = 'dark' | 'light';

export interface Settings {
  sound: boolean;
  music: boolean;
  haptics: boolean;
  theme: ThemeName;
  /** One of the supported language codes. English when an old save has none. */
  language: string;
}

/** An unfinished regular level, so the player can continue where they left off. */
export interface SavedSession {
  levelNumber: number;
  /** Taps played so far, replayed on top of the generated board. */
  history: number[];
  hintsLeft: number;
  bonusMoves: number;
  undosLeft: number;
}

export interface DailyResult {
  stars: number;
  moves: number;
}

export interface ProgressData {
  saveVersion: number;
  /** Highest level the player may start. */
  unlockedLevel: number;
  /** Best star count per completed level, keyed by level number. */
  stars: Record<string, number>;
  /** Fewest moves used per completed level, keyed by level number. */
  bestMoves: Record<string, number>;
  /** Completed daily challenges, keyed by YYYYMMDD. */
  daily: Record<string, DailyResult>;
  settings: Settings;
  session: SavedSession | null;
  /** True after the player finishes or skips the first-launch flip tutorial. */
  tutorialSeen: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  sound: true,
  music: true,
  haptics: true,
  theme: 'dark',
  language: 'en',
};

export function createDefaultProgress(): ProgressData {
  return {
    saveVersion: CURRENT_SAVE_VERSION,
    unlockedLevel: 1,
    stars: {},
    bestMoves: {},
    daily: {},
    settings: { ...DEFAULT_SETTINGS },
    session: null,
    tutorialSeen: false,
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function numberRecord(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {};
  const result: Record<string, number> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === 'number' && Number.isFinite(entry)) result[key] = entry;
  }
  return result;
}

function sanitizeSession(value: unknown): SavedSession | null {
  if (!isRecord(value)) return null;
  const { levelNumber, history, hintsLeft, bonusMoves, undosLeft } = value;
  if (typeof levelNumber !== 'number' || !Array.isArray(history)) return null;
  if (!history.every((tap) => typeof tap === 'number')) return null;
  return {
    levelNumber,
    history: history as number[],
    hintsLeft: typeof hintsLeft === 'number' ? hintsLeft : 0,
    bonusMoves: typeof bonusMoves === 'number' ? bonusMoves : 0,
    undosLeft: typeof undosLeft === 'number' && undosLeft >= 0 ? undosLeft : FREE_UNDOS,
  };
}

/**
 * Upgrades any previously saved data to the current format. New save versions
 * should add a step here instead of discarding the player's progress.
 */
export function migrateProgress(persisted: unknown, fromVersion: number): ProgressData {
  const base = createDefaultProgress();
  if (!isRecord(persisted)) return base;

  // Version 0 (pre-release) stored the unlocked level as `currentLevel`.
  const unlocked =
    fromVersion < 1 && typeof persisted.currentLevel === 'number'
      ? persisted.currentLevel
      : persisted.unlockedLevel;

  const settings = isRecord(persisted.settings) ? persisted.settings : {};
  const daily: Record<string, DailyResult> = {};
  if (isRecord(persisted.daily)) {
    for (const [key, entry] of Object.entries(persisted.daily)) {
      if (isRecord(entry) && typeof entry.stars === 'number' && typeof entry.moves === 'number') {
        daily[key] = { stars: entry.stars, moves: entry.moves };
      }
    }
  }

  return {
    saveVersion: CURRENT_SAVE_VERSION,
    unlockedLevel: typeof unlocked === 'number' && unlocked >= 1 ? Math.floor(unlocked) : 1,
    stars: numberRecord(persisted.stars),
    bestMoves: numberRecord(persisted.bestMoves),
    daily,
    settings: {
      sound: typeof settings.sound === 'boolean' ? settings.sound : DEFAULT_SETTINGS.sound,
      music: typeof settings.music === 'boolean' ? settings.music : DEFAULT_SETTINGS.music,
      haptics: typeof settings.haptics === 'boolean' ? settings.haptics : DEFAULT_SETTINGS.haptics,
      theme: settings.theme === 'light' ? 'light' : 'dark',
      language: isLanguage(settings.language) ? settings.language : DEFAULT_SETTINGS.language,
    },
    session: sanitizeSession(persisted.session),
    tutorialSeen: persisted.tutorialSeen === true,
  };
}

export function totalStars(progress: Pick<ProgressData, 'stars'>): number {
  return Object.values(progress.stars).reduce((sum, value) => sum + value, 0);
}

export function completedCount(progress: Pick<ProgressData, 'stars'>): number {
  return Object.keys(progress.stars).length;
}

/** A solved old final level opens the first level added after that save was capped. */
export function openClearedEnding(
  unlockedLevel: number,
  stars: Record<string, number>,
  finishedLevel: number,
  totalLevels: number,
): number {
  const cleared = (stars[String(finishedLevel)] ?? 0) > 0;
  const next = cleared ? Math.max(unlockedLevel, finishedLevel + 1) : unlockedLevel;
  return Math.min(totalLevels, Math.max(1, Math.floor(next)));
}

/** Pure reducer for a level win; kept separate from the store so it is easy to test. */
export function applyLevelWin(
  progress: ProgressData,
  levelNumber: number,
  moves: number,
  stars: number,
  totalLevels: number,
): ProgressData {
  const key = String(levelNumber);
  const previousStars = progress.stars[key] ?? 0;
  const previousMoves = progress.bestMoves[key];
  return {
    ...progress,
    unlockedLevel: Math.max(progress.unlockedLevel, Math.min(totalLevels, levelNumber + 1)),
    stars: { ...progress.stars, [key]: Math.max(previousStars, stars) },
    bestMoves: {
      ...progress.bestMoves,
      [key]: previousMoves === undefined ? moves : Math.min(previousMoves, moves),
    },
    session: progress.session?.levelNumber === levelNumber ? null : progress.session,
  };
}
