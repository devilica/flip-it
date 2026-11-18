import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StarRow } from '@/components/ui/StarRow';
import { UNLOCK_ALL_LEVELS } from '@/config/dev';
import { useTheme } from '@/hooks/useTheme';
import { useI18n } from '@/i18n';
import { feedback } from '@/services/feedback';
import { SUDOKU_LEVEL_COUNT } from '@/sudoku/levels';
import { useSudokuStore } from '@/store/sudokuStore';
import { radius, spacing } from '@/theme';

const levels = Array.from({ length: SUDOKU_LEVEL_COUNT }, (_, index) => index + 1);

export function SudokuLevelSelectScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useI18n();
  const unlocked = useSudokuStore((state) => state.unlockedLevel);
  const stars = useSudokuStore((state) => state.stars);

  return (
    <Screen>
      <ScreenHeader title={t('levels')} onBack={() => router.back()} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {levels.map((level) => {
          const earned = stars[String(level)];
          const open = UNLOCK_ALL_LEVELS || level <= unlocked;
          return (
            <Pressable
              key={level}
              accessibilityRole="button"
              accessibilityLabel={open ? t('levelN', { n: level }) : t('levelLocked', { n: level })}
              accessibilityState={{ disabled: !open }}
              disabled={!open}
              onPress={() => {
                feedback('button', 'selection');
                router.push(`/sudoku/${level}`);
              }}
              style={[
                styles.cell,
                { backgroundColor: open ? theme.surfaceStrong : theme.surface },
                level === unlocked && styles.current,
              ]}
            >
              {open ? (
                <AppText size={16} weight="bold">
                  {level}
                </AppText>
              ) : (
                <Ionicons name="lock-closed" size={18} color={theme.textSubtle} />
              )}
              <View style={styles.stars}>{earned !== undefined ? <StarRow count={earned} size={12} /> : null}</View>
            </Pressable>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingBottom: spacing.lg },
  cell: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  current: {
    borderWidth: 2,
    borderColor: '#4ADE80',
  },
  stars: { height: 16, marginTop: 2 },
});
