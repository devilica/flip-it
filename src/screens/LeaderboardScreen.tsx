import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { AppText } from '@/components/ui/AppText';
import { GameButton } from '@/components/ui/GameButton';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { useTheme } from '@/hooks/useTheme';
import { useI18n, type MessageKey } from '@/i18n';
import { GAME_MODES, type GameMode } from '@/play-games/leaderboards';
import { signedOutStatus, type PlayGamesStatus, type RankSpan, type ScoreEntry, type ScorePage } from '@/play-games/native';
import { connectPlayGames, loadLeaderboard, openNativeLeaderboard, playGamesAvailable, playGamesStatus } from '@/play-games/service';
import { showLeaderboardInterstitial } from '@/services/ads';
import { palette, radius, spacing } from '@/theme';

const MODE_LABEL: Record<GameMode, MessageKey> = {
  'flip-it': 'flipName',
  'flip-sudoku': 'sudokuName',
  'flip-code': 'codeName',
};

const SPANS: { id: RankSpan; label: MessageKey }[] = [
  { id: 'daily', label: 'dailyRank' },
  { id: 'weekly', label: 'weeklyRank' },
  { id: 'all', label: 'allTimeRank' },
];

const MEDALS = ['#FCD34D', '#E5E7EB', '#D97706'];

function gameModeFrom(value: string | string[] | undefined): GameMode | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return GAME_MODES.includes(raw as GameMode) ? (raw as GameMode) : null;
}

export function LeaderboardScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ mode?: string }>();
  const requested = gameModeFrom(params.mode);
  const [mode, setMode] = useState<GameMode>(requested ?? 'flip-it');
  const shown = requested ?? mode;
  const [span, setSpan] = useState<RankSpan>('all');
  const [status, setStatus] = useState<PlayGamesStatus>(signedOutStatus);
  const [page, setPage] = useState<ScorePage | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const available = playGamesAvailable();

  const refresh = useCallback(() => {
    playGamesStatus()
      .then(setStatus)
      .catch(() => setStatus(signedOutStatus()));
  }, []);

  useEffect(() => {
    if (requested) setMode(requested);
  }, [requested]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
        showLeaderboardInterstitial().catch(() => {});
      }, 0);
      return () => clearTimeout(timer);
    }, []),
  );

  useEffect(() => {
    if (!status.authenticated) {
      setPage(null);
      return undefined;
    }
    let alive = true;
    setLoading(true);
    setFailed(false);
    loadLeaderboard(shown, span).then((next) => {
      if (!alive) return;
      setLoading(false);
      if (!next) {
        setPage(null);
        setFailed(true);
        return;
      }
      setPage(next);
    });
    return () => {
      alive = false;
    };
  }, [shown, span, status.authenticated]);

  const signIn = () => {
    setSigningIn(true);
    connectPlayGames()
      .then(setStatus)
      .catch(() => setStatus(signedOutStatus()))
      .finally(() => setSigningIn(false));
  };

  const player = page?.player;

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton
          icon="chevron-back"
          accessibilityLabel={requested ? t('back') : t('allGames')}
          onPress={() => (requested ? router.back() : router.dismissTo('/'))}
          size={40}
          soft
        />
        <AppText size={22} weight="bold" numberOfLines={1} align="center" style={styles.title}>
          {t(requested ? MODE_LABEL[requested] : 'leaderboards')}
        </AppText>
        <View style={styles.headerGap} />
      </View>

      {requested ? null : (
        <View style={styles.chips}>
          {GAME_MODES.map((item) => (
            <Chip key={item} label={t(MODE_LABEL[item])} selected={item === shown} onPress={() => setMode(item)} />
          ))}
        </View>
      )}
      <View style={styles.chips}>
        {SPANS.map((item) => (
          <Chip key={item.id} label={t(item.label)} selected={item.id === span} onPress={() => setSpan(item.id)} />
        ))}
      </View>

      {!available ? (
        <AppText tone="muted" align="center">
          {t('playGamesUnavailable')}
        </AppText>
      ) : !status.authenticated ? (
        <View style={styles.notice}>
          <AppText tone="muted" align="center">
            {t('signInForRanks')}
          </AppText>
          <GameButton label={t('signInPlayGames')} icon="logo-google" onPress={signIn} disabled={signingIn} />
        </View>
      ) : (
        <View style={[styles.you, { backgroundColor: theme.surfaceStrong }]}>
          <Avatar uri={status.iconUri} />
          <View style={styles.youText}>
            <AppText weight="bold">{status.displayName ?? t('yourRank')}</AppText>
            <AppText size={13} tone="muted">
              {t('yourRank')}
            </AppText>
          </View>
          <AppText size={22} weight="bold" color={palette.gold}>
            {player ? `#${player.rank}` : '—'}
          </AppText>
        </View>
      )}

      <ScrollView style={styles.list} contentContainerStyle={styles.rows} showsVerticalScrollIndicator={false}>
        {failed ? (
          <AppText tone="muted" align="center">
            {t('leaderboardFailed')}
          </AppText>
        ) : null}
        {!failed && status.authenticated && !loading && page && page.entries.length === 0 ? (
          <AppText tone="muted" align="center">
            {t('leaderboardEmpty')}
          </AppText>
        ) : null}
        {page?.entries.map((entry, index) => (
          <ScoreRow key={`${entry.playerId}-${entry.rank}`} entry={entry} index={index} />
        ))}
      </ScrollView>

      {available && status.authenticated ? (
        <GameButton
          label={t('openPlayGames')}
          icon="open-outline"
          variant="secondary"
          onPress={() => {
            openNativeLeaderboard(shown, span)
              .then((opened) => {
                if (!opened) setFailed(true);
              })
              .catch(() => setFailed(true));
          }}
        />
      ) : null}
    </Screen>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, { backgroundColor: selected ? palette.purple : theme.surface }]}
    >
      <AppText size={13} weight="semibold" color={selected ? palette.white : theme.text} numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

function ScoreRow({ entry, index }: { entry: ScoreEntry; index: number }) {
  const theme = useTheme();
  const medal = MEDALS[entry.rank - 1];
  return (
    <Animated.View
      entering={FadeInUp.delay(Math.min(index, 8) * 40).springify().damping(16)}
      style={[
        styles.row,
        {
          backgroundColor: theme.surfaceStrong,
          borderColor: entry.currentPlayer ? palette.blue : 'transparent',
        },
      ]}
    >
      <View style={[styles.medal, { backgroundColor: medal ?? theme.surface }]}>
        <AppText size={13} weight="bold" color={medal ? palette.navy : theme.text}>
          {entry.rank}
        </AppText>
      </View>
      <Avatar uri={entry.iconUri} />
      <AppText style={styles.name} numberOfLines={1} weight={entry.currentPlayer ? 'bold' : 'medium'}>
        {entry.displayName}
      </AppText>
      <AppText weight="bold">{entry.score}</AppText>
    </Animated.View>
  );
}

function Avatar({ uri }: { uri: string | null }) {
  const theme = useTheme();
  if (!uri) return <View style={[styles.avatar, { backgroundColor: theme.surface }]} />;
  return <Image source={{ uri }} style={styles.avatar} />;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { flex: 1 },
  headerGap: { width: 40 },
  chips: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  chip: { flex: 1, borderRadius: radius.pill, paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, alignItems: 'center' },
  notice: { gap: spacing.md, marginTop: spacing.lg },
  you: {
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  youText: { flex: 1 },
  list: { flex: 1, marginTop: spacing.md },
  rows: { gap: spacing.sm, paddingBottom: spacing.md },
  row: {
    borderRadius: radius.lg,
    borderWidth: 2,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  medal: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  name: { flex: 1 },
});
