import { LEADERBOARDS, type GameMode } from './leaderboards';

export interface ScoreMemory {
  submitted: Partial<Record<GameMode, number>>;
  pending: Partial<Record<GameMode, number>>;
}

export const emptyScoreMemory = (): ScoreMemory => ({ submitted: {}, pending: {} });

/**
 * Keeps the higher unsent score. A repeat of a score already accepted is skipped.
 * An invalid score leaves the queue alone.
 */
export function considerScore(
  memory: ScoreMemory,
  mode: GameMode,
  score: number,
): { memory: ScoreMemory; send: number | null } {
  const maxScore = LEADERBOARDS[mode].maxScore;
  if (!Number.isInteger(score) || score < 0 || score > maxScore) return { memory, send: null };
  const sent = memory.submitted[mode] ?? -1;
  const waiting = memory.pending[mode] ?? -1;
  const best = Math.max(score, waiting);
  if (best <= sent) return { memory, send: null };
  return {
    memory: { submitted: memory.submitted, pending: { ...memory.pending, [mode]: best } },
    send: best,
  };
}

export function confirmScore(memory: ScoreMemory, mode: GameMode, score: number): ScoreMemory {
  const pending = { ...memory.pending };
  if ((pending[mode] ?? -1) <= score) delete pending[mode];
  return {
    submitted: { ...memory.submitted, [mode]: Math.max(memory.submitted[mode] ?? 0, score) },
    pending,
  };
}

export function readScoreMemory(raw: string | null): ScoreMemory {
  if (!raw) return emptyScoreMemory();
  try {
    const parsed = JSON.parse(raw) as Partial<ScoreMemory>;
    return {
      submitted: numbersOnly(parsed.submitted),
      pending: numbersOnly(parsed.pending),
    };
  } catch {
    return emptyScoreMemory();
  }
}

function numbersOnly(value: Partial<Record<GameMode, number>> | undefined): Partial<Record<GameMode, number>> {
  const next: Partial<Record<GameMode, number>> = {};
  if (!value) return next;
  for (const mode of Object.keys(LEADERBOARDS) as GameMode[]) {
    const score = value[mode];
    if (typeof score === 'number' && Number.isInteger(score) && score >= 0) next[mode] = score;
  }
  return next;
}
