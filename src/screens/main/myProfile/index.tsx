/* eslint-disable react/no-unstable-nested-components */
import React, { createRef, useEffect, useState } from 'react';
import { View, TouchableOpacity, Share, Platform, FlatList } from 'react-native';

import { CompositeScreenProps, useTheme } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { Setting2 } from 'iconsax-react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import { Colors } from '@/src/styles';

import { spacing } from '@/src/styles/spacing';

import Profile from '@/components/profile/Profile';

import {
  MainBottomStackParamsList,
  MainDrawerParamsList,
  MyProfileStackParamsList,
} from '@/src/navigator/types';
import { RootState } from '@/src/redux/reducers/rootReducer';
import SettingsSheet from './SettingsSheet';

type Props = CompositeScreenProps<
  StackScreenProps<MyProfileStackParamsList, 'MyProfile'>,
  CompositeScreenProps<
    DrawerScreenProps<MainDrawerParamsList, 'Main'>,
    BottomTabScreenProps<MainBottomStackParamsList, 'HomeTab'>
  >
>;

function MyProfile({ navigation, route }: Props) {
  const user = useSelector((state: RootState) => state.auth.getProfileData);

  const [showSettings, setShowSettings] = useState<boolean>(false);
  const { dark, colors } = useTheme();
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            style={{ marginRight: spacing.x16 }}
            onPress={() => {
              Share.share({
                title:
                  // profileData?._id == currentUser._id ?
                  `Check my profile on One Body App`,
                // : 'Check this profile on One Body App`',
                // message: `Check my profile in One Body App`,
                url: `https://app.onebodyapp.com/profile/${user?.username}`,
              });
            }}
          >
            {Platform.OS === 'android' ? (
              <Ionicons
                name="share-social-outline"
                size={24}
                color={dark ? colors.text : Colors.primary.brand}
              />
            ) : (
              <Ionicons
                name="share-outline"
                size={24}
                color={dark ? colors.text : Colors.primary.brand}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setShowSettings(true);
            }}
          >
            <Setting2
              size={24}
              style={{ height: 24, width: 24 }}
              color={dark ? colors.text : Colors.primary.brand}
              strokeWidth={0.2}
            />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, user]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setRefresh(true);
    });

    return unsubscribe;
  }, [navigation]);

  const [refresh, setRefresh] = useState(false);
  if (!user) {
    return null;
  }

  const socialList = createRef<FlatList>();

  return (
    <View style={{ flex: 1 }}>
      <Profile
        profileData={user}
        currentUser={user}
        refreshContent={refresh}
        setRefreshContent={setRefresh}
      />
      <SettingsSheet userData={user} showModal={showSettings} setShowModal={setShowSettings} />
    </View>
  );
}
export default MyProfile;
