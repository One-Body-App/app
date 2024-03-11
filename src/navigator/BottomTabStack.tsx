/* eslint-disable react/jsx-no-useless-fragment */
/* eslint-disable react/no-unstable-nested-components */
import FastImage from 'react-native-fast-image';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import FontAwesome from 'react-native-vector-icons/FontAwesome5';
import { useSelector } from 'react-redux';
import { useTheme } from '@react-navigation/native';
import { AddSquare, Global, Home3, SearchNormal1 } from 'iconsax-react-native';
import HomeStack from './HomeStack';
import ExploreStack from './ExploreStack';
import ProfileStack from './ProfileStack';
import { MainBottomStackParamsList } from './types';
import { Colors } from '../styles';
import SearchStack from './SearchStack';
import { RootState } from '../redux/reducers/rootReducer';
import { borderWidth } from '../styles/outlines';
import PostStack from './PostStack';
import { getHeight } from '@/utils/ResponsiveFun';
import { FeedTypes } from '../screens/home';

const Tab = createBottomTabNavigator<MainBottomStackParamsList>();

function BottomStack() {
  const { dark, colors } = useTheme();

  const authState = useSelector((state: RootState) => state.auth);

  return (
    <Tab.Navigator
      screenOptions={{
        headerStatusBarHeight: 0,
        headerShown: false,
        headerStyle: {
          backgroundColor: colors.background,
        },

        tabBarActiveTintColor: dark ? colors.text : Colors.primarySapphire.brand,
        tabBarInactiveTintColor: dark ? undefined : Colors.neutral[400],
        tabBarShowLabel: false,

        tabBarLabelStyle: { paddingTop: 4 },
        tabBarStyle: {
          height: getHeight(9),
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },

        tabBarAllowFontScaling: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        initialParams={{
          screen: 'Home',
          params: {
            selectedTab: FeedTypes.Connected,
          },
        }}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: (props) => {
            return (
              <>
                {props.focused ? (
                  <Home3 style={{ height: 22, width: 22 }} color={props.color} variant="Bold" />
                ) : (
                  <Home3 style={{ height: 22, width: 22 }} color={props.color} />
                )}
              </>
            );
          },
        }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchStack}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: (props) => {
            return (
              <>
                {props.focused ? (
                  <SearchNormal1
                    style={{ height: 22, width: 22 }}
                    color={props.color}
                    variant="Bold"
                  />
                ) : (
                  <SearchNormal1 style={{ height: 22, width: 22 }} color={props.color} />
                )}
              </>
            );
          },
        }}
      />
      <Tab.Screen
        name="PostTab"
        component={PostStack}
        options={{
          tabBarLabel: 'Post',
          tabBarIcon: (props) => (
            <AddSquare style={{ height: 22, width: 22 }} color={props.color} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Post');
          },
        })}
      />
      <Tab.Screen
        name="ExploreTab"
        component={ExploreStack}
        options={{
          tabBarLabel: 'Explore',
          tabBarIcon: (props) => {
            return (
              <>
                {props.focused ? (
                  <Global style={{ height: 22, width: 22 }} color={props.color} variant="Bold" />
                ) : (
                  <Global style={{ height: 22, width: 22 }} color={props.color} />
                )}
              </>
            );
          },
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
}
export default BottomStack;
