import * as Haptics from 'expo-haptics';

let enabled = true;

const run = (effect: () => Promise<void>) => {
  if (!enabled) return;
  effect().catch(() => {});
};

export const haptics = {
  setEnabled(value: boolean) {
    enabled = value;
  },
  tap: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  selection: () => run(() => Haptics.selectionAsync()),
  heavy: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};
