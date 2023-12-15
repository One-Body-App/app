import { RootState } from '@/src/Redux/reducers/rootReducer';
import { ApiCall } from '@/src/Services/api';
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
      setGif(e.media);
      GiphyDialog.hide();
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

  const removePost = async (id: string) => {
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
      console.log(`comments/prayer/${route.params?.postId}/${id}`);
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
    <SafeAreaView
      style={{
        flex: 1,
        paddingHorizontal: spacing.x24,
        backgroundColor: colors.background,
      }}
    >
      {/* <TouchableWithoutFeedback
        style={{ backgroundColor: 'blue', flexGrow: 1 }}
        onPress={() => {
          if (Keyboard.isVisible()) Keyboard.dismiss();
        }}
      > */}
      <View style={{ flexGrow: 1 }}>
        {/* <KeyboardAvoidingView
        style={{
          paddingTop: spacing.x24,
          paddingBottom: spacing.x48,
          flex: 1,
          justifyContent: 'space-between',
        }}
        // style={{ flex: 1 }}
        behavior="position"
      > */}
        {/* <ScrollView style={{ flex: 1 }}> */}
        {prayer ? (
          <>
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
            <FlatList
              data={comments}
              refreshing={isRefreshing}
              style={{ flexGrow: 1, flex: 1, marginBottom: 80 }}
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
              <CommentField mediaGif={mediaGif} setGif={setGif} publishComment={publishComment} />
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
