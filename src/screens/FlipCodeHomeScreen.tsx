import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { AppText } from '@/components/ui/AppText';
import { GameButton } from '@/components/ui/GameButton';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { flipCodeDateKey } from '@/flip-code/daily';
import { CODE_MASCOTS } from '@/flip-code/mascots';
import type { Difficulty } from '@/flip-code/types';
import { useTheme } from '@/hooks/useTheme';
import { useI18n, type MessageKey } from '@/i18n';
import { useFlipCodeStore } from '@/store/flipCodeStore';
import { radius, spacing } from '@/theme';

const LEVELS: { id: Difficulty; label: MessageKey; attempts: number }[] = [
  { id: 'medium', label: 'medium', attempts: 8 },
  { id: 'hard', label: 'hard', attempts: 7 },
];

export function FlipCodeHomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useI18n();
  const { height, width } = useWindowDimensions();
  const played = useFlipCodeStore((state) => state.played);
  const won = useFlipCodeStore((state) => state.won);
  const attemptsTotal = useFlipCodeStore((state) => state.attemptsTotal);
  const bestStreak = useFlipCodeStore((state) => state.bestStreak);
  const dailyCleared = useFlipCodeStore((state) => state.dailyCleared);
  const today = useMemo(() => flipCodeDateKey(new Date()), []);
  const doneToday = dailyCleared === today;
  const rate = played === 0 ? 0 : Math.round((won / played) * 100);
  const average = won === 0 ? '—' : (attemptsTotal / won).toFixed(1);
  const compact = height < 720;
  const mascotSize = Math.min(compact ? 84 : 104, Math.floor((width - spacing.lg * 2 - spacing.lg) / 2));

  const play = (difficulty: Difficulty) => {
    router.push({ pathname: '/flip-code/play', params: { difficulty } });
  };

  return (
    <Screen>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <IconButton icon="chevron-back" accessibilityLabel={t('allGames')} onPress={() => router.dismissTo('/')} size={40} soft />
          <View style={styles.topCenter}>
            <View style={[styles.chip, { backgroundColor: theme.surface }]}>
              <Ionicons name="trophy" size={16} color={theme.star} />
              <AppText size={15} weight="semibold">
                {won}
              </AppText>
              <Ionicons name="flame" size={15} color={theme.textMuted} />
              <AppText size={15} weight="semibold">
                {bestStreak}
              </AppText>
            </View>
          </View>
          <IconButton
            icon="settings-sharp"
            accessibilityLabel={t('settings')}
            size={40}
            soft
            onPress={() => router.push('/settings')}
          />
        </View>

        <View style={styles.hero}>
          <Animated.View entering={FadeInDown.springify().damping(14)} style={styles.mascots}>
            {[CODE_MASCOTS.slice(0, 2), CODE_MASCOTS.slice(2)].map((row, rowIndex) => (
              <View key={rowIndex} style={styles.mascotRow}>
                {row.map((mascot) => (
                  <Image
                    key={mascot.id}
                    source={mascot.source}
                    accessibilityLabel={mascot.name}
                    style={{ width: mascotSize, height: mascotSize }}
                    resizeMode="contain"
                  />
                ))}
              </View>
            ))}
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(120).springify().damping(14)}>
            <AppText size={16} tone="muted" align="center">
              {t('crackFour')}
            </AppText>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInUp.delay(200).springify().damping(16)} style={styles.actions}>
          <View style={[styles.stats, { backgroundColor: theme.surface }]}>
            <Stat label={t('played')} value={String(played)} />
            <Stat label={t('won')} value={`${rate}%`} />
            <Stat label={t('average')} value={average} />
            <Stat label={t('streak')} value={String(bestStreak)} />
          </View>
          <AppText size={14} tone="muted" align="center">
            {t('greenMeans')}
          </AppText>
          <GameButton label={t('easy')} caption={t('attempts', { n: 10 })} icon="play" size="lg" onPress={() => play('easy')} />
          {LEVELS.map((level) => (
            <GameButton
              key={level.id}
              label={t(level.label)}
              caption={t('attempts', { n: level.attempts })}
              icon="play"
              variant="secondary"
              onPress={() => play(level.id)}
            />
          ))}
          <GameButton
            label={t('dailyChallenge')}
            caption={doneToday ? t('dailyDone') : t('dailyFreshCode')}
            icon="calendar"
            variant="secondary"
            onPress={() => router.push('/flip-code/daily')}
          />
        </Animated.View>
      </View>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <AppText size={18} weight="bold" align="center">
        {value}
      </AppText>
      <AppText size={11} tone="muted" align="center">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  topCenter: { flex: 1, alignItems: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  mascots: { alignItems: 'center', gap: spacing.xs },
  mascotRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg },
  actions: { gap: spacing.md },
  stats: { flexDirection: 'row', borderRadius: radius.lg, paddingVertical: spacing.md },
  stat: { flex: 1, gap: 2 },
});
