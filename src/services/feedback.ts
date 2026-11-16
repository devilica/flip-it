import { audio, type SoundEffect } from './audio';
import { haptics } from './haptics';

type HapticKind = 'tap' | 'selection' | 'heavy' | 'success' | 'warning';

/** Plays a sound and haptic pulse together; both respect the player's settings. */
export function feedback(sound: SoundEffect | null, haptic: HapticKind | null) {
  if (sound) audio.play(sound);
  if (haptic) haptics[haptic]();
}
