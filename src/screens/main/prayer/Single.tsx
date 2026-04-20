/* eslint-disable react/jsx-no-useless-fragment */
import { StackScreenProps } from '@react-navigation/stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, SafeAreaView, StatusBar, View } from 'react-native';
import Toast from 'react-native-simple-toast';
import { useSelector } from 'react-redux';
import { CommonActions, useTheme } from '@react-navigation/native';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { ApiCall } from '@/services/api';
import StyledText from '@/components/styled/Text';
import Header from '@/components/Header';
import GoBackIcon from '@/components/GoBackIcon';
import { HomeStackParamsList, PrayerWallStackParamsList } from '@/src/navigator/types';
import { Colors } from '@/src/styles';
import { borderRadius, borderWidth } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import { CommentPost, PostType, PrayerPost } from '@/utils/types';

import PrayerItem from '@/components/listItems/PrayerItem';
import CommentThread from '@/components/comments/Thread';
import {
  getCommentId,
  toSerializableCommentSnapshot,
} from '@/components/comments/commentListUtils';
import { setFeedTelemetryAuthToken } from '@/services/feedTelemetry';
import {
  createPostTelemetryRequestId,
  trackPostTelemetry,
  type CanonicalPostTelemetryEventName,
  type PostTelemetryEventInput,
} from '@/services/postTelemetry';
import {
  deleteOwnedPost,
  emitFeedItemUnavailable,
  emitOwnedPostDeleted,
  getFeedItemUnavailableMessage,
} from '@/services/ownedPostDeletion';

type Props = StackScreenProps<PrayerWallStackParamsList, 'Single'>;
function SinglePrayer({ navigation, route }: Props) {
  const [prayer, setPrayer] = useState<PrayerPost>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const unavailableHandledRef = useRef(false);

  const token = useSelector((state: RootState) => state.auth.userToken);
  const { colors, dark } = useTheme();
  const postId = route.params?.postId;
  const returnTo = route.params?.returnTo;

  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const requestIdRef = useState(() => createPostTelemetryRequestId())[0];
  const resetToPrayerWallIndex = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [
          {
            name: 'MainRoot',
          },
          {
            name: 'PrayerWall',
            params: {
              screen: 'index',
            },
          },
        ],
      })
    );
  }, [navigation]);

  const resetToHomePrayerFeed = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({
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
                  params: {
                    selectedTab: 'pray' as HomeStackParamsList['Home']['selectedTab'],
                    refreshToken: Date.now(),
                  },
                },
              },
            },
          },
        ],
      })
    );
  }, [navigation]);

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    if (returnTo === 'home_pray') {
      resetToHomePrayerFeed();
      return;
    }

    resetToPrayerWallIndex();
  };

  const getPostPrayer = useCallback(async () => {
    if (!postId) {
      return;
    }

    const handleUnavailablePost = (message?: string) => {
      if (unavailableHandledRef.current) {
        return;
      }

      unavailableHandledRef.current = true;
      emitFeedItemUnavailable({
        type: PostType.prayer,
        id: postId,
      });
      Toast.show(message || 'This post is no longer available.', Toast.SHORT);
      handleBackPress();
    };

    setIsLoading(true);
    try {
      const result = await ApiCall({
        route: `prayer/${postId}`,
        token,

        verb: 'get',
      });

      setIsLoading(false);

      if (result.status === 200) {
        if (result.response) {
          unavailableHandledRef.current = false;
          setPrayer(result.response);
        } else {
          handleUnavailablePost();
        }
      } else {
        handleUnavailablePost(getFeedItemUnavailableMessage(result.response));
      }
    } catch (e) {
      setIsLoading(false);
      handleUnavailablePost();
    }
  }, [handleBackPress, postId, token]);

  const removePost = async (type: string, id: string) => {
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
  };

  const editPost = async (id: string) => {
    navigation.navigate('Prayer', { postId: id, returnTo });
    // setIsEditing(true);
  };

  const openCommentThread = useCallback(
    (comment: CommentPost) => {
      const commentId = getCommentId(comment);
      if (!postId || !commentId) {
        return;
      }

      navigation.push('Single', {
        postId,
        threadRootCommentId: commentId,
        threadRootCommentSnapshot: toSerializableCommentSnapshot(comment),
        returnTo,
      });
    },
    [navigation, postId, returnTo]
  );

  const trackPrayerTelemetry = useCallback(
    (
      eventName: CanonicalPostTelemetryEventName,
      metadata?: Record<string, unknown>,
      overrides?: Partial<PostTelemetryEventInput>
    ) => {
      if (!postId) {
        return;
      }

      trackPostTelemetry({
        postId,
        postType: 'prayer',
        contentType: prayer?.category || 'prayer',
        authorId: prayer?.userData?._id,
        userId: user?._id ? String(user._id) : undefined,
        surface: 'prayer_portal',
        surfaceTab: 'detail',
        entrypoint: 'prayer_post_detail',
        requestId: requestIdRef,
        isOwnPost:
          Boolean(user?._id) && Boolean(prayer?.userData?._id)
            ? String(user._id) === String(prayer.userData._id)
            : undefined,
        isRepost: false,
        privacyState: prayer?.private ? 'private' : 'public',
        ...overrides,
        eventName,
        metadata,
      });
    },
    [postId, prayer, requestIdRef, user?._id]
  );

  useEffect(() => {
    setFeedTelemetryAuthToken(token || undefined);
    getPostPrayer();
  }, [getPostPrayer, token]);

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
      <View style={{ flex: 1 }}>
        {prayer ? (
          <>
            <CommentThread
              type={PostType.prayer}
              postId={postId ?? ''}
              threadRootCommentId={route.params?.threadRootCommentId}
              threadRootCommentSnapshot={route.params?.threadRootCommentSnapshot}
              onOpenCommentThread={openCommentThread}
              onTelemetryEvent={trackPrayerTelemetry}
              isPrivate={Boolean(prayer.private)}
              hideComposer={prayer.answered}
              headerContainerStyle={{
                paddingHorizontal: 0,
                paddingTop: 0,
                paddingBottom: 0,
                borderBottomWidth: 0,
              }}
              header={
                <PrayerItem
                  editPost={editPost}
                  removePost={prayer.answered ? undefined : removePost}
                  item={prayer}
                  onTelemetryEvent={trackPrayerTelemetry}
                  style={{
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
                />
              }
              footer={
                prayer.answered ? (
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
                ) : null
              }
              onUserPress={() => {
                if (!prayer.private && prayer?.userData._id && prayer.userData._id !== user?._id) {
                  navigation.navigate('UserProfile', {
                    id: prayer?.userData._id,
                  });
                }
              }}
            />
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
}

export default SinglePrayer;
