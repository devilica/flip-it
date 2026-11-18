import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Image, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { CodeRules } from '@/components/flip-code/CodeRules';
import { GuessRow } from '@/components/flip-code/GuessRow';
import { MascotPicker } from '@/components/flip-code/MascotPicker';
import { SecretCode } from '@/components/flip-code/SecretCode';
import { HintOfferOverlay } from '@/components/game/HintOfferOverlay';
import { AppText } from '@/components/ui/AppText';
import { GameButton } from '@/components/ui/GameButton';
import { IconButton } from '@/components/ui/IconButton';
import { OverlayPanel } from '@/components/ui/OverlayPanel';
import { Screen } from '@/components/ui/Screen';
import { StarRow } from '@/components/ui/StarRow';
import { flipCodeDateKey, getDailyCode } from '@/flip-code/daily';
import { canSubmit, hintSlot, isLosingBoard, isWinningScore, scoreGuess } from '@/flip-code/feedback';
import { ATTEMPT_LIMIT, createCode, starsForAttempts } from '@/flip-code/generate';
import type { Difficulty, FlipCodeSession, MascotId } from '@/flip-code/types';
import { useI18n, type MessageKey } from '@/i18n';
import { showLevelInterstitial } from '@/services/ads';
import { feedback } from '@/services/feedback';
import { useFlipCodeStore } from '@/store/flipCodeStore';
import { spacing } from '@/theme';

interface FlipCodeScreenProps {
  difficulty: Difficulty;
  daily?: boolean;
}

function freshSession(difficulty: Difficulty, daily: boolean, dateKey: string | null, seed: number): FlipCodeSession {
  return {
    difficulty,
    daily,
    dateKey,
    secret: daily && dateKey ? getDailyCode(keyDate(dateKey)) : createCode(seed, difficulty),
    guesses: [],
    draft: [null, null, null, null],
    seed,
    hintsLeft: 1,
  };
}

function withHints(session: FlipCodeSession): FlipCodeSession {
  return { ...session, hintsLeft: typeof session.hintsLeft === 'number' ? session.hintsLeft : 1 };
}

const EMPTY_SLOTS: (MascotId | null)[] = [null, null, null, null];

function keyDate(key: string): Date {
  const year = Number(key.slice(0, 4));
  const month = Number(key.slice(4, 6)) - 1;
  const day = Number(key.slice(6, 8));
  return new Date(year, month, day);
}

export function FlipCodeScreen({ difficulty, daily = false }: FlipCodeScreenProps) {
  const router = useRouter();
  const { t } = useI18n();
  const { height } = useWindowDimensions();
  const saveSession = useFlipCodeStore((state) => state.saveSession);
  const recordResult = useFlipCodeStore((state) => state.recordResult);
  const today = useMemo(() => flipCodeDateKey(new Date()), []);
  const [session, setSession] = useState<FlipCodeSession>(() => {
    const saved = useFlipCodeStore.getState().session;
    const same =
      saved &&
      saved.daily === daily &&
      saved.difficulty === difficulty &&
      saved.guesses.length < ATTEMPT_LIMIT[saved.difficulty] &&
      (!daily || saved.dateKey === today);
    return same ? withHints(saved) : freshSession(difficulty, daily, daily ? today : null, Date.now());
  });
  const [selected, setSelected] = useState<number | null>(0);
  const [review, setReview] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [hintOffer, setHintOffer] = useState(false);
  const recorded = useRef(false);
  const listRef = useRef<ScrollView>(null);
  const listHeight = useRef(0);
  const rowFrames = useRef<{ y: number; height: number }[]>([]);
  const pendingRow = useRef<number | null>(null);

  const limit = ATTEMPT_LIMIT[session.difficulty];
  const last = session.guesses[session.guesses.length - 1];
  const won = last ? isWinningScore(scoreGuess(session.secret, last)) : false;
  const lost = isLosingBoard(session.guesses.length, limit, won);
  const finished = won || lost;
  const stars = starsForAttempts(session.guesses.length);

  useEffect(() => {
    if (finished) return;
    saveSession(session);
  }, [finished, saveSession, session]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (hintOffer) {
        setHintOffer(false);
        return true;
      }
      if (!rulesOpen) return false;
      setRulesOpen(false);
      return true;
    });
    return () => subscription.remove();
  }, [hintOffer, rulesOpen]);

  useEffect(() => {
    if (!finished || recorded.current) return;
    recorded.current = true;
    feedback(won ? 'win' : 'fail', won ? 'success' : 'warning');
    recordResult(won, session.guesses.length, session.daily, session.dateKey);
  }, [finished, recordResult, session.daily, session.dateKey, session.guesses.length, won]);

  const choose = (id: MascotId) => {
    if (finished || selected === null) return;
    const draft = session.draft.slice();
    draft[selected] = id;
    const next = draft.findIndex((slot) => slot === null);
    setSelected(next === -1 ? selected : next);
    feedback('button', 'selection');
    setSession({ ...session, draft });
  };

  const pressSlot = (index: number) => {
    if (finished) return;
    if (session.draft[index] !== null) {
      const draft = session.draft.slice();
      draft[index] = null;
      feedback('undo', 'tap');
      setSelected(index);
      setSession({ ...session, draft });
      return;
    }
    setSelected(index);
  };

  const useHint = () => {
    if (finished) return;
    if (session.hintsLeft <= 0) {
      setHintOffer(true);
      return;
    }
    const index = hintSlot(session.secret, session.draft, selected);
    if (index === null) return;
    const draft = session.draft.slice();
    draft[index] = session.secret[index];
    const next = draft.findIndex((slot) => slot === null);
    setSelected(next === -1 ? index : next);
    feedback('hint', 'success');
    setSession({ ...session, draft, hintsLeft: session.hintsLeft - 1 });
  };

  const submit = () => {
    if (finished || !canSubmit(session.draft)) return;
    const guess = session.draft as MascotId[];
    const guesses = [...session.guesses, guess];
    feedback('tap', 'tap');
    setSelected(0);
    setSession({ ...session, guesses, draft: [null, null, null, null] });
  };

  const leaving = useRef(false);
  const again = async () => {
    if (leaving.current) return;
    leaving.current = true;
    if (won && !session.daily) await showLevelInterstitial(useFlipCodeStore.getState().won);
    leaving.current = false;
    recorded.current = false;
    setReview(false);
    setHintOffer(false);
    setSelected(0);
    const dateKey = daily ? today : null;
    setSession(freshSession(session.difficulty, daily, dateKey, daily ? Number(today) : Date.now()));
  };

  const focusRow = finished ? session.guesses.length - 1 : session.guesses.length;

  const scrollToRow = (index: number) => {
    const frame = rowFrames.current[index];
    const view = listHeight.current;
    if (!frame || view <= 0) {
      pendingRow.current = index;
      return;
    }
    pendingRow.current = null;
    const y = Math.max(0, frame.y + frame.height - view + spacing.md);
    listRef.current?.scrollTo({ y, animated: true });
  };

  useEffect(() => {
    if (focusRow >= 6) {
      scrollToRow(focusRow);
      return;
    }
    if (focusRow === 0) {
      pendingRow.current = null;
      listRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [focusRow]);

  const title = daily ? t('daily') : t(session.difficulty as MessageKey);
  const left = limit - session.guesses.length;

  return (
    <Screen
      overlay={
        hintOffer ? (
          <HintOfferOverlay
            hints={1}
            onGrant={() => {
              setSession((current) => ({ ...current, hintsLeft: current.hintsLeft + 1 }));
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
            <ScrollView
              style={{ maxHeight: Math.min(height * 0.58, 520), alignSelf: 'stretch' }}
              contentContainerStyle={styles.rules}
              showsVerticalScrollIndicator={false}
            >
              <CodeRules />
            </ScrollView>
            <GameButton label={t('gotIt')} onPress={() => setRulesOpen(false)} style={styles.full} />
          </OverlayPanel>
        ) : won && !review ? (
          <OverlayPanel>
            <AppText size={28} weight="bold" align="center">
              {t('codeCracked')}
            </AppText>
            <AppText size={15} tone="muted" align="center">
              {session.guesses.length === 1 ? t('solvedAttempt') : t('solvedAttempts', { n: session.guesses.length })}
            </AppText>
            <StarRow count={stars} size={28} animated />
            <GameButton label={t('playAgain')} icon="refresh" onPress={again} style={styles.full} />
            <View style={styles.row}>
              <GameButton
                label={t('review')}
                variant="secondary"
                size="sm"
                leading={<Image source={require('../assets/images/maskota.png')} style={styles.reviewMascot} resizeMode="contain" />}
                onPress={() => setReview(true)}
                style={styles.half}
              />
              <GameButton label={t('home')} icon="home" variant="secondary" size="sm" onPress={() => router.dismissTo('/flip-code')} style={styles.half} />
            </View>
          </OverlayPanel>
        ) : undefined
      }
    >
      <View style={styles.header}>
        <IconButton icon="chevron-back" accessibilityLabel={t('flipCodeHome')} onPress={() => router.back()} size={44} />
        <View style={styles.title}>
          <AppText size={22} weight="bold" align="center">
            {title}
          </AppText>
          <AppText size={13} tone="muted" align="center">
            {left === 1 ? t('attemptLeft') : t('attemptsLeft', { n: left })}
          </AppText>
        </View>
        <IconButton icon="help-circle" accessibilityLabel={t('howToPlay')} onPress={() => setRulesOpen(true)} size={44} />
      </View>

      <ScrollView
        ref={listRef}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onLayout={(event) => {
          listHeight.current = event.nativeEvent.layout.height;
          if (pendingRow.current !== null) scrollToRow(pendingRow.current);
        }}
      >
        {Array.from({ length: limit }, (_, index) => {
          const guess = session.guesses[index];
          const current = !finished && index === session.guesses.length;
          return (
            <View
              key={`row-${index}`}
              onLayout={(event) => {
                const { y, height: rowHeight } = event.nativeEvent.layout;
                rowFrames.current[index] = { y, height: rowHeight };
                if (pendingRow.current === index) scrollToRow(index);
              }}
            >
              <GuessRow
                slots={guess ?? (current ? session.draft : EMPTY_SLOTS)}
                pegs={guess ? scoreGuess(session.secret, guess) : null}
                active={current}
                selectedIndex={current ? selected : null}
                onPressSlot={current ? pressSlot : () => {}}
              />
            </View>
          );
        })}
      </ScrollView>

      {lost ? (
        <View style={styles.secret}>
          <AppText size={14} tone="muted" align="center">
            {t('notThisTime')}
          </AppText>
          <SecretCode secret={session.secret} revealed />
        </View>
      ) : null}

      {finished || selected === null ? null : (
        <MascotPicker onPick={choose} onHint={useHint} hintsLeft={session.hintsLeft} />
      )}

      {finished ? (
        <GameButton label={won ? t('playAgain') : t('retry')} icon="refresh" onPress={again} />
      ) : (
        <GameButton label={t('submit')} icon="checkmark" disabled={!canSubmit(session.draft)} onPress={submit} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1, alignItems: 'center' },
  list: { flex: 1 },
  listContent: { gap: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.md },
  secret: { gap: spacing.sm, marginBottom: spacing.xl },
  rules: { paddingBottom: spacing.xs },
  full: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', gap: spacing.md, alignSelf: 'stretch' },
  half: { flex: 1 },
  reviewMascot: { width: 22, height: 22 },
});
