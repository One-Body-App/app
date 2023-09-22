import React, { useEffect, useState } from 'react';
import { Animated, View, FlatList, TouchableOpacity, ScrollView, Share } from 'react-native';
import Modal from 'react-native-modal';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-simple-toast';
import { TabView, SceneRendererProps } from 'react-native-tab-view';
import Add_badges from '@/assets/svg/Add_badges.svg';
import { getHeight, getWidth } from '@/utils/ResponsiveFun';
import Button from '@/src/components/Button';
import { styles } from './styles';
import FastImage from 'react-native-fast-image';
import { GeneralStyle } from '../../../constants/GeneralStyle';
import TwitterFlatlist from '@/src/components/TwitterFlatlist';
import BlogFlatlist from '@/src/components/BlogFlatlist';
import InstagramFlatlist from '@/src/components/InstagramFlatlist';
import Selected from '@/assets/svg/Selected.svg';
import { getProfile, getBadges, setUserBadges } from '@/redux//actions/AuthActions';

import { CompositeScreenProps, useTheme } from '@react-navigation/native';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { StackScreenProps } from '@react-navigation/stack';
import { Badge } from '@/utils/types';
import { OpenURLButton } from '@/src/Services/constants';
import {
  MainBottomStackParamsList,
  MainDrawerParamsList,
  MyProfileStackParamsList,
} from '@/src/navigator/types';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { StyledText } from '@/src/components/styled/Text';
import { Colors, Spacing, Typography } from '@/src/styles';
import { borderRadius, borderWidth } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import {
  Add,
  Calendar,
  HomeHashtag,
  Link2,
  Link21,
  Location,
  Setting2,
  ShieldTick,
} from 'iconsax-react-native';
import { button } from '@/src/styles/buttons';

import { format, parseISO } from 'date-fns';
import Profile from '@/src/components/Profile';

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
  }, [navigation]);

  useEffect(() => {
    setShowSettings(route.params?.openSettings ?? false);
  }, [route.params?.openSettings]);

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

  const { colors } = useTheme();

  if (!user) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <Profile user={user} currentUserId={user._id} />

      <Modal
        swipeDirection={['down']}
        avoidKeyboard={true}
        backdropOpacity={0.3}
        isVisible={showSettings}
        onBackdropPress={() => setShowSettings(false)}
        onSwipeComplete={() => setShowSettings(false)}
        // style={styles.bottomView}
        style={{
          justifyContent: 'flex-end',
          margin: 0,
        }}
        propagateSwipe={true}
      >
        <View
          style={{
            paddingVertical: 18,
            borderTopRightRadius: borderRadius.large,
            borderTopLeftRadius: borderRadius.large,
            height: '60%',
            backgroundColor: colors.background,
          }}
        >
          <StyledText>Edit Profule</StyledText>
        </View>
      </Modal>
    </View>
  );
};
export default MyProfile;
