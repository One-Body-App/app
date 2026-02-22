import { ActivityIndicator, TouchableHighlight, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useState, useEffect, PropsWithChildren, useRef, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { useToast } from 'react-native-toast-notifications';
import { GiphyMedia } from '@giphy/react-native-sdk';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';
import {
  BottomSheetModal,
  BottomSheetFlatList,
  BottomSheetFlatListMethods,
  BottomSheetBackdrop,
  BottomSheetFooter,
} from '@gorhom/bottom-sheet';
import BaseItem from '@/src/components/listItems/BaseItem';
import StyledText from '@/src/components/styled/Text';
import styles from '@/screens/home/watch/styles';
import { CommentPost, PostType, SocialPostReaction, WatchPost } from '@/utils/types';

import { Colors, Typography } from '@/src/styles';
import { RootState } from '@/src/redux/reducers/rootReducer';
import {
  HomeStackParamsList,
  MainBottomStackParamsList,
  MainDrawerParamsList,
} from '@/src/navigator/types';
import CommentItem from '@/src/components/comments/CommentItem';
import { ApiCall } from '@/src/services/api';
import CommentField from '@/src/components/comments/Field';
import { spacing } from '@/src/styles/spacing';
import CustomVideo from '@/src/components/CustomVideo';

type VideoItemProps = {
  item: WatchPost;
  viewHeight: number;
  width: number;
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

    const [comments, setComments] = useState<CommentPost[]>([]);
    const [isEditingComment, setIsEditingComment] = useState<boolean>(false);
    const [editingCommentId, setEditingCommentId] = useState<string>('');
    const [mediaGif, setGif] = useState<GiphyMedia | null>(null);
    const [isEndOfCommentsList, setIsEndOfCommentsList] = useState(false);
    const [isRefreshing, setIsCommentsRefreshing] = useState(false);
    const token = useSelector((state: RootState) => state.auth.userToken);
    const [isEndOfList, setIsEndOfList] = useState(false);
    const [page, setPage] = useState(1);
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);

    const navigation = useNavigation<ScreenNavigationProp>();
    const user = useSelector((state: RootState) => state.auth.getProfileData);
    const toast = useToast();
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);
    const commentList = useRef<BottomSheetFlatListMethods>(null);
    // variables
    const snapPoints = useMemo(() => ['50%', '85%'], []);

    // callbacks
    const handlePresentModalPress = useCallback(() => {
      bottomSheetModalRef.current?.present();
      getComments(1);
    }, []);

    const handleSheetChanges = useCallback((index: number) => {
      if (index == -1) {
        setIsPaused(false);
      } else if (index > -1) {
        setIsPaused(true);
      }
    }, []);

    const videRef = useRef</* Video */ any>(null);
    let myReaction: SocialPostReaction | undefined;

    item.reactions?.forEach((reaction) => {
      if (reaction.userId === user?._id) {
        myReaction = reaction;
      }
    });

    // useEffect(() => {
    //   if (currentIndex === activeInScreenIndex) {
    //     setIsPaused(false);
    //     setPlayedTimes(0);
    //     videRef.current?.seek(0);
    //   } else {
    //     setIsPaused(true);
    //   }
    // }, [activeInScreenIndex, currentIndex]);

    const onEnd = useCallback(() => {
      if (!isPaused && playedTimes < 2) {
        videRef.current?.seek(0);
        setPlayedTimes(playedTimes + 1);
      }
    }, [playedTimes]);

    useEffect(() => {
      if (playedTimes > 2) {
        setIsPaused(true);
      }
    }, [playedTimes]);

    const refreshContent = (showRefreshIndicator?: boolean) => {
      setIsEndOfList(false);
      setPage(1);
      getComments(1);
      setIsCommentsRefreshing(true);
      if (showRefreshIndicator) {
        setShowRefreshIndicator(true);
      }
    };

    const getComments = async (page: number) => {
      setIsLoading(true);
      try {
        const result = await ApiCall({
          route: `comments/watch/${item.id}?page=${page}`,
          token,

          verb: 'get',
        });

        setIsLoading(false);
        setIsCommentsRefreshing(false);
        let newComments = [];

        if (result.status === 200) {
          if (page === 1) {
            newComments = result?.response.content ?? [];

            setIsEndOfCommentsList(false);
          } else {
            newComments = [...comments, ...(result?.response.content ?? [])];
            if (!result?.response.content || result?.response.content.length < 1) {
              setIsEndOfCommentsList(true);
            }
          }

          setComments(newComments);
        }
      } catch (e) {
        setIsCommentsRefreshing(false);
        setIsLoading(false);
      }
    };

    const publishComment = async (content?: string) => {
      setIsLoading(true);

      try {
        const result = await ApiCall({
          route: `comments/watch/${item.id}`,
          token,
          verb: 'post',
          params: {
            content,
            gif: mediaGif,
          },
        });

        setIsLoading(false);

        if (result.status === 200) {
          refreshContent();
          getComments(1);
          // commentList.current?.scrollToEnd();
        }
      } catch (e) {
        setIsLoading(false);
      }
    };

    const editComment = async (id: string, content: string) => {
      try {
        const res = await ApiCall({
          route: `comments/watch/${item.id}/${id}`,
          verb: 'patch',
          token,
          params: {
            content,
            gif: mediaGif,
          },
        });

        if (res?.status === 200) {
          toast.show('Comment modified successfully', {
            id: 'successMessage',
            type: 'success',
            placement: 'bottom',
          });
          await getComments(1);
        }
      } catch (e: any) {
        console.log('saga error -- ', e.toString());
      }
    };

    const removeComment = async (type: string, id: string) => {
      try {
        const res = await ApiCall({
          route: `comments/watch/${item.id}/${id}`,
          verb: 'delete',
          token,
        });

        if (res?.status === 200) {
          await getComments(1);
        }
      } catch (e: any) {
        console.log('saga error -- ', e.toString());
      }
    };

    const renderBackdrop = useCallback(
      (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={0} appearsOnIndex={1} />,
      []
    );

    const renderFooter = useCallback(
      (props: any) => (
        <BottomSheetFooter {...props} bottomInset={24}>
          {!isEditingComment ? (
            <CommentField
              mediaGif={mediaGif}
              setGif={setGif}
              publishComment={publishComment}
              isEditingComment={false}
              isFromBottomField
            />
          ) : null}
        </BottomSheetFooter>
      ),
      [isEditingComment, mediaGif, publishComment]
    );

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
              resizeMode="contain"
              style={[styles.video, { width, height: viewHeight }]}
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
              commentNumber: item.commentNumber,
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
              onTelemetryEvent?.('open_comments', {
                postType: PostType.watch,
              });
              handlePresentModalPress();
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

        <BottomSheetModal
          ref={bottomSheetModalRef}
          index={1}
          snapPoints={snapPoints}
          onChange={handleSheetChanges}
          backdropComponent={renderBackdrop}
          footerComponent={renderFooter}
          keyboardBehavior="extend"
        >
          <BottomSheetFlatList
            ref={commentList}
            data={comments}
            refreshing={isRefreshing && showRefreshIndicator}
            style={{ flex: 1 }}
            onEndReachedThreshold={0.8}
            onEndReached={() => {
              if (!isLoading && !isRefreshing && !isEndOfList) setPage(page + 1);
            }}
            onRefresh={() => {
              refreshContent(true);
            }}
            ListHeaderComponent={() => {
              return (
                <View style={{ paddingHorizontal: spacing.x16 }}>
                  <StyledText style={[Typography.header.h2]}>Comments</StyledText>
                </View>
              );
            }}
            ListEmptyComponent={() => {
              if (isLoading) {
                return <ActivityIndicator />;
              }

              return null;
            }}
            renderItem={({ item }) => {
              let myReaction: SocialPostReaction | undefined;

              item.reactions?.forEach((reaction: SocialPostReaction) => {
                if (reaction.userId === user?._id) {
                  myReaction = reaction;
                }
              });

              return (
                <CommentItem
                  removePost={removeComment}
                  editCommentAction={editComment}
                  onPress={() => {
                    // if (post?.userData._id && post.userData._id != user?._id) {
                    //   // navigation.navigate('UserProfile', {
                    //   //   id: post?.userData._id,
                    //   // });
                    // }
                  }}
                  setEditingComment={(isEditingComment: boolean) => {
                    if (isEditingComment) setGif(item.gif ?? null);
                    setIsEditingComment(isEditingComment);
                    if (item.commentId) setEditingCommentId(item.commentId);
                  }}
                  postData={{
                    id: item.commentId,
                    content: item.content,
                    reactions: item.reactions,
                    myReaction,
                    edited: item.edited,
                    gif:
                      isEditingComment && editingCommentId === item.commentId ? mediaGif : item.gif,
                  }}
                  userData={item.userData}
                />
              );
            }}
          />
        </BottomSheetModal>
      </View>
    );
  }
);

export default VideoItem;
