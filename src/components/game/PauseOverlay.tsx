import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { GameButton } from '@/components/ui/GameButton';
import { OverlayPanel } from '@/components/ui/OverlayPanel';
import { ToggleRow } from '@/components/ui/ToggleRow';
import { useProgressStore } from '@/store/progressStore';
import { spacing } from '@/theme';

interface PauseOverlayProps {
  onResume: () => void;
  onRestart: () => void;
  onLevels: () => void;
  onHome: () => void;
}

export function PauseOverlay({ onResume, onRestart, onLevels, onHome }: PauseOverlayProps) {
  const settings = useProgressStore((state) => state.settings);
  const updateSettings = useProgressStore((state) => state.updateSettings);

  return (
    <OverlayPanel>
      <AppText size={30} weight="bold">
        Paused
      </AppText>
      <View style={styles.toggles}>
        <ToggleRow compact icon="volume-high" label="Sound" value={settings.sound} onChange={(sound) => updateSettings({ sound })} />
        <ToggleRow compact icon="musical-notes" label="Music" value={settings.music} onChange={(music) => updateSettings({ music })} />
        <ToggleRow compact icon="phone-portrait" label="Vibration" value={settings.haptics} onChange={(haptics) => updateSettings({ haptics })} />
      </View>
      <GameButton label="Resume" icon="play" onPress={onResume} style={styles.full} />
      <GameButton label="Restart" icon="refresh" variant="secondary" onPress={onRestart} style={styles.full} />
      <View style={styles.row}>
        <GameButton label="Levels" icon="grid" variant="secondary" size="sm" onPress={onLevels} style={styles.half} />
        <GameButton label="Home" icon="home" variant="secondary" size="sm" onPress={onHome} style={styles.half} />
      </View>
    </OverlayPanel>
  );
}

const styles = StyleSheet.create({
  toggles: { alignSelf: 'stretch', marginBottom: spacing.sm },
  full: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', gap: spacing.md, alignSelf: 'stretch' },
  half: { flex: 1 },
});
