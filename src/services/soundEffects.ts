// Lightweight sound effects helper with lazy loading and simple caching.
// Usage:
//   await preloadSoundEffect('click', require('path/to/click.wav'));
//   await playSoundEffect('click');

// @ts-expect-error - module has no bundled types in this project
import Sound from 'react-native-sound';

type SoundInstance = {
  play: (onEnd?: (success: boolean) => void) => void;
  stop: (onStop?: () => void) => void;
  release: () => void;
  setVolume: (volume: number) => void;
  isLoaded: () => boolean;
};

const soundCache: Record<string, SoundInstance> = {};

// Set category once on module load
Sound.setCategory('Ambient', true);

if (__DEV__) {
  // eslint-disable-next-line no-console
  console.log('🔊 Sound module loaded (static import)');
}

export const preloadSoundEffect = async (key: string, asset: any) => {
  return new Promise<void>((resolve, reject) => {
    const instance = new Sound(
      asset,
      typeof asset === 'number' ? Sound.MAIN_BUNDLE : undefined,
      (error?: Error) => {
        if (error) {
          if (__DEV__) {
            console.error(`Failed to create sound instance for "${key}":`, error);
          }
          reject(error);
          return;
        }
        // Set volume to maximum for clear playback
        instance.setVolume(1.0);
        soundCache[key] = instance;
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log(
            `Sound "${key}" added to cache. Cache now contains:`,
            Object.keys(soundCache)
          );
        }
        resolve();
      }
    );
  });
};

export const playSoundEffect = async (key: string) => {
  const instance = soundCache[key];
  if (!instance) {
    if (__DEV__) {
      console.warn(`Sound effect "${key}" not found in cache`);
    }
    return;
  }

  // Verify the sound is loaded before playing
  if (!instance.isLoaded()) {
    if (__DEV__) {
      console.warn(`Sound effect "${key}" is not loaded yet`);
    }
    return;
  }

  // Play immediately without stopping (for quick successive sounds)
  // The sound is short enough that overlapping is fine
  instance.play();
};

export const unloadSoundEffect = (key: string) => {
  const instance = soundCache[key];
  if (instance) {
    instance.stop();
    instance.release();
    delete soundCache[key];
  }
};
