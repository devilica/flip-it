import { requireOptionalNativeModule } from 'expo';

export type RankSpan = 'daily' | 'weekly' | 'all';

export interface PlayGamesStatus {
  authenticated: boolean;
  displayName: string | null;
  iconUri: string | null;
  playerId: string | null;
}

export interface ScoreEntry {
  rank: number;
  score: number;
  displayName: string;
  iconUri: string | null;
  playerId: string;
  currentPlayer: boolean;
}

export interface ScorePage {
  entries: ScoreEntry[];
  player: ScoreEntry | null;
}

interface PlayGamesNative {
  signIn(): Promise<PlayGamesStatus>;
  getStatus(): Promise<PlayGamesStatus>;
  submitScore(leaderboardId: string, score: number): Promise<boolean>;
  loadScores(leaderboardId: string, span: RankSpan, limit: number): Promise<ScorePage>;
  showLeaderboard(leaderboardId: string, span: RankSpan): Promise<boolean>;
}

export const signedOutStatus = (): PlayGamesStatus => ({
  authenticated: false,
  displayName: null,
  iconUri: null,
  playerId: null,
});

/** Null in Expo Go, where this native module is not installed. */
export const playGamesNative = requireOptionalNativeModule<PlayGamesNative>('PlayGames');
