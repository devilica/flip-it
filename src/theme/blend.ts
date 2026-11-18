import { Easing, makeMutable, withTiming } from 'react-native-reanimated';

import type { ThemeName } from '@/store/progressModel';

/** 0 is the dark theme, 1 is the light theme. */
export const themeProgress = makeMutable(0);

const blendTiming = { duration: 300, easing: Easing.inOut(Easing.cubic) };

export function setThemeProgress(theme: ThemeName, animate: boolean) {
  const target = theme === 'light' ? 1 : 0;
  themeProgress.value = animate ? withTiming(target, blendTiming) : target;
}
