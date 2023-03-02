import * as React from 'react';

import { Text, View, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { getHeight, getWidth } from '@/utils/ResponsiveFun';

import { RootStackParamList } from './types';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { BottomTabBar, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome5';
import LogoHeader from '@/assets/svg/logo2.svg';
import HomeStack from './HomeStack';
import ExploreStack from './ExploreStack';
import ProfileStack from './ProfileStack';
import DeviceInfo from 'react-native-device-info';

type Props = DrawerScreenProps<RootStackParamList, 'Bottom'>;
const Tab = createBottomTabNavigator();

function Bottom({ navigation, route }: Props) {
  const tabs = route?.params?.tabs;

  const [tab, setTab] = React.useState(tabs ?? 'HomeTab');

  React.useEffect(() => {
    if (tabs) setTab(tabs);
  }, [tabs]);

  const HEADER_PADDING_TOP = DeviceInfo.hasNotch() || DeviceInfo.hasDynamicIsland() ? 60 : 40;

  return (
    <Tab.Navigator
      screenOptions={{
        header: () => {
          return (
            <View>
              <StatusBar
                translucent={Platform.OS == 'android'}
                backgroundColor="transparent"
                barStyle={'light-content'}
                hidden={false}
              />
              <LinearGradient
                colors={['#126B87', '#032F3C']}
                // locations={[0, 0.9]}
                style={{
                  backgroundColor: '#126B87',
                  flexDirection: 'row',
                  // alignItems: 'flex-end',
                  paddingHorizontal: getWidth(5),
                  justifyContent: 'space-between',
                  paddingVertical: getHeight(1),
                  paddingTop: HEADER_PADDING_TOP,
                  // height: getHeight(4),
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    navigation.openDrawer();
                  }}
                >
                  <Ionicons name="menu" size={24} color="white" />
                </TouchableOpacity>

                <View style={{ height: '100%' }}>
                  <LogoHeader
                    fill="#fff"
                    height={30}
                    width={140}
                    style={{
                      // shadowColor: '#000',
                      shadowOffset: {
                        width: 0,
                        height: 6,
                      },
                      shadowOpacity: 0.39,
                      shadowRadius: 8.3,

                      elevation: 13,
                    }}
                  />
                </View>

                <TouchableOpacity onPress={() => navigation.navigate('Search')}>
                  <Ionicons name="search-outline" size={24} color="white" />
                </TouchableOpacity>
              </LinearGradient>
            </View>
          );
        },
        // tabBarActiveBackgroundColor: '#4d9eba',
        tabBarActiveTintColor: 'white',
        tabBarInactiveTintColor: '#9AACB1',
        // tabBarInactiveBackgroundColor: '#126B87',

        tabBarLabelStyle: { paddingBottom: 4 },
        tabBarStyle: { backgroundColor: '#032F3C' },
        // tabBarBackground: () => (
        //   <LinearGradient colors={['#000', 'red']} start={{ x: 1, y: 0 }} end={{ x: 0, y: 0 }} />
        // ),

        // tabBarBackground: () => {
        //   return (
        //     <LinearGradient colors={['#000', 'red']} start={{ x: 1, y: 0 }} end={{ x: 0, y: 0 }}>
        //       {' '}
        //     </LinearGradient>
        //   );
        // },
      }}
      // tabBar={(props) => {
      //   console.log(props, 'asdfasdfsadf');
      //   return (
      //     <LinearGradient colors={['#126B87', '#032F3C']}>
      //       <BottomTabBar {...props} style={{ backgroundColor: 'transparent' }} />
      //     </LinearGradient>
      //   );
      // }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarLabel: 'Home',

          tabBarIcon: (props) => <FontAwesome name="home" size={20} color={props.color} />,
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreStack}
        options={{
          tabBarLabel: 'Explore',
          tabBarIcon: (props) => <FontAwesome name="compass" size={20} color={props.color} />,
        }}
      />
      {/* <Tab.Screen
        name="Message"
        component={Message}
        options={{
          tabBarLabel: 'Message',
          tabBarIcon: (props) => (
            <FontAwesome name="comments" size={props.size} color={props.color} />
          ),
        }}
      /> */}
      <Tab.Screen
        name="MyProfile"
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: (props) => <FontAwesome name="user-circle" size={20} color={props.color} />,
        }}
      />
    </Tab.Navigator>

    // <View style={{ flex: 1 }}>
    //   <View style={{ flex: 1 }}>
    //     {tab == 'Home' ? (
    //       <Home
    //         navigate={navigation.navigate}
    //         openDrawer={navigation.openDrawer}
    //         setRequestModel={setRequestModel}
    //       />
    //     ) : tab == 'Explore' ? (
    //       <Explore navigation={navigation} goBack={goBack} />
    //     ) : tab == 'Message' ? (
    //       <Message navigation={navigation} goBack={goBack} />
    //     ) : tab == 'Profile' ? (
    //       <MyProfile navigation={navigation} goBack={goBack} />
    //     ) : null}
    //     {tab == 'Explore' ? (
    //       <View
    //         style={{
    //           backgroundColor: '#ffffff',
    //           opacity: 0.92,
    //           position: 'absolute',
    //           justifyContent: 'center',
    //           alignItems: 'center',
    //           bottom: 0,
    //           shadowColor: '#000',
    //           shadowOffset: {
    //             width: 0,
    //             height: 2,
    //           },
    //           shadowOpacity: 0.25,
    //           shadowRadius: 3.84,

    //           elevation: 5,
    //           left: 0,
    //           right: 0,
    //           height: getHeight(6),
    //         }}
    //       >
    //         <TouchableOpacity
    //           style={{ flexDirection: 'row' }}
    //           onPress={() => {
    //             // navigation.navigate('MyChannels');
    //           }}
    //         >
    //           <AntDesign name={'adduser'} color={'#4F6D77'} size={14} />

    //           <Text style={{ color: '#4F6D77', fontSize: 14, marginLeft: 5 }}>
    //             View My Channels
    //           </Text>
    //         </TouchableOpacity>
    //       </View>
    //     ) : null}
    //   </View>
    //   {/* <LinearGradient style={{ flex: 0.11 }} colors={['#032F3C', '#094558', '#126B87']}>
    //     <View style={styles.tabBar}>
    //       {tab == 'Home' ? (
    //         <LinearGradient colors={['#07566A', '#20A2BF']} style={styles.tab}>
    //           <TouchableOpacity
    //             // style={styles.tab}
    //             style={{ justifyContent: 'center', alignItems: 'center' }}
    //             onPress={() => setTab('Home')}
    //           >
    //             <Refreshsvg height={22} width={22} style={{ marginBottom: 5 }} />
    //             <Text style={{ ...styles.tabText, fontWeight: 'bold' }}>Refresh</Text>
    //           </TouchableOpacity>
    //         </LinearGradient>
    //       ) : (
    //         <TouchableOpacity style={styles.tab} onPress={() => setTab('Home')}>
    //           <Homesvg height={22} width={22} style={{ marginBottom: 5 }} />
    //           <Text style={styles.tabText}>Home</Text>
    //         </TouchableOpacity>
    //       )}

    //       {tab == 'Explore' ? (
    //         <LinearGradient style={styles.tab} colors={['#07566A', '#20A2BF']}>
    //           <TouchableOpacity
    //             style={{ justifyContent: 'center', alignItems: 'center' }}
    //             onPress={() => setTab('Explore')}
    //           >
    //             <Explorefillsvg height={22} width={22} style={{ marginBottom: 5 }} />
    //             <Text style={{ ...styles.tabText, fontWeight: 'bold' }}>Explore</Text>
    //           </TouchableOpacity>
    //         </LinearGradient>
    //       ) : (
    //         <TouchableOpacity style={styles.tab} onPress={() => setTab('Explore')}>
    //           <Exploresvg height={22} width={22} style={{ marginBottom: 5 }} />
    //           <Text style={styles.tabText}>Explore</Text>
    //         </TouchableOpacity>
    //       )}

    //       {tab == 'Message' ? (
    //         <LinearGradient colors={['#07566A', '#20A2BF']} style={styles.tab}>
    //           <TouchableOpacity
    //             style={{ justifyContent: 'center', alignItems: 'center' }}
    //             onPress={() => setTab('Message')}
    //           >
    //             <Messagefillsvg height={22} width={22} style={{ marginBottom: 5 }} />
    //             <Text style={{ ...styles.tabText, fontWeight: 'bold' }}>Messages</Text>
    //           </TouchableOpacity>
    //         </LinearGradient>
    //       ) : (
    //         <TouchableOpacity style={styles.tab} onPress={() => setTab('Message')}>
    //           <Messagesvg height={22} width={22} style={{ marginBottom: 5 }} />
    //           <Text style={styles.tabText}>Messages</Text>
    //         </TouchableOpacity>
    //       )}

    //       {tab == 'Profile' ? (
    //         <LinearGradient colors={['#07566A', '#20A2BF']} style={styles.tab}>
    //           <TouchableOpacity
    //             style={{ justifyContent: 'center', alignItems: 'center' }}
    //             onPress={() => setTab('Profile')}
    //           >
    //             <Profilefillsvg height={22} width={22} style={{ marginBottom: 5 }} />
    //             <Text style={{ ...styles.tabText, fontWeight: 'bold' }}>Profile</Text>
    //           </TouchableOpacity>
    //         </LinearGradient>
    //       ) : (
    //         <TouchableOpacity style={styles.tab} onPress={() => setTab('Profile')}>
    //           <Profilesvg height={22} width={22} style={{ marginBottom: 5 }} />
    //           <Text style={styles.tabText}>Profile</Text>
    //         </TouchableOpacity>
    //       )}
    //     </View>
    //   </LinearGradient>
    //   {requestModel ? <PrayerModel setRequestModel={setRequestModel} /> : null} */}
    // </View>
  );
}
export default Bottom;
// const styles = StyleSheet.create({
//   tabText: {
//     color: '#F6F6F6',
//     fontSize: 12,
//   },
//   tab: {
//     alignItems: 'center',
//     flex: 1,
//     paddingBottom: 7,

//     justifyContent: 'center',
//   },

//   tabBar: { flexDirection: 'row', flex: 1, justifyContent: 'space-around' },
// });
