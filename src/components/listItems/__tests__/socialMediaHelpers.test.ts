import { Image, Platform } from 'react-native';
import type { SocialPost } from '@/utils/types';
import {
  buildSliderImages,
  buildImageViewerPreloadUrls,
  buildImageViewerSources,
  cacheImageDimensions,
  clearCachedImageDimensions,
  extractRepostSourceMedia,
  extractTopLevelPostMedia,
  getCachedImageDimensions,
  resolveFeedMultiImageHeightMode,
  resolveImageDimensions,
} from '../socialMediaHelpers';

describe('socialMediaHelpers', () => {
  beforeEach(() => {
    clearCachedImageDimensions();
  });

  it('keeps top-level media for a normal post', () => {
    const post = {
      content: 'hello',
      images: ['https://cdn.example.com/image-1.jpg', 'https://cdn.example.com/image-2.jpg'],
    } as SocialPost;

    expect(extractTopLevelPostMedia(post)).toEqual([
      { type: 'photo', url: 'https://cdn.example.com/image-1.jpg' },
      { type: 'photo', url: 'https://cdn.example.com/image-2.jpg' },
    ]);
  });

  it('suppresses mirrored top-level media for repost entries', () => {
    const post = {
      content: 'reposted',
      images: ['https://cdn.example.com/image-1.jpg'],
      repost: {
        sourceType: 'social',
        sourceId: 'source-post-id',
        repostType: 'repost',
        sourceImages: ['https://cdn.example.com/image-1.jpg'],
      },
    } as SocialPost;

    expect(extractTopLevelPostMedia(post)).toEqual([]);
  });

  it('builds deduped repost source media and slider inputs for multiple images', () => {
    const sourceMedia = extractRepostSourceMedia({
      sourceType: 'social',
      sourceId: 'source-post-id',
      repostType: 'repost',
      sourceImages: ['https://cdn.example.com/image-1.jpg', 'https://cdn.example.com/image-2.jpg'],
      sourceImage: 'https://cdn.example.com/image-1.jpg',
      sourceMediaType: 'photo',
      sourceMediaUrl: 'https://cdn.example.com/image-2.jpg',
      sourceVideos: [],
    });

    expect(sourceMedia.imageUrls).toEqual([
      'https://cdn.example.com/image-1.jpg',
      'https://cdn.example.com/image-2.jpg',
    ]);

    const sliderImages = buildSliderImages([
      { url: 'https://cdn.example.com/image-1.jpg', width: 1600, height: 900 },
      { url: 'https://cdn.example.com/image-2.jpg', width: 900, height: 1600 },
    ]);

    expect(sliderImages).toEqual([
      {
        url: 'https://cdn.example.com/image-1.jpg',
        width: 1600,
        height: 900,
        type: 'image',
      },
      {
        url: 'https://cdn.example.com/image-2.jpg',
        width: 900,
        height: 1600,
        type: 'image',
      },
    ]);
  });

  it('caches image dimensions for repeated feed resolution', () => {
    expect(getCachedImageDimensions('https://cdn.example.com/cached.jpg')).toBeUndefined();

    cacheImageDimensions('https://cdn.example.com/cached.jpg', 1200, 900);

    expect(getCachedImageDimensions('https://cdn.example.com/cached.jpg')).toEqual({
      url: 'https://cdn.example.com/cached.jpg',
      width: 1200,
      height: 900,
    });
  });

  it('reuses one in-flight image dimension request per url', async () => {
    const getSizeSpy = jest
      .spyOn(Image, 'getSize')
      .mockImplementation((_: string, onSuccess: any) => {
        onSuccess(1440, 1080);
      });

    const [first, second] = await Promise.all([
      resolveImageDimensions('https://cdn.example.com/shared.jpg'),
      resolveImageDimensions('https://cdn.example.com/shared.jpg'),
    ]);

    expect(first).toEqual({
      url: 'https://cdn.example.com/shared.jpg',
      width: 1440,
      height: 1080,
    });
    expect(second).toEqual(first);
    expect(getSizeSpy).toHaveBeenCalledTimes(1);
  });

  it('builds viewer sources and adjacent preload urls for gallery taps', () => {
    const sliderImages = buildSliderImages([
      { url: 'https://cdn.example.com/image-1.jpg', width: 1600, height: 900 },
      { url: 'https://cdn.example.com/image-2.jpg', width: 900, height: 1600 },
      { url: 'https://cdn.example.com/image-3.jpg', width: 1200, height: 1200 },
    ]);

    expect(buildImageViewerSources(sliderImages)).toEqual([
      { uri: 'https://cdn.example.com/image-1.jpg' },
      { uri: 'https://cdn.example.com/image-2.jpg' },
      { uri: 'https://cdn.example.com/image-3.jpg' },
    ]);

    expect(buildImageViewerPreloadUrls(sliderImages, 1)).toEqual([
      'https://cdn.example.com/image-1.jpg',
      'https://cdn.example.com/image-2.jpg',
      'https://cdn.example.com/image-3.jpg',
    ]);
  });

  it('uses fixed multi-image heights on android primary feed rows', () => {
    const originalOS = Platform.OS;

    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'android',
    });

    expect(resolveFeedMultiImageHeightMode(true)).toBe('fixed');
    expect(resolveFeedMultiImageHeightMode(false)).toBe('fixed');

    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: originalOS,
    });
  });
});
