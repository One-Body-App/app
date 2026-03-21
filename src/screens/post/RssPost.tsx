import { StackScreenProps } from '@react-navigation/stack';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Platform, SafeAreaView, StatusBar, View } from 'react-native';
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

import { spacing } from '@/src/styles/spacing';
import { borderWidth } from '@/src/styles/outlines';
import { ArticleType, CommentPost, PostType, SocialPost } from '@/utils/types';

import ArticleItem from '@/src/components/listItems/ArticleItem';
import globalStyle from '@/components/listItems/style';
import VideoItem from '../home/watch/VideoItem';
import CommentThread from '@/components/comments/Thread';
import {
  getCommentId,
  toSerializableCommentSnapshot,
} from '@/components/comments/commentListUtils';

type Props = StackScreenProps<MainStackParamList, 'SingleRss'>;
function RssPost({ navigation, route }: Props) {
  const [post, setPost] = useState<SocialPost>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);

  const token = useSelector((state: RootState) => state.auth.userToken);
  const { colors, dark } = useTheme();
  const backNavigationInFlightRef = useRef(false);
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

  const showModal = (_item: ArticleType) => {};

  const getRssPost = useCallback(async () => {
    setIsLoading(true);

    try {
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
          setPost(result.response);
        } else {
          setIsNotFound(true);
        }
      } else {
        setIsNotFound(true);
      }
    } catch (e) {
      setIsLoading(false);
      setIsNotFound(true);
    }
  }, [route.params?.postId, token]);

  // useEffect(() => {
  //   if (post) {
  //     navigation.setOptions({
  //       title: `${post.userData.name}'s Post`,
  //     });
  //   }
  // }, [post]);

  useMountEffect(() => {
    if (route.params?.postId) {
      getRssPost();
    }
  });

  const commentType = route.params?.postType === 'watch' ? PostType.watch : PostType.rss;
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {Platform.OS === 'android' ? (
        <>
          <StatusBar
            barStyle={dark ? 'light-content' : 'dark-content'}
            backgroundColor={colors.background}
          />
          <Header
            title="Comment"
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
      {post ? (
        <CommentThread
          type={commentType}
          postId={route.params?.postId ?? ''}
          threadRootCommentId={route.params?.threadRootCommentId}
          threadRootCommentSnapshot={route.params?.threadRootCommentSnapshot}
          onOpenCommentThread={openCommentThread}
          enablePagination
          onPostRefresh={getRssPost}
          scrollToEndOnPublish
          headerContainerStyle={{
            paddingHorizontal: 0,
            paddingTop: 0,
            paddingBottom: 0,
            borderBottomWidth: 0,
          }}
          header={
            route.params?.postType === 'watch' ? (
              <VideoItem
                currentIndex={0}
                item={post}
                viewHeight={200}
                width={50}
                fromSavedPosts={false}
                onShowDismissCard={undefined}
              />
            ) : (
              <ArticleItem
                item={post}
                imageSizeType="contain"
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
                showModal={showModal}
              />
            )
          }
        />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          {isLoading ? (
            <ActivityIndicator
              animating={isLoading}
              size="small"
              color={Colors.neutral[200]}
              style={{ marginRight: spacing.x10 }}
            />
          ) : (
            <StyledText>Not Found</StyledText>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

export default RssPost;
