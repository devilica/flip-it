import { createCode } from './generate';
import type { MascotId } from './types';

export function flipCodeDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}${month}${day}`;
}

export function dateFromKey(key: string): Date {
  const year = Number(key.slice(0, 4));
  const month = Number(key.slice(4, 6)) - 1;
  const day = Number(key.slice(6, 8));
  return new Date(year, month, day);
}

export function shiftDateKey(key: string, days: number): string {
  const date = dateFromKey(key);
  date.setDate(date.getDate() + days);
  return flipCodeDateKey(date);
}

/** Today's win continues the streak when yesterday was cleared or saved by an ad. */
export function nextDailyStreak(previousDate: string | null, bridge: string | null, streak: number, today: string): number {
  const yesterday = shiftDateKey(today, -1);
  if (previousDate === yesterday || bridge === yesterday) return streak + 1;
  return 1;
}

/** True when exactly one day is missing and there is a streak worth keeping. */
export function canSaveDailyStreak(previousDate: string | null, bridge: string | null, streak: number, today: string): boolean {
  if (streak <= 0 || !previousDate) return false;
  const yesterday = shiftDateKey(today, -1);
  return previousDate === shiftDateKey(today, -2) && bridge !== yesterday;
}

/** Medium daily code. The same calendar day always returns the same combination. */
export function getDailyCode(date: Date): MascotId[] {
  return createCode(Number(flipCodeDateKey(date)), 'medium');
}
