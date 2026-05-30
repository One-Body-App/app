import React, { useCallback, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import ImageView from 'react-native-image-viewing';
import FastImage from '@/components/primitives/FastImage';

type ImageViewerSource = {
  uri: string;
};

const getPreloadSources = (images: ImageViewerSource[], selectedIndex: number) => {
  const safeIndex = Number.isFinite(selectedIndex) ? Math.round(selectedIndex) : 0;
  const preloadImages =
    Platform.OS === 'android'
      ? [images[safeIndex]]
      : [images[safeIndex - 1], images[safeIndex], images[safeIndex + 1]];

  return preloadImages.filter((item): item is ImageViewerSource => Boolean(item?.uri));
};

const useSharedImageViewer = () => {
  const [viewerState, setViewerState] = useState<{
    imageIndex: number;
    images: ImageViewerSource[];
  }>({
    imageIndex: -1,
    images: [],
  });

  const closeImages = useCallback(() => {
    setViewerState({
      imageIndex: -1,
      images: [],
    });
  }, []);

  const openImages = useCallback((images: ImageViewerSource[], selectedIndex: number) => {
    if (selectedIndex < 0 || images.length < 1) {
      return;
    }

    const preloadSources = getPreloadSources(images, selectedIndex);
    if (preloadSources.length > 0) {
      FastImage.preload(preloadSources);
    }

    setViewerState({
      imageIndex: selectedIndex,
      images,
    });
  }, []);

  const imageViewer = useMemo(
    () =>
      viewerState.imageIndex > -1 ? (
        <ImageView
          images={viewerState.images}
          presentationStyle="overFullScreen"
          imageIndex={viewerState.imageIndex}
          visible
          onRequestClose={closeImages}
        />
      ) : null,
    [closeImages, viewerState.imageIndex, viewerState.images]
  );

  return {
    imageViewer,
    openImages,
  };
};

export default useSharedImageViewer;
