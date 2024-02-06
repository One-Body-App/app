import { StackScreenProps } from '@react-navigation/stack';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  View,
  KeyboardEvent,
  TouchableWithoutFeedback,
  TouchableOpacity,
  RefreshControl,
  EmitterSubscription,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useTheme } from '@react-navigation/native';
import { Asset } from 'react-native-image-picker';
import { CloseCircle, Send } from 'iconsax-react-native';
import {
  GiphyDialog,
  GiphyDialogEvent,
  GiphyDialogMediaSelectEventHandler,
  GiphyMedia,
  GiphyMediaView,
} from '@giphy/react-native-sdk';
import { useToast } from 'react-native-toast-notifications';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { ApiCall } from '@/src/services/api';
import Button from '@/components/Button';
import MapBox, { MapSuggestion } from '@/components/MapBox';
import StyledText from '@/components/styled/Text';
import StyledTextInput from '@/components/styled/TextInput';
import { MainStackParamList, PrayerWallStackParamsList } from '@/src/navigator/types';
import { Colors, Spacing } from '@/src/styles';
import { button } from '@/src/styles/buttons';
import { borderRadius, borderWidth } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import {
  CommentPost,
  Location,
  PostType,
  PrayerPost,
  SocialPost,
  SocialPostReaction,
} from '@/utils/types';

import CommentField from '@/components/comments/Field';
import CommentItem from '@/components/comments/CommentItem';
import SocialItem from '@/components/listItems/SocialItem';

type Props = StackScreenProps<MainStackParamList, 'SinglePost'>;

let keyboardWillShowListener: EmitterSubscription;
let onKeyboardWillHideListener: EmitterSubscription;
function SinglePost({ navigation, route }: Props) {
  const [post, setPost] = useState<SocialPost>();
  const [comments, setComments] = useState<CommentPost[]>();
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

  const onKeyboardWillHide = () => {
    setKeyboardHeight(0);
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

  const refreshContent = () => {
    setIsEndOfList(false);
    setPage(1);
    getComments(1);
    setIsRefreshing(true);
  };

  useEffect(() => {
    getComments(page);
  }, [page]);

  useEffect(() => {
    if (!isEditingComment) {
      setGif(null);
    }
  }, [isEditingComment]);

  // Handling GIFs selection in GiphyDialog
  useEffect(() => {
    const handler: GiphyDialogMediaSelectEventHandler = (e) => {
      setGif(e.media);
      GiphyDialog.hide();
    };
    const listener = GiphyDialog.addListener(GiphyDialogEvent.MediaSelected, handler);
    return () => {
      listener.remove();
    };
  }, []);

  const getPost = async () => {
    setIsLoading(true);
    try {
      const result = await ApiCall({
        route: `social/post/${route.params?.postId}`,
        token,

        verb: 'get',
      });

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
        route: `comments/social/${route.params?.postId}`,
        token,

        verb: 'get',
      });

      setIsLoading(false);
      setIsRefreshing(false);
      if (result.status == 200) {
        setComments(result.response.content);
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
        route: `comments/social/${route.params?.postId}`,
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
      }
    } catch (e) {
      setIsLoading(false);
    }
  };

  const removePost = async (type: string, id: string) => {
    try {
      const res = await ApiCall({
        route: `social/${id}`,
        verb: 'delete',
        token,
      });

      if (res?.status == 200) {
        await getPost();
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  const editComment = async (id: string, content: string) => {
    try {
      const res = await ApiCall({
        route: `comments/social/${route.params?.postId}/${id}`,
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
        route: `comments/social/${route.params?.postId}/${id}`,
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

  const editPost = async (id: string) => {
    navigation.navigate('Post', { postId: id });
  };

  useEffect(() => {
    if (route.params?.postId) {
      getPost();
    }
  }, [route.params?.postId]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, top: -1 * keyboardHeight }}>
        {post ? (
          <>
            <View>
              <SocialItem
                editPost={editPost}
                removePost={removePost}
                item={post}
                socialPostviewStyle={{
                  borderBottomColor: Colors.neutral[800],
                  borderBottomWidth: borderWidth.thin,
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <FlatList
                data={comments}
                refreshing={isRefreshing}
                // style={{ flexGrow: 1, flex: 1 }}
                style={{ flexGrow: 1 }}
                // contentContainerStyle={{ paddingBottom: keyboardHeight + 80 }}
                // onEndReachedThreshold={0.5}
                // onEndReached={() => {
                //   if (!isLoading && !isRefreshing && !isEndOfList) setPage(page + 1);
                // }}
                // ListFooterComponent={() => (
                //   <View>
                //     {isEndOfList ? (
                //       <StyledText style={{ textAlign: 'center' }}>
                //         Not more social posts at this time
                //       </StyledText>
                //     ) : null}
                //   </View>
                // )}
                refreshControl={
                  <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={() => {
                      refreshContent();
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

                  item.reactions?.forEach((reaction) => {
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
              <View>
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

export default SinglePost;
