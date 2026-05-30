import React, { useCallback, useState } from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { CompositeScreenProps, useFocusEffect, useTheme } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Profile from '@/components/profile/Profile';
import StyledText from '@/components/styled/Text';
import {
  MainBottomStackParamsList,
  MainDrawerParamsList,
  MyProfileStackParamsList,
} from '@/src/navigator/types';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { Colors } from '@/src/styles';
import { borderWidth } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import SettingsSheet from './SettingsSheet';

type Props = CompositeScreenProps<
  NativeStackScreenProps<MyProfileStackParamsList, 'MyProfile'>,
  CompositeScreenProps<
    DrawerScreenProps<MainDrawerParamsList, 'Main'>,
    BottomTabScreenProps<MainBottomStackParamsList, 'HomeTab'>
  >
>;

function MyProfile({ navigation, route }: Props) {
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const { dark, colors } = useTheme();
  const insets = useSafeAreaInsets();
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

  if (!user) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: colors.background,
            borderBottomColor: dark ? Colors.neutral[900] : Colors.neutral[800],
            paddingTop: insets.top + spacing.x8,
          },
        ]}
      >
        <Pressable
          accessibilityLabel="Go to Home"
          onPress={() =>
            navigation.getParent()?.navigate('HomeTab', {
              screen: 'Home',
            })
          }
          style={styles.topBarAction}
        >
          <Ionicons
            name="chevron-back"
            size={30}
            color={dark ? colors.text : Colors.primary.brand}
          />
        </Pressable>

        <View style={styles.topBarTitleWrap}>
          <StyledText
            style={[styles.topBarTitleText, { color: dark ? colors.text : Colors.neutral.brand }]}
          >
            Profile
          </StyledText>
        </View>

        <Pressable
          accessibilityLabel="Open profile settings"
          onPress={() => setShowSettings(true)}
          style={styles.topBarAction}
        >
          <Ionicons
            name="settings-outline"
            size={25}
            color={dark ? colors.text : Colors.primary.brand}
          />
        </Pressable>
      </View>

      <View style={styles.profileWrap}>
        <Profile profileData={user} currentUser={user} refreshToken={refreshToken} variant="self" />
      </View>
      <SettingsSheet userData={user} showModal={showSettings} setShowModal={setShowSettings} />
    </View>
  );
}

const styles = StyleSheet.create({
  profileWrap: {
    flex: 1,
  },
  topBar: {
    alignItems: 'center',
    borderBottomWidth: borderWidth.hairline,
    flexDirection: 'row',
    paddingBottom: spacing.x13,
    paddingHorizontal: spacing.x16,
  },
  topBarAction: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  topBarTitleText: {
    fontSize: 18,
    fontWeight: '700',
  },
  topBarTitleWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});

export default MyProfile;
