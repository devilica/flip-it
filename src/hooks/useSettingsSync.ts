import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { audio } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { useProgressStore } from '@/store/progressStore';
import { themes } from '@/theme';

/** Pushes persisted settings into the audio, haptics and system UI services. */
export function useSettingsSync(enabled: boolean) {
  const settings = useProgressStore((state) => state.settings);

  useEffect(() => {
    if (!enabled) return;
    haptics.setEnabled(settings.haptics);
    audio.configure({ sound: settings.sound, music: settings.music });
  }, [enabled, settings.haptics, settings.sound, settings.music]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(themes[settings.theme].background).catch(() => {});
  }, [settings.theme]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      audio.setAppActive(state === 'active');
    });
    return () => subscription.remove();
  }, []);
}
