import { ImageForSlider } from './types';

export const DEFAULT_FEED_ASPECT_RATIO = 4 / 5;

export const clampAspectRatio = (ratio: number, min?: number, max?: number) => {
  if (!Number.isFinite(ratio) || ratio <= 0) {
    return DEFAULT_FEED_ASPECT_RATIO;
  }

  const hasMin = Number.isFinite(min) && (min as number) > 0;
  const hasMax = Number.isFinite(max) && (max as number) > 0;
  const minRatio = hasMin ? (min as number) : undefined;
  const maxRatio = hasMax ? (max as number) : undefined;

  let nextRatio = ratio;
  if (typeof minRatio === 'number' && nextRatio < minRatio) {
    nextRatio = minRatio;
  }
  if (typeof maxRatio === 'number' && nextRatio > maxRatio) {
    nextRatio = maxRatio;
  }
  return nextRatio;
};

export const getImageAspectRatio = (image: ImageForSlider) => {
  const gifAspectRatio = Number(image.gifAspectRatio);
  if (image.type === 'gif' && Number.isFinite(gifAspectRatio) && gifAspectRatio > 0) {
    return gifAspectRatio;
  }

  const imageWidth = Number(image.width);
  const imageHeight = Number(image.height);
  if (
    Number.isFinite(imageWidth) &&
    Number.isFinite(imageHeight) &&
    imageWidth > 0 &&
    imageHeight > 0
  ) {
    return imageWidth / imageHeight;
  }

  return DEFAULT_FEED_ASPECT_RATIO;
};

export const buildSlideHeights = (
  images: ImageForSlider[],
  width: number,
  minAspectRatio?: number,
  maxAspectRatio?: number
) => {
  const safeWidth = Number.isFinite(width) && width > 0 ? width : 0;
  return images.map((image) => {
    const clampedRatio = clampAspectRatio(
      getImageAspectRatio(image),
      minAspectRatio,
      maxAspectRatio
    );
    return safeWidth > 0 ? safeWidth / clampedRatio : 0;
  });
};
