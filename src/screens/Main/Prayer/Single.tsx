import { RootState } from '@/src/redux/reducers/rootReducer';
import { ApiCall } from '@/services/api';
import Button from '@/src/components/Button';
import MapBox, { MapSuggestion } from '@/src/components/MapBox';
import { StyledText } from '@/src/components/styled/Text';
import { StyledTextInput } from '@/src/components/styled/TextInput';
import { MainStackParamList, PrayerWallStackParamsList } from '@/src/navigator/types';
import { Colors, Spacing } from '@/src/styles';
import { button } from '@/src/styles/buttons';
import { borderRadius, borderWidth } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import { CommentPost, Location, PrayerPost, SocialPostReaction } from '@/utils/types';
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
import PrayerItem from '@/src/components/listItems/PrayerItem';
import { CloseCircle, Send } from 'iconsax-react-native';
import {
  GiphyDialog,
  GiphyDialogEvent,
  GiphyDialogMediaSelectEventHandler,
  GiphyMedia,
  GiphyMediaView,
} from '@giphy/react-native-sdk';
import CommentField from '@/src/components/comments/Field';
import CommentItem from '@/src/components/comments/CommentItem';
import { useToast } from 'react-native-toast-notifications';

type Props = StackScreenProps<PrayerWallStackParamsList, 'Single'>;
let keyboardWillShowListener: EmitterSubscription;
let onKeyboardWillHideListener: EmitterSubscription;
const SinglePrayer = ({ navigation, route }: Props) => {
  const [prayer, setPrayer] = useState<PrayerPost>();
  const [comments, setComments] = useState<CommentPost[]>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const token = useSelector((state: RootState) => state.auth.userToken);
  const [mediaGif, setGif] = useState<GiphyMedia | null>(null);
  const { colors } = useTheme();

  const [page, setPage] = useState(1);
  const [isEndOfList, setIsEndOfList] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const toast = useToast();
  const [isEditingComment, setIsEditingComment] = useState<boolean>(false);
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

  // Handling GIFs selection in GiphyDialog
  useEffect(() => {
    const handler: GiphyDialogMediaSelectEventHandler = (e) => {
      if (!isEditingComment) {
        setGif(e.media);
        GiphyDialog.hide();
      }
    };
    const listener = GiphyDialog.addListener(GiphyDialogEvent.MediaSelected, handler);
    return () => {
      listener.remove();
    };
  }, []);

  const getPostPrayer = async () => {
    setIsLoading(true);
    try {
      const result = await ApiCall({
        route: `prayer/${route.params?.postId}`,
        token: token,

        verb: 'get',
      });

      setIsLoading(false);

      if (result.status == 200) {
        setPrayer(result.response);
      }
    } catch (e) {
      setIsLoading(false);
    }
  };

  const getComments = async (page: number) => {
    setIsLoading(true);
    try {
      const result = await ApiCall({
        route: `comments/prayer/${route.params?.postId}`,
        token: token,

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
        route: `comments/prayer/${route.params?.postId}`,
        token: token,

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
        route: `prayer/${id}`,
        verb: 'delete',
        token: token,
      });

      if (res?.status == 200) {
        await getPostPrayer();
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  const editComment = async (id: string, content: string) => {
    try {
      const res = await ApiCall({
        route: `comments/prayer/${route.params?.postId}/${id}`,
        verb: 'patch',
        token: token,
        params: {
          content,
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
        route: `comments/prayer/${route.params?.postId}/${id}`,
        verb: 'delete',
        token: token,
      });

      if (res?.status == 200) {
        await getComments(1);
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  const editPost = async (id: string) => {
    navigation.navigate('Prayer', { postId: id });
    // setIsEditing(true);
  };

  useEffect(() => {
    if (route.params?.postId) {
      getPostPrayer();
    }
  }, [route.params?.postId]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1 }}>
        {prayer ? (
          <>
            {keyboardHeight == 0 ? (
              <View>
                <PrayerItem
                  editPost={editPost}
                  removePost={prayer.answered ? undefined : removePost}
                  item={prayer}
                  style={{
                    borderBottomColor: Colors.neutral[800],
                    borderBottomWidth: borderWidth.thin,
                  }}
                />
              </View>
            ) : null}
            <View style={{ flex: 1 }}>
              <FlatList
                data={comments}
                refreshing={isRefreshing}
                style={{ flexGrow: 1 }}
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
                ListEmptyComponent={() => <>{isLoading ? <ActivityIndicator /> : null}</>}
                renderItem={({ item }) => {
                  let myReaction: SocialPostReaction | undefined = undefined;

                  item.reactions?.forEach((reaction) => {
                    if (reaction.userId == user?._id) {
                      myReaction = reaction;
                    }
                  });

                  return (
                    <View>
                      <CommentItem
                        setEditingComment={setIsEditingComment}
                        removePost={prayer.answered ? undefined : removeComment}
                        editCommentAction={editComment}
                        onPress={() => {
                          if (
                            !prayer.private &&
                            prayer?.userData._id &&
                            prayer.userData._id != user?._id
                          ) {
                            navigation.navigate('UserProfile', {
                              id: prayer?.userData._id,
                            });
                          }
                        }}
                        postData={{
                          id: item.commentId,
                          content: item.content,
                          reactions: item.reactions,
                          myReaction,
                          edited: item.edited,
                          gif: item.gif,
                        }}
                        userData={item.userData}
                      />
                    </View>
                  );
                }}
              />
            </View>
            {prayer.answered ? (
              <View
                style={{
                  backgroundColor: Colors.successFeedback.background,
                  padding: spacing.x16,
                  marginHorizontal: spacing.x16,
                  borderRadius: borderRadius.small,
                }}
              >
                <StyledText style={{ color: Colors.successFeedback.text }}>
                  Praise God, prayer answered. Not collecting response at this time
                </StyledText>
              </View>
            ) : (
              <>
                {!isEditingComment ? (
                  <View style={{ top: keyboardHeight * -1 }}>
                    <CommentField
                      mediaGif={mediaGif}
                      setGif={setGif}
                      publishComment={publishComment}
                    />
                  </View>
                ) : null}
              </>
            )}
          </>
        ) : (
          <>
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
          </>
        )}
        {/* </ScrollView> */}
        {/* </KeyboardAvoidingView> */}
      </View>
      {/* </TouchableWithoutFeedback> */}
    </SafeAreaView>
  );
};

export default SinglePrayer;
