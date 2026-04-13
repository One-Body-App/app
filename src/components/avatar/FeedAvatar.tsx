import React, { useMemo, useState } from 'react';
import { Image, ImageResizeMode, View } from 'react-native';
import ProfileFill from '@/assets/svg/ProfileFill.svg';
import { NO_PROFILE_IMAGE } from '@/services/constants';
import { isFeedAvatarPlaceholderUri } from './feedAvatarUtils';

type FeedAvatarProps = {
  uri?: string;
  size: number;
  style?: any;
  resizeMode?: ImageResizeMode;
  fallbackBackgroundColor?: string;
  fallbackBorderColor?: string;
  fallbackIconColor?: string;
  fallbackIconSize?: number;
  testID?: string;
};

function FeedAvatar({
  uri,
  size,
  style,
  resizeMode = 'cover',
  fallbackBackgroundColor = '#f6f6f7',
  fallbackBorderColor = '#126b87',
  fallbackIconColor = '#126b87',
  fallbackIconSize,
  testID,
}: FeedAvatarProps) {
  const normalizedUri = typeof uri === 'string' ? uri.trim() : '';
  const fallbackUri = typeof NO_PROFILE_IMAGE === 'string' ? NO_PROFILE_IMAGE.trim() : '';
  const [failedUris, setFailedUris] = useState<Set<string>>(new Set());

  const didFallbackImageFail = failedUris.has(fallbackUri);
  const currentUri = failedUris.has(normalizedUri) ? fallbackUri : normalizedUri;

  const dimensionStyle = useMemo(
    () => ({
      width: size,
      height: size,
      borderRadius: size / 2,
    }),
    [size]
  );

  const imageUri = !currentUri || isFeedAvatarPlaceholderUri(currentUri) ? fallbackUri : currentUri;

  if (!imageUri || didFallbackImageFail) {
    return (
      <View
        testID={testID ? `${testID}-fallback` : undefined}
        style={[
          dimensionStyle,
          {
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: fallbackBackgroundColor,
            borderColor: fallbackBorderColor,
            borderWidth: 1,
          },
          style,
        ]}
      >
        <ProfileFill
          width={fallbackIconSize ?? Math.round(size * 0.48)}
          height={fallbackIconSize ?? Math.round(size * 0.48)}
          color={fallbackIconColor}
        />
      </View>
    );
  }

  return (
    <Image
      testID={testID ? `${testID}-image` : undefined}
      source={{ uri: imageUri }}
      style={[dimensionStyle, style]}
      resizeMode={resizeMode}
      onError={() => {
        setFailedUris((prev) => new Set(prev).add(imageUri));
      }}
    />
  );
}

export default FeedAvatar;
