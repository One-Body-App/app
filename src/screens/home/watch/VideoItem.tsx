import { ActivityIndicator, TouchableHighlight, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useState, useEffect, PropsWithChildren, useRef, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';
import { BottomSheetModal, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
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
import CustomVideo from '@/src/components/CustomVideo';
import WatchComments from './watchComments';

type VideoItemProps = {
  item: WatchPost;
  viewHeight: number;
  frameWidth?: number;
  width?: number;
  currentIndex: number;
  fromSavedPosts: boolean;
  parentRefreshContent?: Function;
  onShowDismissCard?: (e?: boolean) => void;
  onTelemetryEvent?: (eventType: string, metadata?: Record<string, unknown>) => void;
};

type ScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<HomeStackParamsList, 'Home'>,
  CompositeNavigationProp<
    DrawerNavigationProp<MainDrawerParamsList, 'Main'>,
    BottomTabNavigationProp<MainBottomStackParamsList, 'HomeTab'>
  >
>;

const VideoItem = gestureHandlerRootHOC(
  ({
    item,
    viewHeight,
    frameWidth,
    width,
    fromSavedPosts,
    parentRefreshContent,
    onShowDismissCard,
    currentIndex,
    onTelemetryEvent,
  }: PropsWithChildren<VideoItemProps>) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [playedTimes, setPlayedTimes] = useState<number>(0);
    const [commentCount, setCommentCount] = useState<number>(
      item.commentNumber ?? item.comments?.length ?? 0
    );
    const [commentsOpenKey, setCommentsOpenKey] = useState(0);
    const resolvedFrameWidth = frameWidth ?? width ?? 0;

    const navigation = useNavigation<ScreenNavigationProp>();
    const user = useSelector((state: RootState) => state.auth.getProfileData);
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);
    const snapPoints = useMemo(() => ['50%', '85%'], []);

    useEffect(() => {
      setCommentCount(item.commentNumber ?? item.comments?.length ?? 0);
    }, [item.commentNumber, item.comments?.length, item.id, item.postId, item._id]);

    const handlePresentModalPress = useCallback(() => {
      bottomSheetModalRef.current?.present();
      setCommentsOpenKey((previous) => previous + 1);
    }, []);

    const handleSheetChanges = useCallback((index: number) => {
      if (index === -1) {
        setIsPaused(false);
      } else if (index > -1) {
        setIsPaused(true);
      }
    }, []);

    const videRef = useRef<any>(null);
    let myReaction: SocialPostReaction | undefined;

    item.reactions?.forEach((reaction) => {
      if (reaction.userId === user?._id) {
        myReaction = reaction;
      }
    });

    const onEnd = useCallback(() => {
      if (!isPaused && playedTimes < 2) {
        videRef.current?.seek(0);
        setPlayedTimes(playedTimes + 1);
      }
    }, [isPaused, playedTimes]);

    useEffect(() => {
      if (playedTimes > 2) {
        setIsPaused(true);
      }
    }, [playedTimes]);

    const renderBackdrop = useCallback(
      (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={0} appearsOnIndex={1} />,
      []
    );

    return (
      <View
        style={[
          styles.videoContainer,
          {
            height: viewHeight,
            width: '100%',
            alignItems: 'center',
            position: 'relative',
            zIndex: 2,
          },
        ]}
      >
        {isLoading ? (
          <View
            style={{
              height: viewHeight,
              width: resolvedFrameWidth,
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
            const nextPaused = !isPaused;
            setIsPaused(nextPaused);
            onTelemetryEvent?.(nextPaused ? 'video_pause' : 'video_play', {
              postType: PostType.watch,
            });
          }}
          style={styles.video}
        >
          <View style={{ flex: 1 }}>
            <CustomVideo
              ref={videRef}
              source={{ uri: `https://stream.mux.com/${item.playBackId!}.m3u8` }}
              resizeMode="cover"
              style={[styles.video, { width: resolvedFrameWidth, height: viewHeight }]}
              onLoad={() => {
                setIsLoading(false);
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
              id: item.postId ?? item.id ?? item.id,
              type: PostType.watch,
              postlink: item.link,
              reactions: item.reactions ?? [],
              myReaction,
              edited: item.edited,
              comments: item.comments,
              commentNumber: commentCount,
              repostCount: Number((item as any)?.repostCount ?? 0),
            }}
            repostPayload={{
              sourceType: 'social',
              sourceId: String(item.postId ?? item.id ?? item._id ?? ''),
              sourcePreview: {
                title: item.title,
                content: item.content,
                link: item.link,
              },
            }}
            parentRefreshContent={parentRefreshContent}
            created={item?.created}
            isApprovedInfluencer={item.userData?.isApprovedInfluencer ?? false}
            onShowDismissCard={onShowDismissCard}
            index={currentIndex}
            onTelemetryEvent={onTelemetryEvent}
            onPress={() => {
              if (item.userData._id !== user?._id) {
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
            onCommentsPress={() => {
              handlePresentModalPress();
            }}
          >
            {item.content ? (
              <View>
                <StyledText style={[styles.videoDescription, { color: '#f6f6f7' }]}>
                  {item.content}
                </StyledText>
              </View>
            ) : null}
          </BaseItem>
        </LinearGradient>

        <BottomSheetModal
          ref={bottomSheetModalRef}
          index={1}
          snapPoints={snapPoints}
          onChange={handleSheetChanges}
          backdropComponent={renderBackdrop}
          keyboardBehavior="extend"
        >
          <WatchComments
            postId={item.id}
            initialCommentCount={commentCount}
            sheetOpenKey={commentsOpenKey}
            onClose={() => {
              bottomSheetModalRef.current?.dismiss();
            }}
            onCountChange={setCommentCount}
            onTelemetryEvent={onTelemetryEvent}
          />
        </BottomSheetModal>
      </View>
    );
  }
);

export default VideoItem;
