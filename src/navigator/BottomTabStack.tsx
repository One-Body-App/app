import { FC, useState } from 'react';
import FastImage from 'react-native-fast-image';

import { Text, View, TouchableOpacity, StyleSheet, Platform, StatusBar, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { getHeight, getWidth } from '@/utils/ResponsiveFun';

import { DrawerScreenProps } from '@react-navigation/drawer';
import { BottomTabBar, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome5';
import LogoHeader from '@/assets/svg/logo2.svg';
import HomeStack from './HomeStack';
import ExploreStack from './ExploreStack';
import ProfileStack from './ProfileStack';
import DeviceInfo from 'react-native-device-info';
import { MainBottomStackParamsList, MainDrawerParamsList } from './types';
import Message from '@/assets/icons/message.svg';
import Notification from '@/assets/icons/notification.svg';
import Logo from '@/assets/icons/logo.svg';
import { spacing } from '../styles/spacing';
import Home from '@/assets/icons/home.svg';
import Search from '@/assets/icons/search.svg';
import Global from '@/assets/icons/global.svg';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { Colors } from '../styles';
import SearchStack from './SearchStack';
import { useSelector } from 'react-redux';
import { RootState } from '../Redux/reducers/rootReducer';

type Props = DrawerScreenProps<MainDrawerParamsList, 'Main'>;

const Tab = createBottomTabNavigator<MainBottomStackParamsList>();

const BottomStack: FC<Props> = ({ navigation, route }: Props) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const authState = useSelector((state: RootState) => state.auth);
  // const tabs = route?.params?.tabs;

  // const [tab, setTab] = React.useState(tabs ?? 'HomeTab');

  // React.useEffect(() => {
  //   if (tabs) setTab(tabs);
  // }, [tabs]);

  console.log(navigation);
  // navigation.getParent()?.setOptions({
  //   screenOptions: {
  //       header
  //   }
  // });
  const HEADER_PADDING_TOP = DeviceInfo.hasNotch() || DeviceInfo.hasDynamicIsland() ? 60 : 40;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: 'white',
        },
        // tabBarActiveBackgroundColor: '#4d9eba',

        tabBarActiveTintColor: Colors.primarySapphire.brand,
        tabBarInactiveTintColor: '#9AACB1',
        tabBarShowLabel: true,
        // tabBarInactiveBackgroundColor: '#126B87',

        tabBarLabelStyle: { paddingTop: 4 },
        tabBarStyle: {
          backgroundColor: '#ffffffe6',
          borderTopWidth: 1,
          borderTopColor: Colors.neutral[700],
          paddingVertical: 10,
        },

        tabBarHideOnKeyboard: true,
        tabBarAllowFontScaling: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarLabel: 'Home',

          tabBarIcon: (props) => <Home style={{ height: 20, width: 20 }} stroke={props.color} />,
        }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchStack}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: (props) => <Search style={{ height: 20, width: 20 }} stroke={props.color} />,
        }}
      />
      <Tab.Screen
        name="ExploreTab"
        component={ExploreStack}
        options={{
          tabBarLabel: 'Explore',
          tabBarIcon: (props) => <Global style={{ height: 20, width: 20 }} stroke={props.color} />,
        }}
      />
      <Tab.Screen
        name="MyProfileTab"
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: (props) => {
            if (authState.getProfileData?.profileImage) {
              return (
                <FastImage
                  style={{ width: 20, height: 20, borderRadius: 25 }}
                  source={{
                    uri: authState.getProfileData?.profileImage,
                  }}
                  resizeMode={FastImage.resizeMode.stretch}
                />
              );
            }

            return <FontAwesome name="user-circle" size={20} color={props.color} />;
          },
        }}
      />
    </Tab.Navigator>
  );
};
export default BottomStack;
