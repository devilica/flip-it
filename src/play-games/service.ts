import { storage } from '@/services/storage';

import { GAME_MODES, LEADERBOARDS, type GameMode } from './leaderboards';
import { playGamesNative, signedOutStatus, type PlayGamesStatus, type RankSpan, type ScorePage } from './native';
import { confirmScore, considerScore, emptyScoreMemory, readScoreMemory, type ScoreMemory } from './scores';

const STORAGE_KEY = 'play-games-scores';

let chain: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = chain.then(task, task);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function loadMemory(): Promise<ScoreMemory> {
  return readScoreMemory(await storage.getItem(STORAGE_KEY));
}

async function saveMemory(memory: ScoreMemory): Promise<void> {
  await storage.setItem(STORAGE_KEY, JSON.stringify(memory));
}

async function send(mode: GameMode, score: number): Promise<boolean> {
  if (!playGamesNative) return false;
  try {
    return await playGamesNative.submitScore(LEADERBOARDS[mode].id, score);
  } catch {
    return false;
  }
}

async function flush(memory: ScoreMemory): Promise<ScoreMemory> {
  let next = memory;
  for (const mode of GAME_MODES) {
    const score = next.pending[mode];
    if (score === undefined) continue;
    if (await send(mode, score)) next = confirmScore(next, mode, score);
  }
  return next;
}

/** Signs in without blocking the game, then sends any score that did not go through. */
export function connectPlayGames(): Promise<PlayGamesStatus> {
  return enqueue(async () => {
    if (!playGamesNative) return signedOutStatus();
    let status = signedOutStatus();
    try {
      status = await playGamesNative.signIn();
    } catch {
      status = signedOutStatus();
    }
    if (!status.authenticated) return status;
    const memory = await flush(await loadMemory());
    await saveMemory(memory);
    return status;
  });
}

export function playGamesStatus(): Promise<PlayGamesStatus> {
  return enqueue(async () => {
    if (!playGamesNative) return signedOutStatus();
    try {
      return await playGamesNative.getStatus();
    } catch {
      return signedOutStatus();
    }
  });
}

/** Submits one real result. A lower or repeated score is kept off the network. */
export function submitScore(mode: GameMode, score: number): Promise<void> {
  return enqueue(async () => {
    const decision = considerScore(await loadMemory(), mode, score);
    if (decision.send === null) return;
    let memory = decision.memory;
    await saveMemory(memory);
    if (await send(mode, decision.send)) memory = confirmScore(memory, mode, decision.send);
    await saveMemory(memory);
  });
}

const SCORE_PAUSE_MS = 30_000;
const scoreCache = new Map<string, { at: number; page: ScorePage }>();
const scoreCooldown = new Map<string, number>();
const scoreRequests = new Map<string, Promise<ScorePage | null>>();

export function loadLeaderboard(mode: GameMode, span: RankSpan): Promise<ScorePage | null> {
  if (!playGamesNative) return Promise.resolve(null);
  const key = `${mode}:${span}`;
  const now = Date.now();
  const cached = scoreCache.get(key);
  if (cached && now - cached.at < SCORE_PAUSE_MS) return Promise.resolve(cached.page);
  if ((scoreCooldown.get(key) ?? 0) > now) return Promise.resolve(null);
  const pending = scoreRequests.get(key);
  if (pending) return pending;
  const request = playGamesNative
    .loadScores(LEADERBOARDS[mode].id, span, 25)
    .then((page) => {
      if (!page) return null;
      scoreCache.set(key, { at: Date.now(), page });
      scoreCooldown.delete(key);
      return page;
    })
    .catch(() => {
      scoreCooldown.set(key, Date.now() + SCORE_PAUSE_MS);
      return null;
    })
    .finally(() => {
      scoreRequests.delete(key);
    });
  scoreRequests.set(key, request);
  return request;
}

export async function openNativeLeaderboard(mode: GameMode, span: RankSpan): Promise<boolean> {
  if (!playGamesNative) return false;
  try {
    return await playGamesNative.showLeaderboard(LEADERBOARDS[mode].id, span);
  } catch {
    return false;
  }
}

export function playGamesAvailable(): boolean {
  return playGamesNative !== null;
}

export { emptyScoreMemory };
