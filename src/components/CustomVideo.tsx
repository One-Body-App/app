import React, { useRef, useImperativeHandle } from 'react';
import { View, StyleSheet } from 'react-native';
import Video, { OnLoadData, OnProgressData } from 'react-native-video';

type CustomVideoProps = {
  source: { uri: string };
  paused?: boolean;
  repeat?: boolean;
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'none';
  controls?: boolean;
  muted?: boolean;
  poster?: string;
  style?: any;
  onEnd?: () => void;
  onLoad?: (data: OnLoadData) => void;
  onProgress?: (data: OnProgressData) => void;
};

type VideoRef = React.ElementRef<typeof Video>;

function CustomVideo({ ref, ...props }: CustomVideoProps & { ref?: React.Ref<VideoRef> }) {
  const {
    source,
    paused = false,
    repeat = true,
    resizeMode = 'contain',
    controls = false,
    muted = false,
    poster,
    style,
    onEnd,
    onLoad,
    onProgress,
  } = props;

  const videoRef = useRef<VideoRef>(null);

  useImperativeHandle(ref, () => videoRef.current as VideoRef);

  return (
    <View style={[styles.container, style]}>
      <Video
        ref={videoRef}
        source={source}
        style={StyleSheet.absoluteFill}
        resizeMode={resizeMode}
        paused={paused}
        repeat={repeat}
        muted={muted}
        controls={controls}
        poster={poster}
        posterResizeMode={resizeMode}
        onEnd={onEnd}
        onLoad={onLoad}
        onProgress={onProgress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
});

export default CustomVideo;
