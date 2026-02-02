// Lightweight sound effects helper with lazy loading and simple caching.
// Usage:
//   await preloadSoundEffect('click', require('path/to/click.wav'));
//   await playSoundEffect('click');

// @ts-expect-error - module has no bundled types in this project
import { Image } from 'react-native';
import Sound from 'react-native-sound';

type SoundInstance = {
  play: (onEnd?: (success: boolean) => void) => void;
  stop: (onStop?: () => void) => void;
  release: () => void;
  setVolume: (volume: number) => void;
  isLoaded: () => boolean;
};

const soundCache: Record<string, SoundInstance> = {};
const soundVolumeCache: Record<string, number> = {};

// Set category once on module load
Sound.setCategory('Ambient', true);

if (__DEV__) {
  console.log('🔊 Sound module loaded (static import)');
}

export const preloadSoundEffect = async (key: string, asset: any, volume = 1) => {
  return new Promise<void>((resolve, reject) => {
    const resolvedAsset =
      typeof asset === 'number' ? Image.resolveAssetSource(asset)?.uri : undefined;
    const source = resolvedAsset ?? asset;
    if (typeof source !== 'string') {
      reject(new Error(`Unsupported sound asset for "${key}"`));
      return;
    }

    const instance = new Sound(source, undefined, (error?: Error) => {
      if (error) {
        if (__DEV__) {
          console.error(`Failed to create sound instance for "${key}":`, error);
        }
        reject(error);
        return;
      }
      // Set volume (0.0 - 1.0) and cache it for playback
      const clampedVolume = Math.max(0, Math.min(1, volume));
      instance.setVolume(clampedVolume);
      soundVolumeCache[key] = clampedVolume;
      soundCache[key] = instance;
      if (__DEV__) {
        console.log(`Sound "${key}" added to cache. Cache now contains:`, Object.keys(soundCache));
      }
      resolve();
    });
  });
};

export const playSoundEffect = async (key: string, volume?: number) => {
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

  const resolvedVolume =
    typeof volume === 'number' ? Math.max(0, Math.min(1, volume)) : soundVolumeCache[key];
  if (typeof resolvedVolume === 'number') {
    instance.setVolume(resolvedVolume);
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
