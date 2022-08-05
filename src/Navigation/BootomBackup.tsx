import * as React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Home from '../screens/Main/Home';
import Explore from '../screens/Main/Explore';
import Message from '../screens/Main/Message';

import {Text, View, TouchableOpacity, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MessageScreens from './messageStack';

import MyProfile from '../screens/Main/MyProfile';

const Tab = createBottomTabNavigator();
function Bottom({navigation}) {
  const CustomTabBar = props => {
    const navigateToHomeScreen = () => {
      props.navigation.navigate('Home');
    };

    const navigateToExploreScreen = () => {
      props.navigation.navigate('Explore');
    };

    const navigateToMessageScreen = () => {
      props.navigation.navigate('Message');
    };
    const navigateToProfileScreen = () => {
      props.navigation.navigate('Profile');
    };
    return (
      <LinearGradient colors={['#032F3C', '#094558', '#126B87']}>
        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tab} onPress={navigateToHomeScreen}>
            <Icon
              name="home"
              color={props.focused ? 'red' : 'white'}
              size={30}
            />
            <Text style={styles.tabText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tab}
            onPress={navigateToExploreScreen}>
            <MaterialIcons name="explore" color={'#F6F6F6'} size={30} />
            <Text style={styles.tabText}>Explore</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tab}
            onPress={navigateToMessageScreen}>
            <Ionicons
              name="md-chatbubbles-outline"
              color={'#F6F6F6'}
              size={30}
            />
            <Text style={styles.tabText}>Messages</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tab}
            onPress={navigateToProfileScreen}>
            <FontAwesome5 name="user-circle" color={'#F6F6F6'} size={30} />
            <Text style={styles.tabText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
      tabBar={props => <CustomTabBar {...props} />}>
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          tabBarIcon: ({focused}) => {
            return (
              <View style={{alignItems: 'center', justifyContent: 'center'}}>
                <Icon
                  name="home-outline"
                  color={focused ? 'red' : 'white'}
                  size={27}
                />
                <Text>Home</Text>
              </View>
            );
          },
        }}
      />
      <Tab.Screen
        name="Message"
        // component={Message}
        component={MessageScreens}
        options={{
          tabBarIcon: ({focused}) => {
            return (
              <View style={{alignItems: 'center', justifyContent: 'center'}}>
                <Icon
                  name="view-grid-outline"
                  color={focused ? 'red' : 'white'}
                  size={27}
                />
                <Text>Message</Text>
              </View>
            );
          },
        }}
      />
      <Tab.Screen
        name="Explore"
        component={Explore}
        options={{
          tabBarIcon: ({focused}) => {
            return (
              <View style={{alignItems: 'center', justifyContent: 'center'}}>
                <Icon
                  name="bell-outline"
                  color={focused ? 'red' : 'white'}
                  size={27}
                />
                <Text>Notification</Text>
              </View>
            );
          },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={MyProfile}
        options={{
          tabBarIcon: ({focused}) => {
            return (
              <View style={{alignItems: 'center', justifyContent: 'center'}}>
                <MaterialIcons
                  name="person-outline"
                  color={focused ? 'red' : 'white'}
                  size={27}
                />
                <Text>Profile</Text>
              </View>
            );
          },
        }}
      />
    </Tab.Navigator>
  );
}
export default Bottom;
const styles = StyleSheet.create({
  tabText: {
    color: '#F6F6F6',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 7,
    justifyContent: 'space-around',
  },
});
