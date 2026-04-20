/* eslint-disable react/no-unstable-nested-components */
import React, { useEffect } from 'react';
import { createDrawerNavigator, getDrawerStatusFromState } from '@react-navigation/drawer';
import { useSelector } from 'react-redux';
import {
  ActivityIndicator,
  Platform,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Profile2User } from 'iconsax-react-native';
import { useTheme } from '@react-navigation/native';
import Feather from '@react-native-vector-icons/feather';

import { HeaderBackButton } from '@react-navigation/elements';
import { MainDrawerParamsList } from './types';
import OnboardingStack from './OnboardingStack';
import { RootState } from '../redux/reducers/rootReducer';
import { Colors } from '../styles';

import ZoeIcon from '@/assets/svg/zoeicon.svg';
import Connections from '@/src/screens/main/connections';
import SettingsStack from './SettingsStack';
import MainTabStack from './BottomTabStack';
import DrawerContent from './DrawerContent';
import Saved from '../screens/main/saved';
import ZoeChat from '../screens/main/zoeChat';
import mainPageOptions from './global';
import Home2Icon from '@/assets/icons/home2.svg';
import { getDrawerNavMode } from '@/src/utils/authFlow';
import { TabBarAnimationProvider } from './TabBarAnimationContext';

const DrawerStack = createDrawerNavigator<MainDrawerParamsList>();

export function DrawerPlaceholderScreen() {
  const { dark, colors } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
      }}
    >
      <ActivityIndicator size="large" color={Colors.primary.brand} />
      <View style={{ height: 20 }} />
      <Feather name="shield" size={28} color={Colors.primary.brand} />
      <View
        style={{
          marginTop: 12,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            color: dark ? '#FFFFFF' : '#032f3c',
            fontSize: 18,
            fontWeight: '600',
          }}
        >
          Loading your account...
        </Text>
      </View>
      <View style={{ marginTop: 8, alignItems: 'center' }}>
        <Text
          style={{
            color: dark ? '#A7B7BC' : '#4e6a71',
            fontSize: 14,
          }}
        >
          Finishing sign-in and loading the right destination.
        </Text>
      </View>
    </View>
  );
}

function DrawerNav() {
  const authState = useSelector((state: RootState) => state.auth);
  const dimensions = useWindowDimensions();

  const { dark, colors } = useTheme();
  const drawerNavMode = getDrawerNavMode(authState);

  useEffect(() => {
    if (__DEV__ && Platform.OS === 'android' && authState.userToken) {
      console.log('[AndroidPasskey] route_resolution', {
        drawerNavMode,
        hasProfileData: Boolean(authState.getProfileData),
      });
    }
  }, [authState.getProfileData, authState.userToken, drawerNavMode]);

  if (drawerNavMode === 'main') {
    let drawerType: 'front' | 'back' | 'slide' | 'permanent' = 'front';

    if (dimensions.width >= 768) {
      drawerType = 'permanent';
    } else if (Platform.OS === 'ios') {
      drawerType = 'slide';
    }
    return (
      <TabBarAnimationProvider>
        <DrawerStack.Navigator
          detachInactiveScreens
          backBehavior="history"
          sceneContainerStyle={{ backgroundColor: colors.background }}
          screenOptions={({ navigation }) => {
            return {
              drawerType,
              swipeEnabled: false,
              headerShown: false,
              headerTintColor: dark ? colors.text : Colors.primary.brand,

              drawerActiveBackgroundColor: Colors.neutral[600],
              drawerActiveTintColor: dark ? '#ffffff' : '#126b87',
              drawerInactiveTintColor: dark ? '#f6f6f7' : '#032f3c',

              headerLeft: (props: { tintColor?: string }) => {
                const isDrawerOpen = getDrawerStatusFromState(navigation.getState()) === 'open';

                if (navigation.canGoBack() && !isDrawerOpen) {
                  return (
                    <HeaderBackButton
                      style={{ marginHorizontal: 11 }}
                      labelVisible={false}
                      onPress={() => navigation.goBack()}
                    />
                  );
                }
                const { headerLeft } = mainPageOptions(
                  navigation,
                  props.tintColor ?? colors.text,
                  '',
                  {
                    marginHorizontal: 11,
                  }
                );

                if (headerLeft) {
                  return headerLeft({ canGoBack: false });
                }

                return <View />;
              },
            };
          }}
          drawerContent={(props) => <DrawerContent {...props} />}
        >
          <DrawerStack.Screen
            name="Main"
            component={MainTabStack}
            options={() => {
              return {
                title: 'Home',
                drawerIcon: ({ color, size }) => {
                  return <Home2Icon width={size} height={size} color={color} />;
                },
              };
            }}
          />

          <DrawerStack.Screen
            name="ZoeAI"
            component={ZoeChat}
            options={{
              headerShown: false,
              title: 'ZoeAI',
              drawerLabel: 'ZoeAI',
              drawerIcon: ({ color, size }) => <ZoeIcon width={size} height={size} color={color} />,
            }}
          />

          <DrawerStack.Screen
            name="Saved"
            component={Saved}
            options={{
              headerShown: true,
              title: 'Saved Posts',
              drawerIcon: ({ color, size }) => {
                return <Feather name="bookmark" size={size} color={color} />;
              },
            }}
          />

          <DrawerStack.Screen
            name="Connections"
            component={Connections}
            options={({ navigation }) => {
              return {
                headerShown: true,
                title: 'My Connections',
                headerLeft: () => (
                  <TouchableOpacity
                    style={{ marginHorizontal: 11, padding: 4 }}
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Feather
                      name="chevron-left"
                      size={28}
                      color={dark ? colors.text : Colors.primary.brand}
                    />
                  </TouchableOpacity>
                ),
                drawerIcon: ({ color, size }) => {
                  return <Profile2User size={size} color={color} />;
                },
              };
            }}
          />

          <DrawerStack.Screen
            name="Settings"
            component={SettingsStack}
            options={() => {
              return {
                drawerItemStyle: { display: 'none', height: 0 },
              };
            }}
          />

          {/* <DrawerStack.Screen name="Help" component={Help} /> */}
        </DrawerStack.Navigator>
      </TabBarAnimationProvider>
    );
  }

  if (drawerNavMode === 'onboarding') {
    return <OnboardingStack />;
  }

  let drawerType: 'front' | 'back' | 'slide' | 'permanent' = 'front';

  if (dimensions.width >= 768) {
    drawerType = 'permanent';
  } else if (Platform.OS === 'ios') {
    drawerType = 'slide';
  }

  return (
    <TabBarAnimationProvider>
      <DrawerStack.Navigator
        detachInactiveScreens
        backBehavior="history"
        sceneContainerStyle={{ backgroundColor: colors.background }}
        screenOptions={{
          drawerType,
          swipeEnabled: false,
          headerShown: false,
        }}
        drawerContent={() => <DrawerPlaceholderScreen />}
      >
        <DrawerStack.Screen
          name="Main"
          component={DrawerPlaceholderScreen}
          options={{
            title: 'Home',
            drawerItemStyle: { display: 'none', height: 0 },
          }}
        />
        <DrawerStack.Screen
          name="ZoeAI"
          component={DrawerPlaceholderScreen}
          options={{
            drawerItemStyle: { display: 'none', height: 0 },
          }}
        />
        <DrawerStack.Screen
          name="Saved"
          component={DrawerPlaceholderScreen}
          options={{
            drawerItemStyle: { display: 'none', height: 0 },
          }}
        />
        <DrawerStack.Screen
          name="Connections"
          component={DrawerPlaceholderScreen}
          options={{
            drawerItemStyle: { display: 'none', height: 0 },
          }}
        />
        <DrawerStack.Screen
          name="Settings"
          component={DrawerPlaceholderScreen}
          options={{
            drawerItemStyle: { display: 'none', height: 0 },
          }}
        />
      </DrawerStack.Navigator>
    </TabBarAnimationProvider>
  );
}

export default DrawerNav;
