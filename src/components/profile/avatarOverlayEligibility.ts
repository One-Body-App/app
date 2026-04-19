import { useEffect, useState } from 'react';
import { Image, PixelRatio } from 'react-native';
import { isFeedAvatarPlaceholderUri } from '@/components/avatar/feedAvatarUtils';

type GetImageSize = (
  uri: string,
  success: (width: number, height: number) => void,
  failure?: (error: unknown) => void
) => void;

type AvatarOverlayEligibilityOptions = {
  expandedSize: number;
  imageUri?: string;
  pixelRatio?: number;
  getImageSize?: GetImageSize;
};

const normalizeImageUri = (value?: string) => (typeof value === 'string' ? value.trim() : '');

const resolveImageSize = (uri: string, getImageSize: GetImageSize) =>
  new Promise<{ width: number; height: number }>((resolve, reject) => {
    getImageSize(
      uri,
      (width, height) => resolve({ width, height }),
      (error) => reject(error)
    );
  });

export const canOpenAvatarOverlay = async ({
  expandedSize,
  imageUri,
  pixelRatio = PixelRatio.get(),
  getImageSize = Image.getSize,
}: AvatarOverlayEligibilityOptions) => {
  const normalizedImageUri = normalizeImageUri(imageUri);

  if (!normalizedImageUri || isFeedAvatarPlaceholderUri(normalizedImageUri)) {
    return false;
  }

  try {
    const { width, height } = await resolveImageSize(normalizedImageUri, getImageSize);
    return Math.min(width, height) >= expandedSize * pixelRatio;
  } catch {
    return false;
  }
};

export const useAvatarOverlayEligibility = (imageUri: string | undefined, expandedSize: number) => {
  const [isEligible, setIsEligible] = useState(false);

  useEffect(() => {
    let isActive = true;

    setIsEligible(false);

    canOpenAvatarOverlay({
      expandedSize,
      imageUri,
    }).then((result) => {
      if (isActive) {
        setIsEligible(result);
      }
    });

    return () => {
      isActive = false;
    };
  }, [expandedSize, imageUri]);

  return isEligible;
};
