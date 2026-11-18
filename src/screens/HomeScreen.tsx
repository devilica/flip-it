import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { LogoMark } from '@/components/home/LogoMark';
import { FlipTutorial } from '@/components/tutorial/FlipTutorial';
import { AppText } from '@/components/ui/AppText';
import { GameButton } from '@/components/ui/GameButton';
import { IconButton } from '@/components/ui/IconButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { StarRow } from '@/components/ui/StarRow';
import { toDateKey, TOTAL_LEVELS } from '@/game/levels';
import { useTheme } from '@/hooks/useTheme';
import { useI18n } from '@/i18n';
import { completedCount, totalStars } from '@/store/progressModel';
import { useProgressStore } from '@/store/progressStore';
import { radius, spacing } from '@/theme';

export function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useI18n();
  const { height } = useWindowDimensions();

  const unlockedLevel = useProgressStore((state) => state.unlockedLevel);
  const stars = useProgressStore((state) => state.stars);
  const daily = useProgressStore((state) => state.daily);
  const tutorialSeen = useProgressStore((state) => state.tutorialSeen);
  const markTutorialSeen = useProgressStore((state) => state.markTutorialSeen);

  const dateKey = useMemo(() => toDateKey(new Date()), []);
  const todaysDaily = daily[dateKey];
  const completed = completedCount({ stars });
  const starTotal = totalStars({ stars });
  const playLevel = Math.min(unlockedLevel, TOTAL_LEVELS);
  const compact = height < 720;

  return (
    <Screen overlay={tutorialSeen ? undefined : <FlipTutorial onDone={markTutorialSeen} />}>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <IconButton icon="chevron-back" accessibilityLabel={t('allGames')} onPress={() => router.dismissTo('/')} size={40} soft />
          <View style={styles.topCenter}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('levels')}
              onPress={() => router.push('/levels')}
              style={[styles.chip, { backgroundColor: theme.surface }]}
            >
              <Ionicons name="star" size={16} color={theme.star} />
              <AppText size={15} weight="semibold">
                {starTotal}
              </AppText>
              <Ionicons name="trophy" size={15} color={theme.textMuted} />
              <AppText size={15} weight="semibold">
                {completed}/{TOTAL_LEVELS}
              </AppText>
            </Pressable>
          </View>
          <IconButton
            icon="settings-sharp"
            accessibilityLabel={t('settings')}
            size={40}
            soft
            onPress={() => router.push('/settings')}
          />
        </View>

        <View style={[styles.hero, compact && styles.heroCompact]}>
          <LogoMark boardSize={compact ? 96 : 124} />
          <AppText size={16} tone="muted" align="center">
            {t('flipTagline')}
          </AppText>
        </View>

        <Animated.View entering={FadeInUp.delay(200).springify().damping(16)} style={styles.actions}>
          <View style={[styles.progressCard, { backgroundColor: theme.surface }]}>
            <View style={styles.progressHeader}>
              <AppText size={13} weight="semibold" tone="subtle">
                {t('currentLevel').toLocaleUpperCase()}
              </AppText>
              <AppText size={13} weight="semibold" tone="muted">
                {t('percentComplete', { n: Math.round((completed / TOTAL_LEVELS) * 100) })}
              </AppText>
            </View>
            <AppText size={28} weight="bold">
              {t('levelN', { n: playLevel })}
            </AppText>
            <ProgressBar value={completed / TOTAL_LEVELS} height={8} />
          </View>

          <GameButton
            label={t('play')}
            caption={t('levelN', { n: playLevel })}
            captionPosition="beside"
            icon="play"
            size="lg"
            onPress={() => router.push(`/play/${playLevel}`)}
          />

          <GameButton
            label={t('dailyChallenge')}
            caption={todaysDaily ? t('dailyDone') : t('dailyFresh')}
            icon="calendar"
            variant="secondary"
            onPress={() => router.push('/daily')}
            trailing={todaysDaily ? <StarRow count={todaysDaily.stars} size={14} /> : null}
          />
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, justifyContent: 'space-between' },
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
  hero: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  heroCompact: { paddingVertical: spacing.sm },
  actions: { gap: spacing.md },
  progressCard: { borderRadius: radius.lg, padding: spacing.lg, gap: 6 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
});
