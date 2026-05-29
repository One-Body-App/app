// import { StyleSheet } from 'react-native';
import React, { useImperativeHandle, useRef } from 'react';
// import muxReactNativeVideo from '@mux/mux-data-react-native-video';
// import VisibilitySensor from '@svanboxel/visibility-sensor-react-native';

type SingleReelsHandle = {
  play: () => Promise<void>;
  stop: () => Promise<void>;
};

type SingleReelsProps = {
  item: any;
  ref?: React.Ref<SingleReelsHandle>;
};

function SingleReels({ item, ref: parentRef }: SingleReelsProps) {
  // const MuxVideo = muxReactNativeVideo(Video);
  // const [paused, setpaused] = useState(true);
  const videoRef = useRef</* VideoRef */ any>(null);
  useImperativeHandle(parentRef, () => ({
    play,
    // unload,
    stop,
  }));
  const play = async () => {
    if (videoRef.current == null) {
      return;
    }
    try {
      videoRef.current.setNativeProps({ paused: false });
    } catch (e) {
      console.log('Error :::::', e);
    }
  };
  const stop = async () => {
    if (videoRef.current == null) {
      return;
    }
    try {
      videoRef.current.setNativeProps({ paused: true });
    } catch (e) {
      console.log('Error :::::', e);
    }
  };
  // const unload = async () => {
  //   if (videoRef.current == null) {
  //     return;
  //   }

  //   // if video is already stopped return
  //   try {
  //     console.log('UNLOAD THE VIDO');
  //     await videoRef.current.unloadAsync();
  //   } catch (e) {
  //     console.log(e);
  //   }
  // };
  // useEffect(() => {
  //   return () => unload();
  // }, []);
  // return (
  //   <VisibilitySensor
  //     style={{ flex: 1 }}
  //     onChange={(isVisible) => {
  //       return isVisible ? setpaused(false) : setpaused(true);
  //     }}
  //   >
  //     <MuxVideo
  //       ref={videoRef}
  //       resizeMode="contain"
  //       style={{ flex: 1 }}
  //       // controls
  //       repeat
  //       isLooping
  //       paused={paused}
  //       source={{
  //         uri: `https://stream.mux.com/${item?.playback_ids?.[0]?.id}.m3u8`,
  //       }}
  //       muxOptions={{
  //         application_name: 'One Body Inc', // (required) the name of your application
  //         // application_version: 1, // the version of your application (optional, but encouraged)
  //         data: {
  //           env_key: 'rki2o54t3hd863rmub7pfo3mm', // (required)
  //           // player_software_version: '5.0.2', // (optional, but encouraged) the version of react-native-video that you are using
  //           player_name: 'React Native Player', // See metadata docs for available metadata fields https://docs.mux.com/docs/web-integration-guide#section-5-add-metadata
  //           video_id: '4PqGmTr702jsox5IW7zWgwnSvfwnLmqVMwGAVNFBcJm8',
  //           video_title: 'My awesome video',
  //         },
  //       }}
  //     />
  //   </VisibilitySensor>
  // );
  return null;
}

export default SingleReels;
