/* eslint-disable react/no-unstable-nested-components */
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { useTheme } from '@react-navigation/native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Notification } from 'iconsax-react-native';
import LinearGradient from 'react-native-linear-gradient';
import Home, { FeedTypes } from '../screens/home';
import UserProfile from '../screens/main/userProfile';
import { HomeStackParamsList } from './types';
import Notifications from '../screens/notifications';
import { Colors } from '../styles';

import Logo from '@/assets/icons/logo.svg';
import LogoWhite from '@/assets/icons/logo_white.svg';
import mainPageOptions from './global';
import Watch from '../screens/home/watch';
import StyledText from '../components/styled/Text';
import { fontSize } from '../styles/typography';

const Stack = createNativeStackNavigator<HomeStackParamsList>();
function HomeStack() {
  const { dark, colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={() => {
        return {
          // drawerType,
          headerTintColor: dark ? colors.text : Colors.primary.brand,

          drawerActiveBackgroundColor: Colors.neutral[600],
          drawerActiveTintColor: dark ? Colors.primarySapphire[500] : Colors.primary.brand,
        };
      }}
    >
      <Stack.Screen
        name="Home"
        component={Home}
        initialParams={{
          selectedTab: FeedTypes.Connected,
        }}
        options={({ navigation }) => {
          return {
            ...mainPageOptions(navigation, dark ? colors.text : Colors.primary.brand, 'Home'),
            title: 'Home',
            headerTitleAlign: 'center',
            headerTitle: () => {
              return (
                <View style={{ height: 28, width: 28 }}>
                  {dark ? (
                    <LogoWhite style={{ height: 28, width: 28 }} />
                  ) : (
                    <Logo style={{ height: 28, width: 28 }} />
                  )}
                </View>
              );
            },
            headerRight: () => (
              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity
                  onPress={() => {
                    navigation.navigate('MainRoot', {
                      screen: 'Main',
                      params: { screen: 'HomeTab', params: { screen: 'Notifications' } },
                    });
                  }}
                >
                  <Notification
                    style={{ height: 24, width: 24 }}
                    color={Colors.primary.brand}
                    strokeWidth={0.2}
                  />
                </TouchableOpacity>
                {/* <TouchableOpacity onPress={() => {}}>
                            <Message
                              style={{ height: 24, width: 24 }}
                              stroke={Colors.primary.brand}
                              strokeWidth={0.2}
                            />
                          </TouchableOpacity> */}
              </View>
            ),
          };
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={Notifications}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="WatchPortal"
        component={Watch}
        options={{
          presentation: 'card',
          headerShown: true,
          headerTintColor: '#fff',
          headerTransparent: true,

          headerBackTitleVisible: false,
          title: 'Watch',
          headerTitle: (props) => (
            <Text
              {...props}
              style={{
                fontWeight: 'bold',
                color: 'white',
                fontSize: fontSize.x4.fontSize,
                textShadowColor: 'rgba(0,0,0,0.3)',
                textShadowRadius: 1,
                textShadowOffset: {
                  width: 1,
                  height: 1,
                },
              }}
            />
          ),

          // headerStyle: {
          //   backgroundColor: 'rgba(0,0,0,0.06)',
          // },
          headerBackground: () => (
            <LinearGradient
              colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0)']}
              locations={[0.8, 1]}
              style={[StyleSheet.absoluteFill, { flex: 1 }]}
            />
          ),
        }}
      />

      <Stack.Screen
        name="UserProfile"
        component={UserProfile}
        options={{
          headerBackTitleVisible: false,
          headerStyle: { backgroundColor: colors.background },
          title: '',
          contentStyle: { backgroundColor: Colors.neutral[700] },
        }}
      />
    </Stack.Navigator>
  );
}

export default HomeStack;
