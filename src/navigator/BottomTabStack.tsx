import { FC, useState } from 'react';
import FastImage from 'react-native-fast-image';

import { View, Platform } from 'react-native';

import { DrawerScreenProps } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import FontAwesome from 'react-native-vector-icons/FontAwesome5';
import HomeStack from './HomeStack';
import ExploreStack from './ExploreStack';
import ProfileStack from './ProfileStack';
import DeviceInfo from 'react-native-device-info';
import { MainBottomStackParamsList, MainDrawerParamsList } from './types';
import Home from '@/assets/icons/home.svg';
import Search from '@/assets/icons/search.svg';
import Global from '@/assets/icons/global.svg';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { Colors } from '../styles';
import SearchStack from './SearchStack';
import { useSelector } from 'react-redux';
import { RootState } from '../Redux/reducers/rootReducer';
import { borderWidth } from '../styles/outlines';
import { useTheme } from '@react-navigation/native';

type Props = DrawerScreenProps<MainDrawerParamsList, 'Main'>;

const Tab = createBottomTabNavigator<MainBottomStackParamsList>();

const BottomStack: FC<Props> = ({ navigation, route }: Props) => {
  const { dark, colors } = useTheme();

  const authState = useSelector((state: RootState) => state.auth);
  console.log(colors);
  return (
    <Tab.Navigator
      screenOptions={{
        headerStatusBarHeight: 0,
        headerShown: false,
        headerStyle: {
          backgroundColor: colors.background,
        },
        // tabBarActiveBackgroundColor: '#4d9eba',

        tabBarActiveTintColor: Colors.primarySapphire.brand,
        tabBarInactiveTintColor: Colors.neutral[400],
        tabBarShowLabel: false,
        // tabBarInactiveBackgroundColor: '#126B87',

        tabBarLabelStyle: { paddingTop: 4 },
        tabBarStyle: {
          // backgroundColor: Platform.OS == 'ios' ? '#ffffffe6' : '#fff',
          borderTopWidth: 1,
          borderTopColor: colors.border, // Colors.neutral[800],
          // paddingVertical: Platform.OS == 'ios' ? 10 : 0,
        },

        // tabBarHideOnKeyboard: true,
        tabBarAllowFontScaling: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarLabel: 'Home',

          tabBarIcon: (props) => <Home style={{ height: 22, width: 22 }} fill={props.color} />,
        }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchStack}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: (props) => (
            <View>
              <Search style={{ height: 20, width: 20 }} stroke={props.color} strokeWidth={2} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="ExploreTab"
        component={ExploreStack}
        options={{
          tabBarLabel: 'Explore',
          tabBarIcon: (props) => <Global style={{ height: 22, width: 22 }} fill={props.color} />,
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
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 25,
                    borderColor: props.color,
                    borderWidth: props.focused ? borderWidth.base : 0,
                  }}
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
