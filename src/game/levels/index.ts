import { dailyConfig, generateLevel, levelConfig } from '../generator';
import type { LevelDef } from '../types';

/** Levels shown on the map. Generation is deterministic, so this can grow freely. */
export const TOTAL_LEVELS = 200;

const SEED_PREFIX = 'flip-it-v1';

const cache: LevelDef[] = [];
const usedHashes = new Set<string>();

/**
 * Levels are generated in order so each one can be checked against every earlier
 * board for uniqueness. Results are cached for the lifetime of the app.
 */
export function getLevel(levelNumber: number): LevelDef {
  const target = Math.max(1, Math.min(TOTAL_LEVELS, Math.floor(levelNumber)));
  while (cache.length < target) {
    const number = cache.length + 1;
    cache.push(
      generateLevel({
        id: `level-${number}`,
        number,
        seed: `${SEED_PREFIX}:level:${number}`,
        config: levelConfig(number),
        usedHashes,
      }),
    );
  }
  return cache[target - 1];
}

export function isLevelReady(levelNumber: number): boolean {
  return cache.length >= levelNumber;
}

/**
 * Generates levels up to `levelNumber` a few at a time between frames, so the
 * cache is warm before the player opens a high level.
 */
export function prefetchLevels(levelNumber: number, chunkSize = 5): () => void {
  const target = Math.min(TOTAL_LEVELS, levelNumber);
  let cancelled = false;
  const step = () => {
    if (cancelled || cache.length >= target) return;
    getLevel(Math.min(target, cache.length + chunkSize));
    setTimeout(step, 16);
  };
  const timer = setTimeout(step, 0);
  return () => {
    cancelled = true;
    clearTimeout(timer);
  };
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

const dailyCache = new Map<string, LevelDef>();

export function getDailyLevel(dateKey: string): LevelDef {
  const cached = dailyCache.get(dateKey);
  if (cached) return cached;
  const level = generateLevel({
    id: `daily-${dateKey}`,
    number: 0,
    seed: `${SEED_PREFIX}:daily:${dateKey}`,
    config: dailyConfig(dateKey),
  });
  dailyCache.set(dateKey, level);
  return level;
}
