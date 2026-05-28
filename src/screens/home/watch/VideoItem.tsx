import { ActivityIndicator, Pressable, View } from 'react-native';
import { useState, useEffect, PropsWithChildren, useRef, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';
import { BottomSheetModal, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import styles from '@/screens/home/watch/styles';
import BottomSheetEntranceGlow from '@/components/BottomSheetEntranceGlow';
import { navigateToMentionProfile } from '@/components/mentions/navigation';
import { CommentPost, PostType, WatchPost } from '@/utils/types';
import { Colors } from '@/src/styles';
import { RootState } from '@/src/redux/reducers/rootReducer';
import {
  HomeStackParamsList,
  MainBottomStackParamsList,
  MainDrawerParamsList,
} from '@/src/navigator/types';
import {
  getCommentId,
  toSerializableCommentSnapshot,
} from '@/components/comments/commentListUtils';
import WatchComments from './watchComments';
import UniversalVideoCard from '@/src/components/video/UniversalVideoCard';
import { getWatchVideoLayout } from '@/src/components/video/universalVideoLayout';
import WatchOverlay from './WatchOverlay';

type VideoItemProps = {
  item: WatchPost;
  viewHeight: number;
  frameWidth?: number;
  width?: number;
  currentIndex: number;
  fromSavedPosts: boolean;
  parentRefreshContent?: Function;
  removePost?: (type: string, postId: string) => void;
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

const SHEET_NAVIGATION_DELAY_MS = 220;

const VideoItem = gestureHandlerRootHOC(
  ({
    item,
    viewHeight,
    frameWidth,
    width,
    fromSavedPosts,
    parentRefreshContent,
    removePost,
    onShowDismissCard,
    onTelemetryEvent,
  }: PropsWithChildren<VideoItemProps>) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [playedTimes, setPlayedTimes] = useState<number>(0);
    const [commentCount, setCommentCount] = useState<number>(
      item.commentNumber ?? item.comments?.length ?? 0
    );
    const [commentsOpenKey, setCommentsOpenKey] = useState(0);
    const [progress, setProgress] = useState(0);
    const [durationSeconds, setDurationSeconds] = useState<number>(
      item.durationMs ? item.durationMs / 1000 : Number(item.duration ?? 0)
    );
    const viewportWidth = frameWidth ?? width ?? 0;
    const videoLayout = getWatchVideoLayout(viewportWidth, viewHeight, item);

    const navigation = useNavigation<ScreenNavigationProp>();
    const user = useSelector((state: RootState) => state.auth.getProfileData);
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);
    const hasPlayedSheetGlowRef = useRef(false);
    const hasTrackedVideoStartRef = useRef(false);
    const hasTrackedVideoCompleteRef = useRef(false);
    const progressMilestonesRef = useRef<Set<number>>(new Set());
    const [sheetGlowPlayKey, setSheetGlowPlayKey] = useState(0);
    const snapPoints = useMemo(() => ['75%', '90%'], []);

    useEffect(() => {
      setCommentCount(item.commentNumber ?? item.comments?.length ?? 0);
    }, [item.commentNumber, item.comments?.length, item.id, item.postId, item._id]);

    const handlePresentModalPress = useCallback(() => {
      if (!hasPlayedSheetGlowRef.current) {
        hasPlayedSheetGlowRef.current = true;
        setSheetGlowPlayKey((previous) => previous + 1);
      }
      bottomSheetModalRef.current?.present();
      onShowDismissCard?.(true);
      setCommentsOpenKey((previous) => previous + 1);
      onTelemetryEvent?.('post_comment_open', {
        postType: PostType.watch,
        origin: 'watch_sheet',
      });
    }, [onShowDismissCard, onTelemetryEvent]);

    const handleSheetChanges = useCallback(
      (index: number) => {
        if (index === -1) {
          setIsPaused(false);
          onShowDismissCard?.(false);
        } else if (index > -1) {
          setIsPaused(true);
          onShowDismissCard?.(true);
        }
      },
      [onShowDismissCard]
    );

    const videRef = useRef<any>(null);

    const onEnd = useCallback(() => {
      if (!isPaused) {
        setPlayedTimes((previousPlayedTimes) => {
          if (previousPlayedTimes >= 2) {
            return previousPlayedTimes;
          }
          videRef.current?.seek(0);
          return previousPlayedTimes + 1;
        });
      }
      setProgress(1);
      if (!hasTrackedVideoCompleteRef.current) {
        hasTrackedVideoCompleteRef.current = true;
        onTelemetryEvent?.('post_video_complete', {
          postType: PostType.watch,
          completionPct: 100,
        });
      }
    }, [isPaused, onTelemetryEvent]);

    useEffect(() => {
      if (playedTimes > 2) {
        setIsPaused(true);
      }
    }, [playedTimes]);

    useEffect(() => {
      setProgress(0);
      setDurationSeconds(item.durationMs ? item.durationMs / 1000 : Number(item.duration ?? 0));
      setIsLoading(true);
      hasTrackedVideoStartRef.current = false;
      hasTrackedVideoCompleteRef.current = false;
      progressMilestonesRef.current = new Set();
    }, [item.duration, item.durationMs, item.id, item.playBackId, item.postId, item._id]);

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.72}
          pressBehavior="close"
        />
      ),
      []
    );

    const handleOpenCommentThread = useCallback(
      (comment: CommentPost) => {
        const commentId = getCommentId(comment);
        const postId = String(item.id ?? item.postId ?? item._id ?? '');
        if (!commentId || !postId) {
          return;
        }

        setTimeout(() => {
          navigation.push('SingleRss', {
            postId,
            postType: PostType.watch,
            threadRootCommentId: commentId,
            threadRootCommentSnapshot: toSerializableCommentSnapshot(comment),
          });
        }, SHEET_NAVIGATION_DELAY_MS);
      },
      [item.id, item.postId, item._id, navigation]
    );

    const handleOpenMentionProfile = useCallback(
      (handle: string) => {
        setTimeout(() => {
          navigateToMentionProfile(navigation, handle);
        }, SHEET_NAVIGATION_DELAY_MS);
      },
      [navigation]
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
              width: viewportWidth,
              backgroundColor: videoLayout.backgroundColor,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <ActivityIndicator size="large" color={Colors.primary.brand} />
          </View>
        ) : null}

        <Pressable
          onPress={() => {
            const nextPaused = !isPaused;
            setIsPaused(nextPaused);
            onTelemetryEvent?.(nextPaused ? 'post_video_pause' : 'post_video_start', {
              postType: PostType.watch,
            });
          }}
          style={{ width: '100%', height: '100%' }}
        >
          <UniversalVideoCard
            context="watch"
            sourceUri={`https://stream.mux.com/${item.playBackId!}.m3u8`}
            metadata={item}
            viewportWidth={viewportWidth}
            viewportHeight={viewHeight}
            paused={isPaused}
            muted={false}
            repeat={false}
            controls={false}
            poster={`https://image.mux.com/${item.playBackId!}/thumbnail.webp?width=${Math.round(videoLayout.frameWidth)}&height=${Math.round(videoLayout.frameHeight)}`}
            videoRef={videRef}
            onLoad={(loadData) => {
              setIsLoading(false);
              const nextDuration = Number(loadData?.duration);
              if (Number.isFinite(nextDuration) && nextDuration > 0) {
                setDurationSeconds(nextDuration);
              }
              if (!hasTrackedVideoStartRef.current) {
                hasTrackedVideoStartRef.current = true;
                onTelemetryEvent?.('post_video_start', {
                  postType: PostType.watch,
                });
              }
            }}
            onProgress={(progressData) => {
              const currentTime = Number(progressData?.currentTime);
              if (!Number.isFinite(currentTime) || currentTime < 0) {
                return;
              }
              const effectiveDuration =
                durationSeconds > 0 ? durationSeconds : Number(progressData?.seekableDuration);
              if (!Number.isFinite(effectiveDuration) || effectiveDuration <= 0) {
                return;
              }
              const completionPct = Math.max(
                0,
                Math.min((currentTime / effectiveDuration) * 100, 100)
              );
              setProgress(Math.max(0, Math.min(currentTime / effectiveDuration, 1)));
              [25, 50, 75].forEach((milestone) => {
                if (completionPct >= milestone && !progressMilestonesRef.current.has(milestone)) {
                  progressMilestonesRef.current.add(milestone);
                  onTelemetryEvent?.('post_video_progress', {
                    postType: PostType.watch,
                    completionPct: milestone,
                    playbackMs: Math.round(currentTime * 1000),
                  });
                }
              });
            }}
            onEnd={onEnd}
          >
            <View style={{ flex: 1 }} />
          </UniversalVideoCard>
        </Pressable>
        <WatchOverlay
          item={item}
          commentCount={commentCount}
          fromSavedPosts={fromSavedPosts}
          parentRefreshContent={parentRefreshContent}
          removePost={removePost}
          progress={progress}
          onTelemetryEvent={onTelemetryEvent}
          onCommentsPress={handlePresentModalPress}
          onProfilePress={() => {
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
        />

        <BottomSheetModal
          ref={bottomSheetModalRef}
          index={0}
          snapPoints={snapPoints}
          onChange={handleSheetChanges}
          backdropComponent={renderBackdrop}
          keyboardBehavior="extend"
          enablePanDownToClose
          backgroundStyle={{
            backgroundColor: '#032f3c',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          }}
          handleIndicatorStyle={{
            backgroundColor: 'rgba(230,234,236,0.42)',
            height: 6,
            width: 44,
          }}
        >
          <View style={{ flex: 1 }}>
            <BottomSheetEntranceGlow playKey={sheetGlowPlayKey} />
            <WatchComments
              postId={String(item.id ?? item.postId ?? item._id ?? '')}
              initialCommentCount={commentCount}
              sheetOpenKey={commentsOpenKey}
              onClose={() => {
                bottomSheetModalRef.current?.dismiss();
              }}
              onCountChange={setCommentCount}
              onOpenCommentThread={handleOpenCommentThread}
              onOpenMentionProfile={handleOpenMentionProfile}
              onTelemetryEvent={onTelemetryEvent}
            />
          </View>
        </BottomSheetModal>
      </View>
    );
  }
);

export default VideoItem;
