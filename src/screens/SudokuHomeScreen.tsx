import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { FlipMascot } from '@/components/mascot/FlipMascot';
import { SudokuRulesCard } from '@/components/sudoku/SudokuRulesCard';
import { AppText } from '@/components/ui/AppText';
import { GameButton } from '@/components/ui/GameButton';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { useTheme } from '@/hooks/useTheme';
import { useI18n } from '@/i18n';
import { sudokuDateKey } from '@/sudoku/daily';
import { SUDOKU_LEVEL_COUNT } from '@/sudoku/levels';
import { useSudokuStore } from '@/store/sudokuStore';
import { radius, spacing } from '@/theme';

export function SudokuHomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useI18n();
  const { height } = useWindowDimensions();
  const unlocked = useSudokuStore((state) => state.unlockedLevel);
  const stars = useSudokuStore((state) => state.stars);
  const dailyCleared = useSudokuStore((state) => state.dailyCleared);
  const today = useMemo(() => sudokuDateKey(new Date()), []);
  const earned = Object.values(stars).reduce((sum, value) => sum + value, 0);
  const solved = Object.keys(stars).length;
  const doneToday = dailyCleared === today;
  const compact = height < 720;

  return (
    <Screen>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <IconButton icon="chevron-back" accessibilityLabel={t('allGames')} onPress={() => router.dismissTo('/')} size={40} soft />
          <View style={styles.topCenter}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('levels')}
              onPress={() => router.push('/sudoku/levels')}
              style={[styles.chip, { backgroundColor: theme.surface }]}
            >
              <Ionicons name="star" size={16} color={theme.star} />
              <AppText size={15} weight="semibold">
                {earned}
              </AppText>
              <Ionicons name="trophy" size={15} color={theme.textMuted} />
              <AppText size={15} weight="semibold">
                {solved}/{SUDOKU_LEVEL_COUNT}
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

        <View style={styles.hero}>
          <Animated.View entering={FadeInDown.springify().damping(14)}>
            <FlipMascot state="thinking" size={compact ? 168 : 220} />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(120).springify().damping(14)}>
            <AppText size={16} tone="muted" align="center">
              {t('sudokuTagline')}
            </AppText>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInUp.delay(200).springify().damping(16)} style={styles.actions}>
          <SudokuRulesCard />
          <GameButton
            label={t('play')}
            caption={t('levelN', { n: Math.min(unlocked, SUDOKU_LEVEL_COUNT) })}
            captionPosition="beside"
            icon="play"
            size="lg"
            onPress={() => router.push(`/sudoku/${Math.min(unlocked, SUDOKU_LEVEL_COUNT)}`)}
          />
          <GameButton
            label={t('dailyChallenge')}
            caption={doneToday ? t('dailyDone') : t('dailyFresh')}
            icon="calendar"
            variant="secondary"
            onPress={() => router.push('/sudoku/daily')}
          />
        </Animated.View>
      </View>
    </Screen>
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
  actions: { gap: spacing.md },
});
