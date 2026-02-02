/* eslint-disable react/jsx-no-useless-fragment */
import { StackScreenProps } from '@react-navigation/stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useTheme } from '@react-navigation/native';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { ApiCall } from '@/services/api';
import StyledText from '@/components/styled/Text';
import { PrayerWallStackParamsList } from '@/src/navigator/types';
import { Colors } from '@/src/styles';
import { borderRadius, borderWidth } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import { PostType, PrayerPost } from '@/utils/types';

import PrayerItem from '@/components/listItems/PrayerItem';
import CommentThread from '@/components/comments/Thread';

type Props = StackScreenProps<PrayerWallStackParamsList, 'Single'>;
function SinglePrayer({ navigation, route }: Props) {
  const [prayer, setPrayer] = useState<PrayerPost>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const token = useSelector((state: RootState) => state.auth.userToken);
  const { colors } = useTheme();

  const user = useSelector((state: RootState) => state.auth.getProfileData);

  const getPostPrayer = async () => {
    setIsLoading(true);
    try {
      const result = await ApiCall({
        route: `prayer/${route.params?.postId}`,
        token,

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

  const removePost = async (type: string, id: string) => {
    try {
      const res = await ApiCall({
        route: `prayer/${id}`,
        verb: 'delete',
        token,
      });

      if (res?.status == 200) {
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
            <CommentThread
              type={PostType.prayer}
              postId={route.params?.postId ?? ''}
              hideComposer={prayer.answered}
              header={
                <PrayerItem
                  editPost={editPost}
                  removePost={prayer.answered ? undefined : removePost}
                  item={prayer}
                  style={{
                    borderBottomColor: Colors.neutral[800],
                    borderBottomWidth: borderWidth.thin,
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
                if (!prayer.private && prayer?.userData._id && prayer.userData._id != user?._id) {
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
