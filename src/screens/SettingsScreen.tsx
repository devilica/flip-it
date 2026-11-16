import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { FlipTutorial } from '@/components/tutorial/FlipTutorial';
import { AppText } from '@/components/ui/AppText';
import { GameButton } from '@/components/ui/GameButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ToggleRow } from '@/components/ui/ToggleRow';
import { feedback } from '@/services/feedback';
import { useProgressStore } from '@/store/progressStore';
import { spacing } from '@/theme';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText size={13} weight="semibold" tone="subtle" style={styles.sectionTitle}>
        {title}
      </AppText>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

export function SettingsScreen() {
  const router = useRouter();
  const settings = useProgressStore((state) => state.settings);
  const updateSettings = useProgressStore((state) => state.updateSettings);
  const resetProgress = useProgressStore((state) => state.resetProgress);
  const [tutorialOpen, setTutorialOpen] = useState(false);

  const confirmReset = () => {
    Alert.alert(
      'Reset progress?',
      'This deletes all solved levels, stars, best scores and daily results. Settings are kept. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetProgress();
            feedback(null, 'warning');
          },
        },
      ],
    );
  };

  return (
    <Screen overlay={tutorialOpen ? <FlipTutorial onDone={() => setTutorialOpen(false)} /> : undefined}>
      <ScreenHeader title="Settings" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Section title="AUDIO">
          <ToggleRow icon="volume-high" label="Sound effects" value={settings.sound} onChange={(sound) => updateSettings({ sound })} />
          <ToggleRow icon="musical-notes" label="Music" value={settings.music} onChange={(music) => updateSettings({ music })} />
        </Section>
        <Section title="FEEL">
          <ToggleRow icon="phone-portrait" label="Vibration" value={settings.haptics} onChange={(haptics) => updateSettings({ haptics })} />
        </Section>
        <Section title="APPEARANCE">
          <ToggleRow
            icon={settings.theme === 'dark' ? 'moon' : 'sunny'}
            label="Dark theme"
            value={settings.theme === 'dark'}
            onChange={(dark) => updateSettings({ theme: dark ? 'dark' : 'light' })}
          />
        </Section>
        <Section title="HOW TO PLAY">
          <GameButton
            label="How to play"
            icon="help-circle"
            variant="secondary"
            onPress={() => setTutorialOpen(true)}
          />
        </Section>
        <Section title="DATA">
          <GameButton label="Reset progress" icon="trash" variant="danger" onPress={confirmReset} />
        </Section>
        <AppText size={13} tone="subtle" align="center" style={styles.footer}>
          FLIP IT! 1.0 · Plays fully offline · Progress is saved on this device
        </AppText>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.xl, paddingBottom: spacing.xl },
  section: { gap: spacing.sm },
  sectionTitle: { marginLeft: spacing.xs },
  sectionBody: { gap: spacing.sm },
  footer: { marginTop: spacing.md },
});
