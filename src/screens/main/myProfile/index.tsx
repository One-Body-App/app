/* eslint-disable react/no-unstable-nested-components */
import React, { useCallback, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { CompositeScreenProps, useFocusEffect, useTheme } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';

import Profile from '@/components/profile/Profile';
import {
  MainBottomStackParamsList,
  MainDrawerParamsList,
  MyProfileStackParamsList,
} from '@/src/navigator/types';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { Colors } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import SettingsSheet from './SettingsSheet';
import { getProfileDisplayName } from '@/components/profile/profileUtils';

type Props = CompositeScreenProps<
  StackScreenProps<MyProfileStackParamsList, 'MyProfile'>,
  CompositeScreenProps<
    DrawerScreenProps<MainDrawerParamsList, 'Main'>,
    BottomTabScreenProps<MainBottomStackParamsList, 'HomeTab'>
  >
>;

function MyProfile({ navigation, route }: Props) {
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const { dark, colors } = useTheme();
  const [showSettings, setShowSettings] = useState(Boolean(route.params?.openSettings));
  const [refreshToken, setRefreshToken] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setRefreshToken((previous) => previous + 1);

      if (route.params?.openSettings) {
        setShowSettings(true);
        navigation.setParams({ openSettings: undefined });
      }
    }, [navigation, route.params?.openSettings])
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
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
                return;
              }

              navigation.getParent()?.navigate('HomeTab', {
                screen: 'Home',
              });
            }}
            style={{ marginLeft: spacing.x10, padding: spacing.x5 }}
          >
            <Ionicons
              name="chevron-back"
              size={30}
              color={dark ? colors.text : Colors.primary.brand}
            />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity
            onPress={() => setShowSettings(true)}
            style={{ marginRight: spacing.x10, padding: spacing.x5 }}
          >
            <Ionicons
              name="ellipsis-vertical"
              size={22}
              color={dark ? colors.text : Colors.primary.brand}
            />
          </TouchableOpacity>
        ),
      });

      return undefined;
    }, [colors.background, colors.text, dark, navigation, user])
  );

  if (!user) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <Profile profileData={user} currentUser={user} refreshToken={refreshToken} />
      <SettingsSheet userData={user} showModal={showSettings} setShowModal={setShowSettings} />
    </View>
  );
}

export default MyProfile;
