import { createAudioPlayer, setAudioModeAsync, type AudioPlayer, type AudioSource } from 'expo-audio';

/**
 * Sound files live in src/assets/audio. They are original audio synthesized by
 * scripts/generate-audio.js. Replace a file (same name) to use your own recording.
 */
const effectSources = {
  tap: require('../assets/audio/tap.wav'),
  undo: require('../assets/audio/undo.wav'),
  hint: require('../assets/audio/hint.wav'),
  button: require('../assets/audio/button.wav'),
  win: require('../assets/audio/win.wav'),
  star: require('../assets/audio/star.wav'),
  fail: require('../assets/audio/fail.wav'),
} satisfies Record<string, AudioSource>;

const musicSource: AudioSource = require('../assets/audio/music.wav');

export type SoundEffect = keyof typeof effectSources;

const MUSIC_VOLUME = 0.35;

class AudioService {
  private effects = new Map<SoundEffect, AudioPlayer>();
  private music: AudioPlayer | null = null;
  private soundEnabled = true;
  private musicEnabled = true;
  private appActive = true;
  private initialized = false;
  /** Resolves once the native audio mode is applied. play() is ignored before that. */
  private ready: Promise<void> = Promise.resolve();

  init() {
    if (this.initialized) return;
    this.initialized = true;
    // The in-app Sound and Music switches decide whether audio plays. The ringer
    // mode should not silence a game, so play even when the phone is on vibrate.
    this.ready = setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(() => {});
  }

  configure(options: { sound: boolean; music: boolean }) {
    this.init();
    this.soundEnabled = options.sound;
    this.musicEnabled = options.music;
    void this.ready.then(() => this.syncMusic());
  }

  setAppActive(active: boolean) {
    this.appActive = active;
    void this.ready.then(() => this.syncMusic());
  }

  play(effect: SoundEffect) {
    if (!this.soundEnabled) return;
    void this.ready.then(() => this.startEffect(effect));
  }

  private startEffect(effect: SoundEffect) {
    if (!this.soundEnabled) return;
    try {
      let player = this.effects.get(effect);
      if (!player) {
        player = createAudioPlayer(effectSources[effect]);
        this.effects.set(effect, player);
      }
      const start = () => {
        player.seekTo(0).catch(() => {});
        player.play();
      };
      if (player.isLoaded) {
        start();
        return;
      }
      // play() is ignored until the file has decoded, so wait for that once.
      const subscription = player.addListener('playbackStatusUpdate', (status) => {
        if (!status.isLoaded) return;
        subscription.remove();
        if (this.soundEnabled) start();
      });
    } catch {
      // Audio is non-essential; never let a playback error interrupt the game.
    }
  }

  private syncMusic() {
    try {
      const shouldPlay = this.musicEnabled && this.appActive;
      if (!shouldPlay) {
        this.music?.pause();
        return;
      }
      if (!this.music) {
        const player = createAudioPlayer(musicSource);
        player.loop = true;
        player.volume = MUSIC_VOLUME;
        player.addListener('playbackStatusUpdate', (status) => {
          if (status.isLoaded && this.musicEnabled && this.appActive && !player.playing) {
            player.play();
          }
        });
        this.music = player;
      }
      this.music.play();
    } catch {
      // Ignore audio focus or decoding errors.
    }
  }
}

export const audio = new AudioService();
