/* eslint-disable react/jsx-no-useless-fragment */
import { StackScreenProps } from '@react-navigation/stack';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, SafeAreaView, StatusBar, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useTheme } from '@react-navigation/native';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { ApiCall } from '@/services/api';
import StyledText from '@/components/styled/Text';
import Header from '@/components/Header';
import GoBackIcon from '@/components/GoBackIcon';
import { PrayerWallStackParamsList } from '@/src/navigator/types';
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

type Props = StackScreenProps<PrayerWallStackParamsList, 'Single'>;
function SinglePrayer({ navigation, route }: Props) {
  const [prayer, setPrayer] = useState<PrayerPost>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const token = useSelector((state: RootState) => state.auth.userToken);
  const { colors, dark } = useTheme();
  const postId = route.params?.postId;

  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('index');
  };

  const getPostPrayer = useCallback(async () => {
    if (!postId) {
      return;
    }
    setIsLoading(true);
    try {
      const result = await ApiCall({
        route: `prayer/${postId}`,
        token,

        verb: 'get',
      });

      setIsLoading(false);

      if (result.status === 200) {
        setPrayer(result.response);
      }
    } catch (e) {
      setIsLoading(false);
    }
  }, [postId, token]);

  const removePost = async (type: string, id: string) => {
    try {
      const res = await ApiCall({
        route: `prayer/${id}`,
        verb: 'delete',
        token,
      });

      if (res?.status === 200) {
        await getPostPrayer();
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  const editPost = async (id: string) => {
    navigation.navigate('Prayer', { postId: id });
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
      });
    },
    [navigation, postId]
  );

  useEffect(() => {
    getPostPrayer();
  }, [getPostPrayer]);

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
