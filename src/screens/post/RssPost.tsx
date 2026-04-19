import { StackScreenProps } from '@react-navigation/stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, SafeAreaView, StatusBar, View } from 'react-native';
import Toast from 'react-native-simple-toast';
import { useSelector } from 'react-redux';
import { useTheme } from '@react-navigation/native';
import useMountEffect from '@/src/hooks/useMountEffect';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { ApiCall } from '@/src/services/api';
import StyledText from '@/components/styled/Text';
import Header from '@/components/Header';
import GoBackIcon from '@/components/GoBackIcon';
import { MainStackParamList } from '@/src/navigator/types';
import { Colors } from '@/src/styles';
import { creatorBlogService } from '@/src/services/creatorBlogs';
import type { CreatorBlogRecord } from '@/src/services/creatorBlogs';

import { spacing } from '@/src/styles/spacing';
import { borderWidth } from '@/src/styles/outlines';
import { CommentPost, PostType, SocialPost } from '@/utils/types';

import ArticleItem from '@/src/components/listItems/ArticleItem';
import globalStyle from '@/components/listItems/style';
import VideoItem from '../home/watch/VideoItem';
import CommentThread from '@/components/comments/Thread';
import {
  getCommentId,
  toSerializableCommentSnapshot,
} from '@/components/comments/commentListUtils';
import CreatorBlogReader from '@/src/screens/blogs/CreatorBlogReader';
import { setFeedTelemetryAuthToken } from '@/services/feedTelemetry';
import {
  deleteOwnedPost,
  emitFeedItemUnavailable,
  emitOwnedPostDeleted,
  getFeedItemUnavailableMessage,
} from '@/services/ownedPostDeletion';
import {
  createPostTelemetryRequestId,
  trackPostTelemetry,
  type CanonicalPostTelemetryEventName,
  type PostTelemetryEventInput,
} from '@/services/postTelemetry';

type Props = StackScreenProps<MainStackParamList, 'SingleRss'>;
function RssPost({ navigation, route }: Props) {
  const [post, setPost] = useState<SocialPost>();
  const [localBlog, setLocalBlog] = useState<CreatorBlogRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);

  const token = useSelector((state: RootState) => state.auth.userToken);
  const currentUser = useSelector((state: RootState) => state.auth.getProfileData);
  const { colors, dark } = useTheme();
  const backNavigationInFlightRef = useRef(false);
  const unavailableHandledRef = useRef(false);
  const requestIdRef = useRef(createPostTelemetryRequestId());
  const resetToHomeFeed = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'MainRoot',
          params: {
            screen: 'Main',
            params: {
              screen: 'HomeTab',
              params: {
                screen: 'Home',
              },
            },
          },
        } as any,
      ],
    });
  }, [navigation]);
  const handleBackPress = () => {
    if (backNavigationInFlightRef.current) {
      return;
    }

    backNavigationInFlightRef.current = true;
    setTimeout(() => {
      backNavigationInFlightRef.current = false;
    }, 350);

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    resetToHomeFeed();
  };

  const getRssPost = useCallback(async () => {
    setIsLoading(true);
    setIsNotFound(false);

    const handleUnavailablePost = (message?: string) => {
      if (route.params?.postType !== 'watch' || unavailableHandledRef.current) {
        return;
      }

      unavailableHandledRef.current = true;
      emitFeedItemUnavailable({
        type: PostType.watch,
        id: route.params?.postId ?? '',
      });
      Toast.show(message || 'This post is no longer available.', Toast.SHORT);
      handleBackPress();
    };

    try {
      const localRecord = await creatorBlogService.getBlogById(route.params?.postId || '');
      if (localRecord) {
        setLocalBlog(localRecord);
        setPost(undefined);
        setIsLoading(false);
        return;
      }

      const result = await ApiCall({
        route: `rss/${route.params?.postId}`,
        token,

        verb: 'get',
      });
      console.log('🚀 ~ RssPost ~ route:', route.params?.postId);
      console.log('🚀 ~ getRssPost ~ result :', result);
      // 🚀 ~ RssPost ~ route: 65fde17b81cdc6d0267dcb34
      // getRssPost ~ result : {"response": "", "status": 200}
      // maybe its just returning data from backend.

      setIsLoading(false);

      if (result.status === 200) {
        if (result.response) {
          unavailableHandledRef.current = false;
          setLocalBlog(null);
          setPost(result.response);
        } else {
          setIsNotFound(true);
          handleUnavailablePost();
        }
      } else {
        setIsNotFound(true);
        handleUnavailablePost(getFeedItemUnavailableMessage(result.response));
      }
    } catch (e) {
      setIsLoading(false);
      setIsNotFound(true);
      handleUnavailablePost();
    }
  }, [handleBackPress, route.params?.postId, route.params?.postType, token]);

  // useEffect(() => {
  //   if (post) {
  //     navigation.setOptions({
  //       title: `${post.userData.name}'s Post`,
  //     });
  //   }
  // }, [post]);

  useEffect(() => {
    setFeedTelemetryAuthToken(token || undefined);
  }, [token]);

  useMountEffect(() => {
    if (route.params?.postId) {
      getRssPost();
    }
  });

  const commentType = route.params?.postType === 'watch' ? PostType.watch : PostType.rss;
  const removeWatchPost = useCallback(
    async (type: string, id: string) => {
      const normalizedId = String(id ?? '').trim();
      if (normalizedId.length < 1) {
        Toast.show('Unable to delete this post right now.', Toast.SHORT);
        return;
      }

      const result = await deleteOwnedPost({
        type,
        id: normalizedId,
        token: token ?? undefined,
      });

      if (!result.ok) {
        Toast.show(result.message || 'Unable to delete this post right now.', Toast.SHORT);
        return;
      }

      emitOwnedPostDeleted({
        type: result.type,
        id: normalizedId,
      });
      handleBackPress();
    },
    [handleBackPress, token]
  );

  const openCommentThread = useCallback(
    (comment: CommentPost) => {
      const commentId = getCommentId(comment);
      const currentPostId = route.params?.postId;
      if (!commentId || !currentPostId) {
        return;
      }

      navigation.push('SingleRss', {
        postId: currentPostId,
        postType: route.params?.postType,
        threadRootCommentId: commentId,
        threadRootCommentSnapshot: toSerializableCommentSnapshot(comment),
      });
    },
    [navigation, route.params?.postId, route.params?.postType]
  );

  const trackSingleRssTelemetry = useCallback(
    (
      eventName: CanonicalPostTelemetryEventName,
      metadata?: Record<string, unknown>,
      overrides?: Partial<PostTelemetryEventInput>
    ) => {
      const postId = route.params?.postId;
      if (!postId) {
        return;
      }

      const resolvedPostType = route.params?.postType === 'watch' ? 'watch' : 'rss';
      trackPostTelemetry({
        postId,
        postType: resolvedPostType,
        contentType: route.params?.postType === 'watch' ? 'watch' : (post?.type ?? 'posts'),
        tags: Array.isArray((post as { tags?: unknown } | undefined)?.tags)
          ? ((post as { tags?: string[] }).tags ?? [])
          : [],
        authorId: post?.userData?._id,
        userId: currentUser?._id ? String(currentUser._id) : undefined,
        surface: resolvedPostType === 'watch' ? 'watch' : 'social_feed',
        surfaceTab: 'detail',
        entrypoint: resolvedPostType === 'watch' ? 'watch_detail' : 'single_rss',
        requestId: requestIdRef.current,
        isOwnPost:
          Boolean(currentUser?._id) && Boolean(post?.userData?._id)
            ? String(currentUser._id) === String(post.userData._id)
            : undefined,
        isRepost: Boolean((post as { repost?: unknown } | undefined)?.repost),
        privacyState:
          (post as { private?: boolean } | undefined)?.private === true ? 'private' : 'public',
        ...overrides,
        eventName,
        metadata,
      });
    },
    [currentUser?._id, post, route.params?.postId, route.params?.postType]
  );

  let contentNode = (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {isLoading ? (
        <ActivityIndicator
          animating={isLoading}
          size="small"
          color={Colors.neutral[200]}
          style={{ marginRight: spacing.x10 }}
        />
      ) : (
        <StyledText>{isNotFound ? 'Not Found' : 'Loading article...'}</StyledText>
      )}
    </View>
  );

  if (localBlog) {
    contentNode = <CreatorBlogReader blog={localBlog} />;
  } else if (post) {
    const headerNode =
      route.params?.postType === 'watch' ? (
        <VideoItem
          currentIndex={0}
          item={post}
          viewHeight={200}
          width={50}
          fromSavedPosts={false}
          removePost={removeWatchPost}
          onTelemetryEvent={trackSingleRssTelemetry}
          onShowDismissCard={undefined}
        />
      ) : (
        <ArticleItem
          item={post}
          imageSizeType="contain"
          onTelemetryEvent={trackSingleRssTelemetry}
          blogPostStyle={{
            marginHorizontal: 0,
            marginBottom: 0,
            borderRadius: 0,
            borderWidth: 0,
            borderTopWidth: 0,
            borderRightWidth: 0,
            borderLeftWidth: 0,
            borderBottomColor: Colors.neutral[800],
            borderBottomWidth: borderWidth.thin,
            shadowColor: 'transparent',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0,
            shadowRadius: 0,
            elevation: 0,
            backgroundColor: 'transparent',
          }}
          blogPostImageStyle={globalStyle.newspostimage}
        />
      );

    contentNode = (
      <CommentThread
        type={commentType}
        postId={route.params?.postId ?? ''}
        threadRootCommentId={route.params?.threadRootCommentId}
        threadRootCommentSnapshot={route.params?.threadRootCommentSnapshot}
        onOpenCommentThread={openCommentThread}
        enablePagination
        onPostRefresh={getRssPost}
        onTelemetryEvent={trackSingleRssTelemetry}
        scrollToEndOnPublish
        headerContainerStyle={{
          paddingHorizontal: 0,
          paddingTop: 0,
          paddingBottom: 0,
          borderBottomWidth: 0,
        }}
        header={headerNode}
      />
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {Platform.OS === 'android' ? (
        <>
          <StatusBar
            barStyle={dark ? 'light-content' : 'dark-content'}
            backgroundColor={colors.background}
          />
          <Header
            title={localBlog ? 'Article' : 'Comment'}
            hideBorder
            leftView={
              <GoBackIcon
                color={dark ? colors.text : Colors.primary.brand}
                goBack={handleBackPress}
              />
            }
            RightView={<View style={{ width: 20 }} />}
          />
        </>
      ) : null}
      {contentNode}
    </SafeAreaView>
  );
}

export default RssPost;
