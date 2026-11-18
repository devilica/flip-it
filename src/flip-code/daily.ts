import { createCode } from './generate';
import type { MascotId } from './types';

export function flipCodeDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}${month}${day}`;
}

/** Medium daily code. The same calendar day always returns the same combination. */
export function getDailyCode(date: Date): MascotId[] {
  return createCode(Number(flipCodeDateKey(date)), 'medium');
}
