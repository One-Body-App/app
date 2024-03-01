import { ActivityIndicator, TouchableHighlight, View } from 'react-native';
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import BaseItem from '@/src/components/listItems/BaseItem';
import StyledText from '@/src/components/styled/Text';
import styles from '@/screens/home/watch/styles';
import { PostType, SocialPostReaction, WatchPost } from '@/utils/types';

import { Colors } from '@/src/styles';
import { NO_POST_IMAGE_URL } from '@/src/services/constants';
import { RootState } from '@/src/redux/reducers/rootReducer';

function VideoItem({
  item,
  viewHeight,
  width,
  index,
  fromSavedPosts,
  parentRefreshContent,
  onShowDismissCard,
}: {
  item: WatchPost;
  viewHeight: number;
  width: number;
  index: number;
  fromSavedPosts: boolean;
  parentRefreshContent?: Function;
  onShowDismissCard?: (e?: boolean) => void;
}) {
  const [isLoading, setIsloading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [playedTimes, setPlayedTimes] = useState<number>(0);
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  let myReaction: SocialPostReaction | undefined;

  item.reactions?.forEach((reaction) => {
    if (reaction.userId == user?._id) {
      myReaction = reaction;
    }
  });

  return (
    <View style={[styles.videoContainer, { height: viewHeight, width }]}>
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
        <Video
          source={{ uri: `https://stream.mux.com/${item.playBackId}` }}
          resizeMode="cover"
          style={styles.video}
          onLoad={() => {
            setIsloading(false);
          }}
          paused={isPaused}
          repeat={playedTimes < 3}
          onEnd={() => {
            setPlayedTimes(playedTimes + 1);
          }}
        />
      </TouchableHighlight>

      <LinearGradient colors={['transparent', '#00000040', '#000000']} style={styles.videoInfo}>
        <BaseItem
          style={styles.videoInfo}
          transparency
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
            // if (item.userData._id != user?._id) {
            //   navigation.navigate('Main', {
            //     screen: 'HomeTab',
            //     params: {
            //       screen: 'UserProfile',
            //       params: {
            //         id: item?.userData._id,
            //       },
            //     },
            //   });
            // }
          }}
        >
          <View>
            <StyledText style={[styles.videoDescription, { color: Colors.neutral[600] }]}>
              {item.content}
            </StyledText>
          </View>
        </BaseItem>
      </LinearGradient>
    </View>
  );
}

export default VideoItem;
