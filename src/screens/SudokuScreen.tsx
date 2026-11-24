import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';

import { HintOfferOverlay } from '@/components/game/HintOfferOverlay';
import { PauseOverlay } from '@/components/game/PauseOverlay';
import { FlipMascot } from '@/components/mascot/FlipMascot';
import { SudokuBoard } from '@/components/sudoku/SudokuBoard';
import { SudokuRulesCard } from '@/components/sudoku/SudokuRulesCard';
import { SudokuWinOverlay } from '@/components/sudoku/SudokuWinOverlay';
import { AppText } from '@/components/ui/AppText';
import { GameButton } from '@/components/ui/GameButton';
import { IconButton } from '@/components/ui/IconButton';
import { OverlayPanel } from '@/components/ui/OverlayPanel';
import { Screen } from '@/components/ui/Screen';
import { useSquareLayout } from '@/hooks/useSquareLayout';
import { useI18n } from '@/i18n';
import { rewardedAds, showLevelInterstitial } from '@/services/ads';
import { feedback } from '@/services/feedback';
import { getDailySudoku, sudokuDateKey } from '@/sudoku/daily';
import { differentOrientation, orientLevel } from '@/sudoku/orient';
import { SUDOKU_LEVEL_COUNT, getSudokuLevel } from '@/sudoku/levels';
import { emptyMarks, isGiven, mascotCells, matchesSolution, starsForLightbulbs } from '@/sudoku/rules';
import { uniqueSolution } from '@/sudoku/solver';
import type { SudokuLevel, SudokuSession } from '@/sudoku/types';
import { useSudokuStore } from '@/store/sudokuStore';
import { spacing } from '@/theme';

interface SudokuScreenProps {
  levelNumber: number;
  daily?: boolean;
}

const SUDOKU_HINTS = 2;

function freshSession(level: SudokuLevel, daily: boolean, orientation = 0): SudokuSession {
  return {
    levelNumber: daily ? 0 : level.id,
    marks: emptyMarks(level),
    magnifier: level.magnifier,
    lightbulb: SUDOKU_HINTS,
    eraser: level.eraser,
    lightbulbsUsed: 0,
    selected: null,
    hint: null,
    daily,
    lives: 3,
    orientation,
  };
}

function resumeSession(saved: SudokuSession): SudokuSession {
  return {
    ...saved,
    lives: saved.lives ?? 3,
    orientation: typeof saved.orientation === 'number' ? saved.orientation : 0,
  };
}

export function SudokuScreen({ levelNumber, daily = false }: SudokuScreenProps) {
  const router = useRouter();
  const { t } = useI18n();
  const today = useMemo(() => new Date(), []);
  const level = daily ? getDailySudoku(today) : getSudokuLevel(levelNumber);
  const { size, onLayout } = useSquareLayout();
  const saveSession = useSudokuStore((state) => state.saveSession);
  const recordWin = useSudokuStore((state) => state.recordWin);
  const clearDaily = useSudokuStore((state) => state.clearDaily);
  const [session, setSession] = useState<SudokuSession>(() => {
    const saved = useSudokuStore.getState().session;
    const boardNumber = daily ? 0 : levelNumber;
    const sameBoard = saved && saved.levelNumber === boardNumber && saved.daily === daily && saved.marks.length === level.size * level.size;
    return sameBoard ? resumeSession(saved) : freshSession(level, daily);
  });
  const [shake, setShake] = useState<{ index: number; nonce: number } | null>(null);
  const [happy, setHappy] = useState<number | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [hintOffer, setHintOffer] = useState(false);
  const [paused, setPaused] = useState(false);
  const recorded = useRef(false);
  const board = useMemo(() => orientLevel(level, session.orientation), [level, session.orientation]);
  const solution = useMemo(() => uniqueSolution(board) ?? [], [board]);

  const won = matchesSolution(board, session.marks, solution);
  const failed = session.lives <= 0 && !won;
  const stars = starsForLightbulbs(session.lightbulbsUsed);
  const placed = new Set(mascotCells(board, session.marks));
  const foundCount = solution.filter((cell) => placed.has(cell)).length;
  const solutionCells = useMemo(() => new Set(solution), [solution]);

  useEffect(() => {
    if (won) return;
    saveSession(session);
  }, [saveSession, session, won]);

  useEffect(() => {
    if (!won || recorded.current) return;
    recorded.current = true;
    feedback('win', 'success');
    if (daily) clearDaily(sudokuDateKey(new Date()));
    else recordWin(level.id, stars, session.lightbulbsUsed);
  }, [clearDaily, daily, level.id, recordWin, session.lightbulbsUsed, stars, won]);

  // Android back: close a help or hint modal, otherwise pause, then resume.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (hintOffer) {
        setHintOffer(false);
        return true;
      }
      if (rulesOpen) {
        setRulesOpen(false);
        return true;
      }
      if (paused) {
        setPaused(false);
        return true;
      }
      if (!won && !failed) {
        setPaused(true);
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [failed, hintOffer, paused, rulesOpen, won]);

  const onPress = (index: number) => {
    if (paused || won || failed || isGiven(board, index)) return;
    const current = session.marks[index];
    if (current === 'mascot' || current === 'wrong') return;
    if (current !== 'x') {
      const marks = session.marks.slice();
      marks[index] = 'x';
      feedback('button', 'selection');
      setSession({ ...session, marks, selected: index, hint: null });
      return;
    }
    if (solutionCells.has(index)) {
      const marks = session.marks.slice();
      marks[index] = 'mascot';
      setHappy(index);
      feedback('tap', 'tap');
      setSession({ ...session, marks, selected: index, hint: null });
      return;
    }
    const marks = session.marks.slice();
    marks[index] = 'wrong';
    setShake((previous) => ({ index, nonce: (previous?.nonce ?? 0) + 1 }));
    feedback('fail', 'warning');
    setSession({ ...session, marks, lives: session.lives - 1, selected: index, hint: null });
  };

  const onLightbulb = () => {
    if (paused || won || failed) return;
    if (session.lightbulb <= 0) {
      setHintOffer(true);
      return;
    }
    const missing = solution.find((cell) => !placed.has(cell));
    if (missing === undefined) return;
    const marks = session.marks.slice();
    marks[missing] = 'mascot';
    setHappy(missing);
    feedback('hint', 'success');
    setSession({
      ...session,
      marks,
      lightbulb: session.lightbulb - 1,
      lightbulbsUsed: session.lightbulbsUsed + 1,
      hint: null,
      selected: missing,
    });
  };

  const replay = () => {
    recorded.current = false;
    setPaused(false);
    setShake(null);
    setHappy(null);
    setHintOffer(false);
    setSession(freshSession(level, daily, differentOrientation(level, session.orientation)));
  };

  const leaving = useRef(false);
  const next = async () => {
    if (leaving.current) return;
    leaving.current = true;
    if (!daily) await showLevelInterstitial(level.id);
    if (daily || level.id >= SUDOKU_LEVEL_COUNT) {
      router.dismissTo('/sudoku');
      return;
    }
    router.replace(`/sudoku/${level.id + 1}`);
  };

  return (
    <Screen
      overlay={
        paused ? (
          <PauseOverlay
            onResume={() => setPaused(false)}
            onRestart={replay}
            onLevels={() => router.dismissTo('/sudoku/levels')}
            onHome={() => router.dismissTo('/sudoku')}
          />
        ) : won ? (
          <SudokuWinOverlay
            stars={stars}
            nextLabel={daily || level.id >= SUDOKU_LEVEL_COUNT ? t('done') : t('nextLevel')}
            onNext={next}
            onReplay={replay}
            onHome={() => router.dismissTo('/sudoku')}
          />
        ) : failed ? (
          <OutOfLivesOverlay
            onContinue={() => {
              setSession((current) => ({ ...current, lives: 1 }));
              feedback('star', 'success');
            }}
            onReplay={replay}
            onHome={() => router.dismissTo('/sudoku')}
          />
        ) : hintOffer ? (
          <HintOfferOverlay
            hints={1}
            onGrant={() => {
              setSession((current) => ({ ...current, lightbulb: current.lightbulb + 1 }));
              feedback('hint', 'success');
              setHintOffer(false);
            }}
            onClose={() => setHintOffer(false)}
          />
        ) : rulesOpen ? (
          <OverlayPanel>
            <AppText size={24} weight="bold" align="center">
              {t('howToPlay')}
            </AppText>
            <SudokuRulesCard cellSize={16} />
            <GameButton label={t('gotIt')} onPress={() => setRulesOpen(false)} style={styles.full} />
          </OverlayPanel>
        ) : undefined
      }
    >
      <View style={styles.header}>
        <IconButton icon="pause" accessibilityLabel={t('pause')} onPress={() => setPaused(true)} size={44} />
        <View style={styles.title}>
          <AppText size={22} weight="bold" align="center">
            {daily ? t('daily') : t('levelN', { n: level.id })}
          </AppText>
          <HeartRow lives={session.lives} />
        </View>
        <IconButton icon="help-circle" accessibilityLabel={t('howToPlay')} onPress={() => setRulesOpen(true)} size={44} />
      </View>

      <View style={styles.progress}>
        {solution.map((cell, index) => {
          const revealed = index < foundCount;
          return <FlipMascot key={cell} state={revealed ? 'happy' : 'idle'} size={22} muted={!revealed} />;
        })}
      </View>

      <View style={styles.boardArea} onLayout={onLayout}>
        {size > 0 ? (
          <SudokuBoard
            level={board}
            size={size}
            marks={session.marks}
            selected={session.selected}
            hint={session.hint}
            shake={shake?.index ?? null}
            shakeNonce={shake?.nonce ?? 0}
            happy={happy}
            onPress={onPress}
          />
        ) : null}
      </View>

      <View style={styles.tools}>
        <IconButton
          icon="refresh"
          label={t('restart')}
          accessibilityLabel={t('restartLevel')}
          disabled={session.lives === 3 && session.marks.every((mark) => mark === 'empty')}
          silent
          onPress={() => {
            if (paused) return;
            replay();
          }}
          size={60}
        />
        <IconButton
          icon="bulb-outline"
          label={t('hintLabel')}
          accessibilityLabel={session.lightbulb <= 0 ? t('watchMoreHint') : t('placeNext')}
          badge={session.lightbulb <= 0 ? t('adBadge') : session.lightbulb}
          silent
          onPress={onLightbulb}
          size={60}
        />
      </View>
    </Screen>
  );
}

function OutOfLivesOverlay({
  onContinue,
  onReplay,
  onHome,
}: {
  onContinue: () => void;
  onReplay: () => void;
  onHome: () => void;
}) {
  const { t } = useI18n();
  const [loadingAd, setLoadingAd] = useState(false);
  const [adError, setAdError] = useState(false);
  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  const watchAd = async () => {
    setAdError(false);
    setLoadingAd(true);
    const rewarded = await rewardedAds.showRewarded();
    if (!mounted.current) return;
    setLoadingAd(false);
    if (rewarded) onContinue();
    else setAdError(true);
  };

  return (
    <OverlayPanel>
      <HeartRow lives={0} />
      <AppText size={28} weight="bold" align="center">
        {t('outOfLives')}
      </AppText>
      <AppText size={15} tone="muted" align="center">
        {t('keepBoard')}
      </AppText>
      <GameButton
        label={loadingAd ? t('loadingAd') : t('continue')}
        caption={loadingAd ? t('videoReady') : t('watchLife')}
        icon="play-circle"
        onPress={watchAd}
        disabled={loadingAd}
        style={styles.full}
      />
      {adError ? (
        <AppText size={13} tone="muted" align="center">
          {t('adNoLife')}
        </AppText>
      ) : null}
      <View style={styles.row}>
        <GameButton label={t('replay')} icon="refresh" variant="secondary" size="sm" onPress={onReplay} disabled={loadingAd} style={styles.half} />
        <GameButton label={t('home')} icon="home" variant="secondary" size="sm" onPress={onHome} disabled={loadingAd} style={styles.half} />
      </View>
    </OverlayPanel>
  );
}

function HeartRow({ lives }: { lives: number }) {
  return (
    <View style={styles.hearts}>
      {[0, 1, 2].map((index) => (
        <Ionicons key={index} name={index < lives ? 'heart' : 'heart-outline'} size={16} color="#F43F5E" />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  hearts: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1, alignItems: 'center', gap: 2 },
  progress: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 28,
    marginTop: spacing.md,
  },
  boardArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tools: { flexDirection: 'row', justifyContent: 'space-evenly' },
  full: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', gap: spacing.md, alignSelf: 'stretch' },
  half: { flex: 1 },
});
