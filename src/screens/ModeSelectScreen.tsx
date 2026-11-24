import { useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { LogoMark } from '@/components/home/LogoMark';
import { FlipMascot } from '@/components/mascot/FlipMascot';
import { AppText } from '@/components/ui/AppText';
import { IconButton } from '@/components/ui/IconButton';
import { LeaderboardButton } from '@/components/ui/LeaderboardButton';
import { Screen } from '@/components/ui/Screen';
import { CODE_MASCOTS } from '@/flip-code/mascots';
import { useTheme } from '@/hooks/useTheme';
import { useI18n } from '@/i18n';
import { radius, spacing } from '@/theme';

export function ModeSelectScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useI18n();

  return (
    <Screen>
      <View style={styles.top}>
        <AppText size={28} weight="bold">
          {t('chooseGame')}
        </AppText>
        <View style={styles.actions}>
          <LeaderboardButton size={44} />
          <IconButton icon="settings-sharp" accessibilityLabel={t('settings')} onPress={() => router.push('/settings')} size={44} soft />
        </View>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.cards} showsVerticalScrollIndicator={false}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="FLIP IT!"
          onPress={() => router.push('/flip')}
          style={[styles.card, { backgroundColor: theme.surfaceStrong }]}
        >
          <LogoMark boardSize={64} titleSize={26} />
          <AppText size={14} tone="muted" align="center">
            {t('flipTagline')}
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="FLIP SUDOKU"
          onPress={() => router.push('/sudoku')}
          style={[styles.card, { backgroundColor: theme.surfaceStrong }]}
        >
          <FlipMascot state="idle" size={58} />
          <AppText size={20} weight="bold" align="center">
            {t('sudokuName')}
          </AppText>
          <AppText size={14} tone="muted" align="center">
            {t('sudokuTagline')}
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="FLIP CODE"
          onPress={() => router.push('/flip-code')}
          style={[styles.card, { backgroundColor: theme.surfaceStrong }]}
        >
          <View style={styles.codeRow}>
            {CODE_MASCOTS.map((mascot) => (
              <Image key={mascot.id} source={mascot.source} style={styles.codeMascot} resizeMode="contain" />
            ))}
          </View>
          <AppText size={20} weight="bold" align="center">
            {t('codeName')}
          </AppText>
          <AppText size={14} tone="muted" align="center">
            {t('codeTagline')}
          </AppText>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  scroll: { flex: 1 },
  cards: { flexGrow: 1, gap: spacing.lg, paddingVertical: spacing.xl },
  card: {
    flex: 1,
    minHeight: 164,
    justifyContent: 'center',
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  codeRow: { flexDirection: 'row', gap: spacing.sm },
  codeMascot: { width: 56, height: 56 },
});
