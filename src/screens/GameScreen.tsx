import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { SkiaBoard } from '@/components/board/SkiaBoard';
import { FailOverlay } from '@/components/game/FailOverlay';
import { HintOfferOverlay } from '@/components/game/HintOfferOverlay';
import { UndoOfferOverlay } from '@/components/game/UndoOfferOverlay';
import { GameControls } from '@/components/game/GameControls';
import { GameHud } from '@/components/game/GameHud';
import { PauseOverlay } from '@/components/game/PauseOverlay';
import { VictoryOverlay } from '@/components/game/VictoryOverlay';
import { FlipTutorial } from '@/components/tutorial/FlipTutorial';
import { Screen } from '@/components/ui/Screen';
import { UNLOCK_ALL_LEVELS } from '@/config/dev';
import { minimumMoves, uniformity } from '@/game/engine';
import { getDailyLevel, getLevel, isLevelReady, toDateKey, TOTAL_LEVELS } from '@/game/levels';
import type { LevelDef } from '@/game/types';
import { useSquareLayout } from '@/hooks/useSquareLayout';
import { useTheme } from '@/hooks/useTheme';
import { useI18n } from '@/i18n';
import { showLevelInterstitial } from '@/services/ads';
import { feedback } from '@/services/feedback';
import {
  BONUS_MOVES,
  BONUS_MOVES_EXTRA,
  HINTS_PER_AD,
  selectMoveLimit,
  selectMovesUsed,
  useGameStore,
  type GameMode,
} from '@/store/gameStore';
import { useProgressStore } from '@/store/progressStore';
import { spacing } from '@/theme';

interface GameScreenProps {
  mode: GameMode;
  /** Requested level; ignored for the daily challenge. */
  levelNumber?: number;
  /** Restore the saved session for this level if there is one. */
  resume?: boolean;
}

function loadLevel(mode: GameMode, levelNumber: number, dateKey: string): LevelDef {
  return mode === 'daily' ? getDailyLevel(dateKey) : getLevel(levelNumber);
}

export function GameScreen({ mode, levelNumber = 1, resume = false }: GameScreenProps) {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useI18n();
  const dateKey = useMemo(() => toDateKey(new Date()), []);

  const unlockedLevel = useProgressStore((state) => state.unlockedLevel);
  // Never let a deep link start a locked level, unless the dev switch opens them all.
  const levelCap = UNLOCK_ALL_LEVELS ? TOTAL_LEVELS : unlockedLevel;
  const safeLevel = Math.max(1, Math.min(levelNumber, levelCap, TOTAL_LEVELS));

  const level = useGameStore((state) => state.level);
  const board = useGameStore((state) => state.board);
  const status = useGameStore((state) => state.status);
  const lastTap = useGameStore((state) => state.lastTap);
  const hintCell = useGameStore((state) => state.hintCell);
  const hintsLeft = useGameStore((state) => state.hintsLeft);
  const undosLeft = useGameStore((state) => state.undosLeft);
  const bonusMoves = useGameStore((state) => state.bonusMoves);
  const earnedStars = useGameStore((state) => state.earnedStars);
  const history = useGameStore((state) => state.history);
  const movesUsed = useGameStore(selectMovesUsed);
  const moveLimit = useGameStore(selectMoveLimit);
  const actions = useMemo(() => useGameStore.getState(), []);

  const bestMoves = useProgressStore((state) =>
    mode === 'level' ? (state.bestMoves[String(safeLevel)] ?? null) : (state.daily[dateKey]?.moves ?? null),
  );

  const [ready, setReady] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [hintOffer, setHintOffer] = useState(false);
  const [undoOffer, setUndoOffer] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const { size: boardSize, onLayout } = useSquareLayout();
  const nowMoves = useMemo(() => {
    if (!board) return null;
    const count = minimumMoves(board);
    return Number.isFinite(count) ? count : null;
  }, [board]);

  // Load (and generate if needed) the level, deferring a frame so a spinner can show.
  useEffect(() => {
    let cancelled = false;
    let startedId: string | null = null;
    const begin = () => {
      if (cancelled) return;
      const def = loadLevel(mode, safeLevel, dateKey);
      const session = useProgressStore.getState().session;
      const resumeData =
        resume && mode === 'level' && session?.levelNumber === def.number ? session : undefined;
      useGameStore.getState().start(def, mode, resumeData);
      startedId = def.id;
      setReady(true);
    };
    const timer = mode === 'daily' || isLevelReady(safeLevel) ? null : setTimeout(begin, 32);
    if (timer === null) begin();
    return () => {
      cancelled = true;
      if (timer !== null) clearTimeout(timer);
      // The next screen may already have started its own level; only clear our own.
      if (startedId !== null && useGameStore.getState().level?.id === startedId) {
        useGameStore.getState().exit();
      }
    };
  }, [dateKey, mode, resume, safeLevel]);

  // Persist in-progress regular levels so "Continue" can restore them.
  useEffect(() => {
    if (!ready || mode !== 'level' || !level) return;
    const progress = useProgressStore.getState();
    if (status === 'playing' || status === 'paused') {
      if (history.length > 0) {
        progress.saveSession({ levelNumber: level.number, history, hintsLeft, bonusMoves, undosLeft });
      } else if (progress.session?.levelNumber === level.number) {
        progress.clearSession();
      }
    }
  }, [bonusMoves, history, hintsLeft, level, mode, ready, status, undosLeft]);

  // Outcome side effects.
  const shake = useSharedValue(0);
  useEffect(() => {
    if (!level) return;
    const progress = useProgressStore.getState();
    if (status === 'won') {
      feedback('win', 'success');
      const { history: played, earnedStars: stars } = useGameStore.getState();
      if (mode === 'daily') progress.recordDailyWin(dateKey, played.length, stars);
      else progress.recordLevelWin(level.number, played.length, stars);
    } else if (status === 'failed') {
      feedback('fail', 'warning');
      shake.value = withSequence(
        withTiming(-12, { duration: 60 }),
        withTiming(12, { duration: 60 }),
        withTiming(-8, { duration: 60 }),
        withTiming(8, { duration: 60 }),
        withTiming(0, { duration: 60 }),
      );
      if (mode === 'level' && progress.session?.levelNumber === level.number) progress.clearSession();
    }
    // Only react to status transitions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  const goHome = useCallback(() => router.dismissTo('/flip'), [router]);
  const goLevels = useCallback(() => router.dismissTo('/levels'), [router]);

  // Android back: pause first, then resume, otherwise leave normally.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (undoOffer) {
        setUndoOffer(false);
        return true;
      }
      if (hintOffer) {
        setHintOffer(false);
        return true;
      }
      if (rulesOpen) {
        setRulesOpen(false);
        return true;
      }
      const current = useGameStore.getState().status;
      if (current === 'playing') {
        useGameStore.getState().pause();
        return true;
      }
      if (current === 'paused') {
        useGameStore.getState().resume();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [hintOffer, rulesOpen, undoOffer]);

  const onTapCell = useCallback(
    (index: number) => {
      if (actions.tap(index)) feedback('tap', 'tap');
    },
    [actions],
  );

  const onUndo = useCallback(() => {
    if (history.length === 0) return;
    if (undosLeft <= 0) {
      setUndoOffer(true);
      return;
    }
    if (actions.undo()) feedback('undo', 'tap');
  }, [actions, history.length, undosLeft]);

  const onRestart = useCallback(() => {
    actions.restart();
    feedback('undo', 'heavy');
  }, [actions]);

  const onHint = useCallback(() => {
    if (hintsLeft > 0 || hintCell !== null) {
      if (actions.requestHint() !== null) feedback('hint', 'selection');
      return;
    }
    setHintOffer(true);
  }, [actions, hintCell, hintsLeft]);

  const onContinue = useCallback(async () => {
    if (!level || continuing) return;
    if (mode === 'level' && level.number % 5 === 0) {
      setContinuing(true);
      await showLevelInterstitial(level.number);
    }
    if (mode === 'daily' || level.number >= TOTAL_LEVELS) {
      goHome();
      return;
    }
    router.replace(`/play/${level.number + 1}`);
  }, [continuing, goHome, level, mode, router]);

  const title = mode === 'daily' ? t('daily') : t('levelN', { n: safeLevel });
  const progress = board ? uniformity(board) : 0;

  let overlay = null;
  if (ready && level && status === 'paused') {
    overlay = (
      <PauseOverlay
        onResume={actions.resume}
        onRestart={() => {
          actions.restart();
          feedback('undo', 'heavy');
        }}
        onLevels={goLevels}
        onHome={goHome}
      />
    );
  } else if (ready && level && status === 'won') {
    overlay = (
      <VictoryOverlay
        stars={earnedStars}
        movesUsed={movesUsed}
        par={level.par}
        bestMoves={bestMoves}
        continueLabel={mode === 'daily' || level.number >= TOTAL_LEVELS ? t('done') : t('nextLevel')}
        continueDisabled={continuing}
        onContinue={onContinue}
        onReplay={onRestart}
        onHome={goHome}
      />
    );
  } else if (ready && level && status === 'playing' && undoOffer) {
    overlay = (
      <UndoOfferOverlay
        onGrant={() => {
          if (actions.grantUndos()) {
            feedback('undo', 'success');
            setUndoOffer(false);
          }
        }}
        onClose={() => setUndoOffer(false)}
      />
    );
  } else if (ready && level && status === 'playing' && hintOffer) {
    overlay = (
      <HintOfferOverlay
        hints={HINTS_PER_AD}
        onGrant={() => {
          if (actions.grantHints()) {
            feedback('hint', 'success');
            setHintOffer(false);
          }
        }}
        onClose={() => setHintOffer(false)}
      />
    );
  } else if (ready && level && status === 'playing' && rulesOpen) {
    overlay = <FlipTutorial onDone={() => setRulesOpen(false)} />;
  } else if (ready && level && status === 'failed') {
    overlay = (
      <FailOverlay
        canUseBonus={bonusMoves === 0 || bonusMoves === BONUS_MOVES}
        bonusMoves={bonusMoves === 0 ? BONUS_MOVES : BONUS_MOVES_EXTRA}
        onRetry={onRestart}
        onBonus={() => {
          if (actions.grantBonusMoves()) feedback('star', 'success');
        }}
        onHome={goHome}
      />
    );
  }

  return (
    <Screen overlay={overlay}>
      {!ready || !level || !board ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.primaryGradient[0]} />
        </View>
      ) : (
        <Animated.View entering={FadeIn.duration(300)} style={styles.content}>
          <GameHud
            title={title}
            level={level}
            movesUsed={movesUsed}
            moveLimit={moveLimit}
            boardProgress={progress}
            nowMoves={nowMoves}
            onPause={actions.pause}
            onHelp={() => setRulesOpen(true)}
          />
          <View style={styles.boardArea} onLayout={onLayout}>
            {boardSize > 0 ? (
              <Animated.View style={shakeStyle}>
                <SkiaBoard
                  board={board}
                  size={boardSize}
                  lastTap={lastTap}
                  hintCell={hintCell}
                  interactive={status === 'playing'}
                  celebrate={status === 'won'}
                  onTapCell={onTapCell}
                />
              </Animated.View>
            ) : null}
          </View>
          <GameControls
            canUndo={history.length > 0}
            undosLeft={undosLeft}
            canRestart={history.length > 0}
            hintsLeft={hintsLeft}
            hintActive={hintCell !== null}
            disabled={status !== 'playing'}
            onUndo={onUndo}
            onRestart={onRestart}
            onHint={onHint}
          />
        </Animated.View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, gap: spacing.lg },
  boardArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
