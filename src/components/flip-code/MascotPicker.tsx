import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { AppText } from '@/components/ui/AppText';
import { CODE_MASCOTS } from '@/flip-code/mascots';
import type { MascotId } from '@/flip-code/types';
import { useTheme } from '@/hooks/useTheme';
import { useI18n } from '@/i18n';
import { palette, radius, spacing } from '@/theme';

interface MascotPickerProps {
  onPick: (id: MascotId) => void;
  onHint: () => void;
  hintsLeft: number;
}

export function MascotPicker({ onPick, onHint, hintsLeft }: MascotPickerProps) {
  const theme = useTheme();
  const { t } = useI18n();
  return (
    <Animated.View entering={FadeInUp.springify().damping(16)} style={[styles.panel, { backgroundColor: theme.surfaceStrong }]}>
      <View style={styles.row}>
        {CODE_MASCOTS.map((mascot) => (
          <Pressable
            key={mascot.id}
            accessibilityRole="button"
            accessibilityLabel={mascot.name}
            onPress={() => onPick(mascot.id)}
            style={[styles.choice, { backgroundColor: theme.surface }]}
          >
            <Image source={mascot.source} style={styles.image} resizeMode="contain" />
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={hintsLeft > 0 ? t('hintLeft', { n: hintsLeft }) : t('watchMoreHint')}
          onPress={onHint}
          style={[styles.choice, styles.hint, { backgroundColor: theme.surface }]}
        >
          <Ionicons name="bulb-outline" size={26} color={theme.text} />
          <AppText size={11} tone="muted">
            {t('hintLabel')}
          </AppText>
          <View style={styles.badge}>
            <AppText size={11} weight="bold" color="#FFFFFF">
              {hintsLeft > 0 ? hintsLeft : t('adBadge')}
            </AppText>
          </View>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: { borderRadius: radius.lg, padding: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  choice: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  hint: { borderColor: palette.purple },
  image: { width: '86%', height: '86%' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 26,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: radius.pill,
    backgroundColor: palette.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
