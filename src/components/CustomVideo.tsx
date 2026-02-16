import React, { forwardRef, useRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Video, { OnLoadData } from 'react-native-video';

const { width: screenWidth } = Dimensions.get('window');

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
};

type VideoRef = React.ElementRef<typeof Video>;

const CustomVideo = forwardRef<VideoRef, CustomVideoProps>((props, ref) => {
  const {
    source,
    paused = false,
    repeat = true,
    resizeMode = 'contain',
    controls = true,
    muted = false,
    poster,
    style,
    onEnd,
    onLoad,
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
        posterResizeMode="cover"
        onEnd={onEnd}
        onLoad={onLoad}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: screenWidth,
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
});

export default CustomVideo;
