import * as SystemUI from 'expo-system-ui';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';

import { audio } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { useProgressStore } from '@/store/progressStore';
import { darkTheme, lightTheme } from '@/theme';
import { setThemeProgress, themeProgress } from '@/theme/blend';

/** Pushes persisted settings into the audio, haptics and system UI services. */
function paintSystemBackground(light: boolean) {
  const background = light ? lightTheme.background : darkTheme.background;
  SystemUI.setBackgroundColorAsync(background).catch(() => {});
}

export function useSettingsSync(enabled: boolean) {
  const settings = useProgressStore((state) => state.settings);
  const skipBlend = useRef(true);
  if (enabled && skipBlend.current) {
    themeProgress.value = settings.theme === 'light' ? 1 : 0;
  }

  useEffect(() => {
    if (!enabled) return;
    haptics.setEnabled(settings.haptics);
    audio.configure({ sound: settings.sound, music: settings.music });
  }, [enabled, settings.haptics, settings.sound, settings.music]);

  useEffect(() => {
    if (!enabled) return;
    setThemeProgress(settings.theme, !skipBlend.current);
    skipBlend.current = false;
  }, [enabled, settings.theme]);

  useAnimatedReaction(
    () => themeProgress.value >= 0.5,
    (light, previous) => {
      if (previous == null || light !== previous) runOnJS(paintSystemBackground)(light);
    },
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      audio.setAppActive(state === 'active');
    });
    return () => subscription.remove();
  }, []);
}
