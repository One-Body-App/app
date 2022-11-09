import * as React from 'react';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Home from '../screens/Main/Home';
import Explore from '../screens/Main/Explore';
import Message from '../screens/Main/Message';

import { Text, View, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Homesvg from '@/assets/svg/Home.svg';
import Refreshsvg from '@/assets/svg/Refresh.svg';

import Exploresvg from '@/assets/svg/Explore.svg';
import Messagesvg from '@/assets/svg/Messages.svg';
import Profilesvg from '@/assets/svg/Profile.svg';
import Explorefillsvg from '@/assets/svg/Explorefill.svg';
import Messagefillsvg from '@/assets/svg/MessagesFill.svg';
import Profilefillsvg from '@/assets/svg/ProfileFill.svg';

import MyProfile from '../screens/Main/MyProfile';
import { getHeight, getWidth } from '@/utils/ResponsiveFun';
import PrayerModel from '../Components/PrayerModel';

import { RootStackParamList } from './types';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { BottomTabBar, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome5';
import LogoHeader from '@/assets/svg/logo2.svg';

type Props = DrawerScreenProps<RootStackParamList, 'Bottom'>;
const Tab = createBottomTabNavigator();

function Bottom({ navigation, route }: Props) {
  const tabs = route?.params?.tabs;
  const [requestModel, setRequestModel] = React.useState(false);
  console.log(tabs);
  const [tab, setTab] = React.useState(tabs ?? 'HomeTab');
  const goBack = () => {
    console.log('asdf');
    setTab('HomeTab');
  };
  React.useEffect(() => {
    console.log(tabs, 'tabstabstabs');
    if (tabs) setTab(tabs);
  }, [tabs]);
  console.log(tab, 'tab');
  return (
    <Tab.Navigator
      screenOptions={{
        header: () => {
          return (
            <SafeAreaView style={{ backgroundColor: '#126B87' }}>
              <LinearGradient
                colors={['#126B87', '#032F3C']}
                locations={[0, 0.9]}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  paddingHorizontal: getWidth(5),
                  justifyContent: 'space-between',
                  paddingVertical: getHeight(2),
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
                    fill="#126B87"
                    height={40}
                    width={140}
                    style={{
                      shadowColor: '#000',
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
            </SafeAreaView>
          );
        },
      }}
      tabBar={(props) => {
        return (
          <LinearGradient colors={['#000', 'red']} start={{ x: 1, y: 0 }} end={{ x: 0, y: 0 }}>
            <BottomTabBar {...props} style={{ backgroundColor: 'transparent' }} />
          </LinearGradient>
        );
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={Home}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: (props) => <FontAwesome name="home" size={props.size} color={props.color} />,
        }}
      />
      <Tab.Screen
        name="Explore"
        component={Explore}
        options={{
          tabBarLabel: 'Explore',
          tabBarIcon: (props) => (
            <FontAwesome name="compass" size={props.size} color={props.color} />
          ),
        }}
      />
      <Tab.Screen
        name="Message"
        component={Message}
        options={{
          tabBarLabel: 'Message',
          tabBarIcon: (props) => (
            <FontAwesome name="comments" size={props.size} color={props.color} />
          ),
        }}
      />
      <Tab.Screen
        name="MyProfile"
        component={MyProfile}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: (props) => (
            <FontAwesome name="user-circle" size={props.size} color={props.color} />
          ),
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
