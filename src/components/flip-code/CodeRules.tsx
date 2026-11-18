import { Image, StyleSheet, View } from 'react-native';

import { FeedbackIndicators } from '@/components/flip-code/FeedbackIndicators';
import { AppText } from '@/components/ui/AppText';
import { scoreGuess } from '@/flip-code/feedback';
import { mascotById } from '@/flip-code/mascots';
import type { MascotId } from '@/flip-code/types';
import { useTheme } from '@/hooks/useTheme';
import { useI18n, type MessageKey } from '@/i18n';
import { radius, spacing } from '@/theme';

/** One secret for every example, so the dots can be compared. Green is absent, and purple repeats. */
const SECRET: MascotId[] = [0, 1, 2, 0];

const EXAMPLES: { title: MessageKey; guess: MascotId[]; caption: MessageKey }[] = [
  { title: 'solvedTitle', guess: [0, 1, 2, 0], caption: 'solvedCaption' },
  { title: 'rightPlaceTitle', guess: [3, 3, 3, 0], caption: 'rightPlaceCaption' },
  { title: 'wrongPlaceTitle', guess: [1, 0, 0, 2], caption: 'wrongPlaceCaption' },
];

function MascotRow({ slots }: { slots: MascotId[] }) {
  const theme = useTheme();
  return (
    <View style={styles.slots}>
      {slots.map((id, index) => {
        const mascot = mascotById(id);
        return (
          <View key={index} style={[styles.slot, { backgroundColor: theme.surfaceStrong }]}>
            <Image source={mascot.source} accessibilityLabel={mascot.name} style={styles.image} resizeMode="contain" />
          </View>
        );
      })}
    </View>
  );
}

/** Visual how-to-play examples: the secret, a solve, a right place, and a wrong place. */
export function CodeRules() {
  const { t } = useI18n();
  return (
    <View style={styles.wrap}>
      <AppText size={15} tone="muted" align="center">
        {t('findSecret')}
      </AppText>

      <View style={styles.block}>
        <AppText size={14} weight="bold" align="center">
          {t('secretTitle')}
        </AppText>
        <View style={styles.guess}>
          <MascotRow slots={SECRET} />
          <View style={styles.pegGap} />
        </View>
      </View>

      {EXAMPLES.map((example) => (
        <View key={example.title} style={styles.block}>
          <AppText size={14} weight="bold" align="center">
            {t(example.title)}
          </AppText>
          <View style={styles.guess}>
            <MascotRow slots={example.guess} />
            <FeedbackIndicators pegs={scoreGuess(SECRET, example.guess)} />
          </View>
          <AppText size={13} tone="muted" align="center">
            {t(example.caption)}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', gap: spacing.md },
  block: { alignSelf: 'stretch', gap: spacing.xs },
  guess: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  slots: { flexDirection: 'row', gap: 6 },
  slot: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: 32, height: 32 },
  pegGap: { width: 28 },
});
