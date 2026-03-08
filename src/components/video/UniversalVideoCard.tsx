import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import CustomVideo from '@/src/components/CustomVideo';
import StyledText from '@/src/components/styled/Text';
import { spacing } from '@/src/styles/spacing';

import {
  BRAND_VIDEO_BACKGROUND,
  VideoMetadataLike,
  getFeedVideoLayout,
  getWatchVideoLayout,
} from './universalVideoLayout';

type UniversalVideoCardProps = {
  context: 'feed' | 'watch';
  sourceUri: string;
  metadata?: VideoMetadataLike | null;
  containerWidth?: number;
  viewportWidth?: number;
  viewportHeight?: number;
  paused?: boolean;
  muted?: boolean;
  repeat?: boolean;
  controls?: boolean;
  borderRadius?: number;
  poster?: string;
  videoRef?: any;
  onLoad?: (loadData: any) => void;
  onProgress?: (data: any) => void;
  onEnd?: () => void;
  onPress?: () => void;
  onExpandPress?: () => void;
  showExpandButton?: boolean;
  children?: React.ReactNode;
};

function UniversalVideoCard({
  context,
  sourceUri,
  metadata,
  containerWidth,
  viewportWidth,
  viewportHeight,
  paused,
  muted,
  repeat,
  controls,
  borderRadius = 0,
  poster,
  videoRef,
  onLoad,
  onProgress,
  onEnd,
  onPress,
  onExpandPress,
  showExpandButton,
  children,
}: UniversalVideoCardProps) {
  const layout =
    context === 'feed'
      ? getFeedVideoLayout(containerWidth ?? 1, metadata)
      : getWatchVideoLayout(viewportWidth ?? 1, viewportHeight ?? 1, metadata);

  const shell = (
    <View
      style={[
        styles.shell,
        context === 'watch'
          ? {
              width: viewportWidth ?? '100%',
              height: viewportHeight ?? '100%',
              backgroundColor: layout.backgroundColor,
            }
          : undefined,
      ]}
    >
      <View
        style={[
          styles.frame,
          {
            width: layout.frameWidth,
            height: layout.frameHeight,
            borderRadius,
            backgroundColor: layout.backgroundColor,
            borderColor:
              context === 'feed' && 'borderColor' in layout ? layout.borderColor : 'transparent',
            borderWidth: context === 'feed' && 'borderWidth' in layout ? layout.borderWidth : 0,
          },
        ]}
      >
        <CustomVideo
          ref={videoRef}
          source={{ uri: sourceUri }}
          style={StyleSheet.absoluteFillObject}
          controls={controls}
          resizeMode={layout.resizeMode}
          paused={paused}
          muted={muted}
          repeat={repeat}
          onLoad={onLoad}
          onProgress={onProgress}
          onEnd={onEnd}
          poster={poster}
        />

        {context === 'feed' && showExpandButton && onExpandPress ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={onExpandPress}
            style={styles.expandButton}
          >
            <MaterialCommunityIcons name="arrow-expand" size={16} color="#FFFFFF" />
            <StyledText style={styles.expandLabel}>Expand</StyledText>
          </Pressable>
        ) : null}

        {children}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={styles.pressable}>
        {shell}
      </Pressable>
    );
  }

  return shell;
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
  },
  shell: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND_VIDEO_BACKGROUND,
  },
  frame: {
    overflow: 'hidden',
  },
  expandButton: {
    position: 'absolute',
    right: spacing.x10,
    bottom: spacing.x10,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: spacing.x10,
    paddingVertical: spacing.x8,
    backgroundColor: 'rgba(3, 47, 60, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(179, 193, 197, 0.7)',
  },
  expandLabel: {
    marginLeft: spacing.x5,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
});

export default React.memo(UniversalVideoCard);
