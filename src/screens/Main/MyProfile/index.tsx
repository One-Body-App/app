import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Share, Platform } from 'react-native';

import { SceneRendererProps } from 'react-native-tab-view';
import TwitterFlatlist from '@/src/components/TwitterFlatlist';
import BlogFlatlist from '@/src/components/BlogFlatlist';
import InstagramFlatlist from '@/src/components/InstagramFlatlist';

import { CompositeScreenProps } from '@react-navigation/native';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { StackScreenProps } from '@react-navigation/stack';
import {
  MainBottomStackParamsList,
  MainDrawerParamsList,
  MyProfileStackParamsList,
} from '@/src/navigator/types';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { Colors } from '@/src/styles';

import { spacing } from '@/src/styles/spacing';
import { Setting2 } from 'iconsax-react-native';

import Profile from '@/src/components/Profile';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useSelector } from 'react-redux';
import SettingsSheet from './SettingsSheet';

type Props = CompositeScreenProps<
  StackScreenProps<MyProfileStackParamsList, 'MyProfile'>,
  CompositeScreenProps<
    DrawerScreenProps<MainDrawerParamsList, 'Main'>,
    BottomTabScreenProps<MainBottomStackParamsList, 'HomeTab'>
  >
>;

const MyProfile = ({ navigation, route }: Props) => {
  const user = useSelector((state: RootState) => state.auth.getProfileData);

  const [showSettings, setShowSettings] = useState<boolean>(false);

  const [scrollPosition, setScrollPosition] = React.useState(0);
  const [direction, setDirection] = React.useState('');

  const updateScrollPosition = (position: number) => {
    if (
      (position > scrollPosition || position == scrollPosition) &&
      scrollPosition - position < 0 &&
      scrollPosition - position < -45
    ) {
      setDirection('down');
    } else if (
      position < scrollPosition &&
      scrollPosition - position > 0 &&
      scrollPosition - position > 55
    ) {
      setDirection('up');
    }

    setScrollPosition(position);
  };

  useEffect(() => {
    if (user?.influencerProfile) {
      const routes = [];
      if (user?.influencerProfile?.twitterId) {
        routes.push({ key: 'Twitter', title: 'Twitter' });
      }

      if (user?.influencerProfile?.rssUrl) {
        routes.push({ key: 'Blog', title: 'Blog/News' });
      }

      if (user?.influencerProfile?.instagramId) {
        routes.push({ key: 'Instagram', title: 'Instagram' });
      }
      // setRoutes(routes);
    }
  }, [user]);

  React.useEffect(() => {
    navigation
      .getParent()
      ?.getParent()
      ?.setOptions({
        headerRight: () => (
          <View style={{ flexDirection: 'row', paddingRight: spacing.x24 }}>
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
              {Platform.OS == 'android' ? (
                <Ionicons name="share-social-outline" size={24} color={Colors.primary.brand} />
              ) : (
                <Ionicons name="share-outline" size={24} color={Colors.primary.brand} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setShowSettings(true);
              }}
            >
              <Setting2
                style={{ height: 24, width: 24 }}
                color={Colors.primary.brand}
                strokeWidth={0.2}
              />
            </TouchableOpacity>
          </View>
        ),
      });
  }, [navigation, user]);

  const renderScene = ({
    route,
    jumpTo,
  }: SceneRendererProps & {
    route: any;
  }) => {
    switch (route.key) {
      case 'Instagram':
        return (
          <InstagramFlatlist
            setScrollPosition={updateScrollPosition}
            jumpTo={jumpTo}
            currentUser={user}
            {...route}
          />
        );
      case 'Blog':
        return (
          <BlogFlatlist
            setScrollPosition={updateScrollPosition}
            {...route}
            jumpTo={jumpTo}
            currentUser={user}
          />
        );
      case 'Twitter':
        return (
          <TwitterFlatlist
            setScrollPosition={updateScrollPosition}
            currentUser={user}
            jumpTo={jumpTo}
            {...route}
          />
        );
    }
  };

  if (!user) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <Profile profileData={user} currentUser={user} />
      <SettingsSheet userData={user} showModal={showSettings} setShowModal={setShowSettings} />
    </View>
  );
};
export default MyProfile;
