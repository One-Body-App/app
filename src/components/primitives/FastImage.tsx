import React from 'react';
import { Image as ExpoImage, type ImageProps as ExpoImageProps } from 'expo-image';
import type { ImageStyle, StyleProp } from 'react-native';

export type ResizeMode = 'contain' | 'cover' | 'stretch' | 'center';
export type { ImageStyle };

type FastImageSource = ExpoImageProps['source'];

type FastImageProps = Omit<ExpoImageProps, 'contentFit' | 'source' | 'style'> & {
  source?: FastImageSource;
  style?: StyleProp<ImageStyle>;
  resizeMode?: ResizeMode;
};

const resizeMode = {
  contain: 'contain',
  cover: 'cover',
  stretch: 'stretch',
  center: 'center',
} as const;

type FastImageStatics = {
  preload: (sources: readonly { uri?: string }[]) => void;
  resizeMode: typeof resizeMode;
};

type FastImageComponent = ((props: FastImageProps) => React.ReactElement) & FastImageStatics;

const contentFitByResizeMode: Record<ResizeMode, ExpoImageProps['contentFit']> = {
  contain: 'contain',
  cover: 'cover',
  stretch: 'fill',
  center: 'none',
};

function FastImage({ resizeMode: imageResizeMode = 'cover', ...props }: FastImageProps) {
  return <ExpoImage {...props} contentFit={contentFitByResizeMode[imageResizeMode]} />;
}

const preload = (sources: readonly { uri?: string }[]) => {
  const urls = sources.flatMap((source) => (source.uri ? [source.uri] : []));
  if (urls.length < 1) {
    return;
  }

  const { prefetch } = ExpoImage as unknown as {
    prefetch?: (urlsToPrefetch: string | string[]) => Promise<unknown> | void;
  };
  Promise.resolve(prefetch?.(urls)).catch(() => undefined);
};

const FastImageWithStatics = FastImage as FastImageComponent;
FastImageWithStatics.preload = preload;
FastImageWithStatics.resizeMode = resizeMode;

export default FastImageWithStatics;
