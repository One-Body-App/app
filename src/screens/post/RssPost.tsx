import { StackScreenProps } from '@react-navigation/stack';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Platform,
  SafeAreaView,
  View,
  KeyboardEvent,
  RefreshControl,
  EmitterSubscription,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useTheme } from '@react-navigation/native';
import { GiphyMedia } from '@giphy/react-native-sdk';
import { useToast } from 'react-native-toast-notifications';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { ApiCall } from '@/src/services/api';
import StyledText from '@/components/styled/Text';
import { MainStackParamList } from '@/src/navigator/types';
import { Colors } from '@/src/styles';

import { spacing } from '@/src/styles/spacing';
import { ArticleType, CommentPost, SocialPost, SocialPostReaction } from '@/utils/types';

import CommentField from '@/components/comments/Field';
import CommentItem from '@/components/comments/CommentItem';

import ArticleItem from '@/src/components/listItems/ArticleItem';
import { styles as globalStyle } from '@/components/listItems/style';
import VideoItem from '../home/watch/VideoItem';

type Props = StackScreenProps<MainStackParamList, 'SingleRss'>;

let keyboardWillShowListener: EmitterSubscription;
let onKeyboardWillHideListener: EmitterSubscription;
function RssPost({ navigation, route }: Props) {
  const [post, setPost] = useState<SocialPost>();
  const [comments, setComments] = useState<CommentPost[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);
  const [isEditingComment, setIsEditingComment] = useState<boolean>(false);
  const [editingCommentId, setEditingCommentId] = useState<string>('');

  const token = useSelector((state: RootState) => state.auth.userToken);
  const [mediaGif, setGif] = useState<GiphyMedia | null>(null);
  const { colors } = useTheme();

  const [page, setPage] = useState(1);
  const [isEndOfList, setIsEndOfList] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const toast = useToast();
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);
  const onKeyboardWillShow = (e: KeyboardEvent) => {
    setKeyboardHeight(e.endCoordinates.height);
  };

  const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);

  const onKeyboardWillHide = () => {
    setKeyboardHeight(0);
  };

  const [show, setShow] = useState<boolean>();
  const [currentPopupItem, setCurrentPopupItem] = useState<ArticleType>();

  const commentList = useRef<FlatList>(null);

  const showModal = (item: ArticleType) => {
    setCurrentPopupItem(item);
    setShow(true);
  };

  useEffect(() => {
    if (!isEditingComment) {
      if (Platform.OS === 'ios') {
        // These listeners on ios are a little more snappy but not available on Android
        // If you want to use this on Android use keyboardDidShow/Hide
        keyboardWillShowListener = Keyboard.addListener('keyboardWillShow', onKeyboardWillShow);
        onKeyboardWillHideListener = Keyboard.addListener('keyboardWillHide', onKeyboardWillHide);
      }

      return () => {
        if (Platform.OS === 'ios') {
          onKeyboardWillHideListener.remove();
          onKeyboardWillHideListener.remove();
          // Keyboard.removeAllListeners('keyboardWillShow');

          // Keyboard.removeAllListeners('keyboardWillHide');
        }
      };
    }
  }, []);

  const refreshContent = (showRefreshIndicator?: boolean) => {
    setIsEndOfList(false);
    setPage(1);
    getComments(1);
    setIsRefreshing(true);
    if (showRefreshIndicator) {
      setShowRefreshIndicator(true);
    }
  };

  useEffect(() => {
    getComments(page);
  }, [page]);

  const getRssPost = async () => {
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

      if (result.status == 200) {
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
  };

  // useEffect(() => {
  //   if (post) {
  //     navigation.setOptions({
  //       title: `${post.userData.name}'s Post`,
  //     });
  //   }
  // }, [post]);

  const getComments = async (page: number) => {
    setIsLoading(true);
    try {
      const result = await ApiCall({
        route: `comments/rss/${route.params?.postId}?page=${page}`,
        token,

        verb: 'get',
      });

      setIsLoading(false);
      setIsRefreshing(false);
      let newComments = [];
      if (result.status == 200) {
        if (page == 1) {
          newComments = result?.response.content ?? [];

          setIsEndOfList(false);
        } else {
          newComments = [...comments, ...(result?.response.content ?? [])];
          if (!result?.response.content || result?.response.content.length < 1) {
            setIsEndOfList(true);
          }
        }

        setComments(newComments);
      }
    } catch (e) {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  const publishComment = async (content?: string) => {
    setIsLoading(true);
    try {
      const result = await ApiCall({
        route: `comments/rss/${route.params?.postId}`,
        token,
        verb: 'post',
        params: {
          content,
          gif: mediaGif,
        },
      });

      setIsLoading(false);

      if (result.status == 200) {
        refreshContent();
        getRssPost();
        commentList.current?.scrollToEnd();
      }
    } catch (e) {
      setIsLoading(false);
    }
  };

  const editComment = async (id: string, content: string) => {
    try {
      const res = await ApiCall({
        route: `comments/rss/${route.params?.postId}/${id}`,
        verb: 'patch',
        token,
        params: {
          content,
          gif: mediaGif,
        },
      });

      if (res?.status == 200) {
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
        route: `comments/rss/${route.params?.postId}/${id}`,
        verb: 'delete',
        token,
      });

      if (res?.status == 200) {
        await getComments(1);
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  useEffect(() => {
    if (route.params?.postId) {
      getRssPost();
    }
  }, [route.params?.postId]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, top: -1 * keyboardHeight }}>
        {post ? (
          <>
            <View style={{ flexGrow: 1 }}>
              <FlatList
                ref={commentList}
                data={comments}
                refreshing={isRefreshing}
                style={{ flex: 1 }}
                onEndReachedThreshold={0.8}
                onEndReached={() => {
                  if (!isLoading && !isRefreshing && !isEndOfList) setPage(page + 1);
                }}
                ListHeaderComponent={() => {
                  if (route.params?.postType === 'watch')
                    return (
                      <VideoItem
                        currentIndex={0}
                        item={post}
                        viewHeight={200}
                        width={50}
                        fromSavedPosts={false}
                        onShowDismissCard={undefined}
                      />
                    );
                  return (
                    <ArticleItem
                      item={post}
                      imageSizeType="contain"
                      blogPostStyle={{
                        marginBottom: spacing.x24,
                        backgroundColor: colors.card,
                      }}
                      blogPostImageStyle={globalStyle.newspostimage}
                      // blogPostTitleStyle={{
                      //   flexDirection: 'row',
                      //   justifyContent: 'space-between',
                      //   // marginTop: getHeight(1),
                      // }}
                      showModal={showModal}
                    />
                  );
                }}
                refreshControl={
                  <RefreshControl
                    refreshing={isRefreshing && showRefreshIndicator}
                    onRefresh={() => {
                      refreshContent(true);
                    }}
                  />
                }
                ListEmptyComponent={() => {
                  if (isLoading) {
                    return <ActivityIndicator />;
                  }

                  return null;
                }}
                renderItem={({ item }) => {
                  let myReaction: SocialPostReaction | undefined;

                  item.reactions?.forEach((reaction: SocialPostReaction) => {
                    if (reaction.userId == user?._id) {
                      myReaction = reaction;
                    }
                  });

                  return (
                    <CommentItem
                      removePost={removeComment}
                      editCommentAction={editComment}
                      onPress={() => {
                        if (post?.userData._id && post.userData._id != user?._id) {
                          // navigation.navigate('UserProfile', {
                          //   id: post?.userData._id,
                          // });
                        }
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
                          isEditingComment && editingCommentId == item.commentId
                            ? mediaGif
                            : item.gif,
                      }}
                      userData={item.userData}
                    />
                  );
                }}
              />
            </View>
            {!isEditingComment ? (
              <View style={{ flex: 0 }}>
                <CommentField
                  mediaGif={mediaGif}
                  setGif={setGif}
                  publishComment={publishComment}
                  isEditingComment={false}
                />
              </View>
            ) : null}
          </>
        ) : (
          // eslint-disable-next-line react/jsx-no-useless-fragment
          <>
            {isLoading ? (
              <ActivityIndicator
                animating={isLoading}
                size="small"
                color={Colors.neutral[200]}
                style={{ marginRight: spacing.x10 }}
              />
            ) : (
              // eslint-disable-next-line react/jsx-no-useless-fragment
              <>{isNotFound ? <StyledText>Not Found</StyledText> : null}</>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

export default RssPost;
