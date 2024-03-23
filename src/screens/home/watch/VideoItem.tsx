import { ActivityIndicator, TouchableHighlight, View } from 'react-native';
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';
import { useState, useEffect, PropsWithChildren, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import FastImage from 'react-native-fast-image';
import BaseItem from '@/src/components/listItems/BaseItem';
import StyledText from '@/src/components/styled/Text';
import styles from '@/screens/home/watch/styles';
import { PostType, SocialPostReaction, WatchPost } from '@/utils/types';

import { Colors } from '@/src/styles';
import { RootState } from '@/src/redux/reducers/rootReducer';
import {
  HomeStackParamsList,
  MainBottomStackParamsList,
  MainDrawerParamsList,
} from '@/src/navigator/types';

type VideoItemProps = {
  item: WatchPost;
  viewHeight: number;
  width: number;
  index: number;
  fromSavedPosts: boolean;
  parentRefreshContent?: Function;
  onShowDismissCard?: (e?: boolean) => void;
  activeInScreenIndex: number;
};
type ScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<HomeStackParamsList, 'Home'>,
  CompositeNavigationProp<
    DrawerNavigationProp<MainDrawerParamsList, 'Main'>,
    BottomTabNavigationProp<MainBottomStackParamsList, 'HomeTab'>
  >
>;

function VideoItem({
  item,
  viewHeight,
  width,
  index,
  fromSavedPosts,
  parentRefreshContent,
  onShowDismissCard,
  activeInScreenIndex,
}: PropsWithChildren<VideoItemProps>) {
  const [isLoading, setIsloading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [playedTimes, setPlayedTimes] = useState<number>(0);
  const navigation = useNavigation<ScreenNavigationProp>();
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const videRef = useRef<Video>(null);
  let myReaction: SocialPostReaction | undefined;

  item.reactions?.forEach((reaction) => {
    if (reaction.userId === user?._id) {
      myReaction = reaction;
    }
  });

  useEffect(() => {
    if (index === activeInScreenIndex) {
      setIsPaused(false);
      setPlayedTimes(0);
      videRef.current?.seek(0);
    } else {
      setIsPaused(true);
    }
  }, [activeInScreenIndex]);

  const onEnd = useCallback(() => {
    videRef.current?.seek(0);
    setIsPaused(true);

    setPlayedTimes(playedTimes + 1);
  }, []);

  useEffect(() => {
    if (playedTimes < 3) {
      setIsPaused(false);
    }
  }, [playedTimes]);

  return (
    <View
      style={[
        styles.videoContainer,
        { height: viewHeight, width, position: 'relative', zIndex: 2 },
      ]}
    >
      {isLoading ? (
        <View
          style={{
            height: viewHeight,
            width,
            backgroundColor: 'transparent',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ActivityIndicator size="large" color={Colors.primary.brand} />
        </View>
      ) : null}
      <TouchableHighlight
        onPress={() => {
          setIsPaused(!isPaused);
        }}
        style={styles.video}
      >
        <View style={{ flex: 1 }}>
          <Video
            ref={videRef}
            source={{ uri: `https://stream.mux.com/${item.playBackId!}.m3u8` }}
            resizeMode="cover"
            style={styles.video}
            onLoad={() => {
              setIsloading(false);
            }}
            paused={isPaused}
            onEnd={onEnd}
            poster={`https://image.mux.com/${item.playBackId!}/thumbnail.webp`}
          />
        </View>
      </TouchableHighlight>
      <LinearGradient colors={['transparent', '#00000040', '#000000']} style={styles.videoInfo}>
        <BaseItem
          reelLayout
          style={styles.videoInfo}
          userData={item.userData}
          edited={item.edited}
          updated={item.updated}
          fromSavedPosts={fromSavedPosts}
          postData={{
            title: item?.title,
            id: item.postId ?? item.id ?? item._id,
            type: PostType.watch,
            postlink: item.link,
            reactions: item.reactions ?? [],
            myReaction,
            edited: item.edited,
            comments: item.comments,
            commentNumber: item.commentNumber,
          }}
          parentRefreshContent={parentRefreshContent}
          created={item?.created}
          isApprovedInfluencer={item.userData?.isApprovedInfluencer ?? false}
          onShowDismissCard={onShowDismissCard}
          index={index}
          onPress={() => {
            if (item.userData._id != user?._id) {
              navigation.navigate('Main', {
                screen: 'HomeTab',
                params: {
                  screen: 'UserProfile',
                  params: {
                    id: item?.userData._id,
                  },
                },
              });
            }
          }}
        >
          {item.content && (
            <View>
              <StyledText style={[styles.videoDescription, { color: 'white' }]}>
                {item.content}
              </StyledText>
            </View>
          )}
        </BaseItem>
      </LinearGradient>
    </View>
  );
}

export default VideoItem;
