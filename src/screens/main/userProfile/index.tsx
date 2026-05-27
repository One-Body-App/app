import React, { useCallback, useMemo, useState } from 'react';
import { InteractionManager, Share, StyleSheet, Pressable, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import Toast from 'react-native-simple-toast';
import { useDispatch, useSelector } from 'react-redux';
import { CompositeScreenProps, useFocusEffect, useTheme } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import ProfileComponent from '@/components/profile/Profile';
import CustomModal from '@/components/CustomModal';
import StyledText from '@/components/styled/Text';
import { setLoader } from '@/redux/actions/GeneralActions';
import { getProfile } from '@/src/redux/actions/AuthActions';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { ApiCall } from '@/services/api';
import {
  ExploreStackParamsList,
  MainBottomStackParamsList,
  MainDrawerParamsList,
  PrayerWallStackParamsList,
} from '@/src/navigator/types';
import { Colors } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import { User } from '@/utils/types';
import { getProfileDisplayName } from '@/components/profile/profileUtils';

function HeaderBackButton({ onPress, color }: { onPress: () => void; color: string }) {
  return (
    <Pressable onPress={onPress} style={{ marginLeft: spacing.x10, padding: spacing.x5 }}>
      <Ionicons name="chevron-back" size={30} color={color} />
    </Pressable>
  );
}

function HeaderMenuButton({ onPress, color }: { onPress: () => void; color: string }) {
  return (
    <Pressable onPress={onPress} style={{ marginRight: spacing.x10, padding: spacing.x5 }}>
      <Ionicons name="ellipsis-vertical" size={22} color={color} />
    </Pressable>
  );
}

type Props = CompositeScreenProps<
  StackScreenProps<ExploreStackParamsList, 'UserProfile'>,
  CompositeScreenProps<
    StackScreenProps<PrayerWallStackParamsList, 'UserProfile'>,
    CompositeScreenProps<
      DrawerScreenProps<MainDrawerParamsList, 'Main'>,
      BottomTabScreenProps<MainBottomStackParamsList, 'HomeTab'>
    >
  >
>;

function UserProfile({ navigation, route }: Props) {
  const { id, handle } = route.params;
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const isLoading = useSelector((state: RootState) => state.general.loader);
  const currentUser = useSelector((state: RootState) => state.auth.getProfileData);
  const [user, setUser] = useState<User>();
  const [relatedUsers, setRelatedUsers] = useState<User[] | undefined>();
  const [avatarExpansionEnabled, setAvatarExpansionEnabled] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const { dark, colors } = useTheme();
  const headerColor = dark ? colors.text : Colors.primary.brand;

  const headerLeft = useMemo(
    () => <HeaderBackButton onPress={() => navigation.goBack()} color={headerColor} />,
    [headerColor, navigation]
  );

  const headerRight = useMemo(
    () => <HeaderMenuButton onPress={() => setShowActions(true)} color={headerColor} />,
    [headerColor]
  );

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      setAvatarExpansionEnabled(false);
      const interactionTask = InteractionManager.runAfterInteractions(() => {
        if (isActive) {
          setAvatarExpansionEnabled(true);
        }
      });

      return () => {
        isActive = false;
        interactionTask.cancel();
        setAvatarExpansionEnabled(false);
      };
    }, [handle, id])
  );

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadProfile = async () => {
        dispatch(setLoader(true));

        try {
          let resolvedUserId = id;
          if (!resolvedUserId && handle) {
            const userByHandleRes = await ApiCall({
              route: `user/by-username/${encodeURIComponent(handle)}`,
              verb: 'get',
              token,
            });

            if (userByHandleRes?.status === 200) {
              resolvedUserId = userByHandleRes.response?._id ?? userByHandleRes.response?.id;
            }
          }

          if (!resolvedUserId) {
            if (isActive) {
              setUser(undefined);
              setRelatedUsers(undefined);
            }
            return;
          }

          const [userRes, relatedUsersRes] = await Promise.all([
            ApiCall({
              route: `user/${resolvedUserId}`,
              verb: 'get',
              token,
            }),
            ApiCall({
              route: `user/get-related-users/${resolvedUserId}/1?itemsPerPage=12`,
              verb: 'get',
              token,
            }),
          ]);

          if (!isActive) {
            return;
          }

          if (userRes?.status === 200) {
            setUser(userRes.response);
          }

          if (relatedUsersRes?.status === 200) {
            setRelatedUsers(relatedUsersRes.response);
          }
        } finally {
          if (isActive) {
            dispatch(setLoader(false));
          }
        }
      };

      loadProfile().then(() => undefined);

      return () => {
        isActive = false;
      };
    }, [dispatch, handle, id, token])
  );

  useFocusEffect(
    useCallback(() => {
      if (!user) {
        return undefined;
      }

      navigation.setOptions({
        headerBackTitleVisible: false,
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: dark ? colors.text : Colors.primary.brand,
        headerTitleAlign: 'center',
        title: getProfileDisplayName(user),
        headerLeft: () => headerLeft,
        headerRight: () => headerRight,
      });

      return undefined;
    }, [colors.background, colors.text, dark, headerLeft, headerRight, navigation, user])
  );

  const handleUnSubscribe = async (userId: string) => {
    try {
      const res = await ApiCall({
        route: `user/unsubscribe/${userId}`,
        token,
        verb: 'patch',
      });
      if (res?.status === 200) {
        dispatch(getProfile.Request({ token }));
      } else {
        Toast.show('Error unfollowing, please try again later.', Toast.LONG);
      }
    } catch (error) {
      Toast.show('Error unfollowing, please try again later.', Toast.LONG);
    }
  };

  const handleSubscribe = async (userId: string) => {
    try {
      const res = await ApiCall({
        route: `user/subscribe/${userId}`,
        token,
        verb: 'patch',
      });
      if (res?.status === 200) {
        dispatch(getProfile.Request({ token }));
      } else {
        Toast.show('Error following, please try again later.', Toast.LONG);
      }
    } catch (error) {
      Toast.show('Error following, please try again later.', Toast.LONG);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      {user && currentUser ? (
        <ProfileComponent
          profileData={user}
          currentUser={currentUser}
          relatedUsers={relatedUsers}
          handleSubscribe={handleSubscribe}
          handleUnSubscribe={handleUnSubscribe}
          avatarExpansionEnabled={avatarExpansionEnabled}
          variant="public"
        />
      ) : (
        <View />
      )}

      <CustomModal modalVisible={showActions} onclose={() => setShowActions(false)}>
        <View style={[styles.actionSheet, { backgroundColor: colors.background }]}>
          <Pressable
            style={styles.actionSheetButton}
            onPress={async () => {
              setShowActions(false);
              await Share.share({
                title: `Check out ${getProfileDisplayName(user as User)} on One Body`,
                url: `https://app.onebodyapp.com/profile/${user?.username}`,
              });
            }}
          >
            <StyledText style={styles.actionSheetText}>Share Profile</StyledText>
          </Pressable>
        </View>
      </CustomModal>
    </View>
  );
}

const styles = StyleSheet.create({
  actionSheet: {
    minHeight: 160,
    padding: spacing.x20,
  },
  actionSheetButton: {
    paddingVertical: spacing.x13,
  },
  actionSheetText: {
    color: Colors.neutral.brand,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default UserProfile;
