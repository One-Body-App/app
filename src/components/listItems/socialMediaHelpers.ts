import type { GiphyMedia } from '@giphy/react-native-sdk';
import { Image, Platform } from 'react-native';

import type { ResolvedRepostSourceSnapshot } from '@/services/repostSourceResolver';
import type { ImageForSlider } from '@/components/imageSlider/types';
import type { SocialPost } from '@/utils/types';

export type DerivedMediaItem = {
  type: string;
  url: string;
};

export type DerivedImageInfo = {
  url: string;
  width: number;
  height: number;
};

export type ImageViewerSource = {
  uri: string;
};

const DEFAULT_IMAGE_WIDTH = 4;
const DEFAULT_IMAGE_HEIGHT = 5;
const MAX_CACHED_IMAGE_DIMENSIONS = 300;
const imageDimensionCache = new Map<string, DerivedImageInfo>();
const imageDimensionRequests = new Map<string, Promise<DerivedImageInfo | undefined>>();

const toNonEmptyString = (value: unknown) => {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
};

const toSafeNumber = (value: unknown, fallback = 1) => {
  let parsed: number;
  if (typeof value === 'string') {
    parsed = parseFloat(value);
  } else if (typeof value === 'number') {
    parsed = value;
  } else {
    parsed = Number(value);
  }

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const uniqueUrls = (values: string[]) =>
  Array.from(
    new Set(values.map((value) => toNonEmptyString(value)).filter((value) => value.length > 0))
  );

const touchCachedImageDimensions = (url: string, entry: DerivedImageInfo) => {
  imageDimensionCache.delete(url);
  imageDimensionCache.set(url, entry);
};

const pruneCachedImageDimensions = () => {
  while (imageDimensionCache.size > MAX_CACHED_IMAGE_DIMENSIONS) {
    const oldestKey = imageDimensionCache.keys().next().value;
    if (!oldestKey) {
      return;
    }
    imageDimensionCache.delete(oldestKey);
  }
};

export const clearCachedImageDimensions = () => {
  imageDimensionCache.clear();
  imageDimensionRequests.clear();
};

export const getCachedImageDimensions = (url: string): DerivedImageInfo | undefined => {
  const normalizedUrl = toNonEmptyString(url);
  if (!normalizedUrl) {
    return undefined;
  }

  const cached = imageDimensionCache.get(normalizedUrl);
  if (!cached) {
    return undefined;
  }

  touchCachedImageDimensions(normalizedUrl, cached);
  return { ...cached };
};

export const cacheImageDimensions = (
  url: string,
  width: number,
  height: number
): DerivedImageInfo | undefined => {
  const normalizedUrl = toNonEmptyString(url);
  if (!normalizedUrl || width <= 0 || height <= 0) {
    return undefined;
  }

  const cachedValue = {
    url: normalizedUrl,
    width,
    height,
  };
  touchCachedImageDimensions(normalizedUrl, cachedValue);
  pruneCachedImageDimensions();
  return cachedValue;
};

export const resolveImageDimensions = (url: string): Promise<DerivedImageInfo | undefined> => {
  const normalizedUrl = toNonEmptyString(url);
  if (!normalizedUrl) {
    return Promise.resolve(undefined);
  }

  const cached = getCachedImageDimensions(normalizedUrl);
  if (cached) {
    return Promise.resolve(cached);
  }

  const inFlight = imageDimensionRequests.get(normalizedUrl);
  if (inFlight) {
    return inFlight;
  }

  const request = new Promise<DerivedImageInfo | undefined>((resolve) => {
    Image.getSize(
      normalizedUrl,
      (resolvedWidth, resolvedHeight) => {
        resolve(cacheImageDimensions(normalizedUrl, resolvedWidth, resolvedHeight));
      },
      () => {
        resolve(undefined);
      }
    );
  }).finally(() => {
    imageDimensionRequests.delete(normalizedUrl);
  });

  imageDimensionRequests.set(normalizedUrl, request);
  return request;
};

export const extractTopLevelPostMedia = (itemData: SocialPost): DerivedMediaItem[] => {
  if (itemData.repost) {
    return [];
  }

  if (itemData.mediaUrl) {
    return [
      {
        type: itemData.mediaType ?? '',
        url: itemData.mediaUrl,
      },
    ];
  }

  if (Array.isArray(itemData.attachments) && itemData.attachments.length > 0) {
    return itemData.attachments
      .filter((attachment) => attachment?.type === 'photo' || attachment?.type === 'video')
      .map((attachment) => ({
        type: attachment.type,
        url: attachment.url,
      }))
      .filter((attachment) => attachment.url);
  }

  if (Array.isArray(itemData.images) && itemData.images.length > 0) {
    return itemData.images
      .map((url) => toNonEmptyString(url))
      .filter((url) => url.length > 0)
      .map((url) => ({
        type: 'photo',
        url,
      }));
  }

  return [];
};

export const extractRepostSourceMedia = (
  snapshot?: ResolvedRepostSourceSnapshot | null
): {
  imageUrls: string[];
  videoUrls: string[];
  gif: GiphyMedia | undefined;
  primaryImageUrl: string;
} => {
  if (!snapshot) {
    return {
      imageUrls: [],
      videoUrls: [],
      gif: undefined,
      primaryImageUrl: '',
    };
  }

  const sourceMediaType = toNonEmptyString(snapshot.sourceMediaType).toLowerCase();
  const sourceMediaUrl = toNonEmptyString(snapshot.sourceMediaUrl);
  const sourceImage = toNonEmptyString(snapshot.sourceImage);
  const imageUrls = uniqueUrls([
    ...(snapshot.sourceImages ?? []),
    sourceImage,
    sourceMediaType.startsWith('video') ? '' : sourceMediaUrl,
  ]);
  const videoUrls = uniqueUrls([
    ...(snapshot.sourceVideos ?? []),
    sourceMediaType.startsWith('video') ? sourceMediaUrl : '',
  ]);

  return {
    imageUrls,
    videoUrls,
    gif: snapshot.sourceGif,
    primaryImageUrl: imageUrls[0] || sourceImage || sourceMediaUrl,
  };
};

export const buildImageInfoSeeds = (
  urls: string[],
  previous: DerivedImageInfo[] = []
): DerivedImageInfo[] =>
  uniqueUrls(urls).map((url) => {
    const existing = previous.find((item) => item.url === url);
    if (existing && existing.width > 0 && existing.height > 0) {
      return existing;
    }

    const cached = getCachedImageDimensions(url);
    if (cached) {
      return cached;
    }

    return {
      url,
      width: DEFAULT_IMAGE_WIDTH,
      height: DEFAULT_IMAGE_HEIGHT,
    };
  });

export const buildSliderImages = (
  imageInfo: DerivedImageInfo[],
  gif?: GiphyMedia | null
): ImageForSlider[] => {
  const images: ImageForSlider[] = imageInfo.map((item) => ({
    ...item,
    type: 'image',
  }));

  if (gif?.url) {
    const originalGifImage = gif.data?.images?.original;
    images.push({
      url: gif.url,
      width: toSafeNumber(originalGifImage?.width, DEFAULT_IMAGE_WIDTH),
      height: toSafeNumber(originalGifImage?.height, DEFAULT_IMAGE_HEIGHT),
      id: gif.id,
      gifAspectRatio: toSafeNumber(gif.aspectRatio),
      type: 'gif',
    });
  }

  return images;
};

export const buildImageViewerSources = (images: ImageForSlider[]): ImageViewerSource[] =>
  images
    .map((item) => toNonEmptyString(item.url))
    .filter((url) => url.length > 0)
    .map((url) => ({ uri: url }));

export const buildImageViewerPreloadUrls = (images: ImageForSlider[], selectedIndex: number) => {
  const safeIndex = Number.isFinite(selectedIndex) ? Math.round(selectedIndex) : 0;
  return uniqueUrls(
    [safeIndex - 1, safeIndex, safeIndex + 1]
      .map((index) => images[index]?.url)
      .filter((url): url is string => typeof url === 'string')
  );
};

export const resolveFeedMultiImageHeightMode = (isPrimaryHomeFeed: boolean) => {
  if (!isPrimaryHomeFeed) {
    return 'fixed' as const;
  }

  return Platform.OS === 'android' ? ('fixed' as const) : ('animated' as const);
};
