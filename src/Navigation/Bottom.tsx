import * as React from 'react';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Home from '../screens/Main/Home';
import Explore from '../screens/Main/Explore';
import Message from '../screens/Main/Message';

import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';
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
import { getHeight } from '@/utils/ResponsiveFun';
import PrayerModel from '../Components/PrayerModel';

function Bottom({ navigation, route }) {
  const tabs = route?.params?.tabs;
  const [requestModel, setRequestModel] = React.useState(false);

  const [tab, setTab] = React.useState('Home');
  const goBack = () => {
    setTab('Home');
  };
  React.useEffect(() => {
    tabs != undefined ? setTab(tabs) : null;
  }, [tabs]);
  console.log(tab, 'tab');
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {tab == 'Home' ? (
          <Home navigation={navigation} setRequestModel={setRequestModel} />
        ) : tab == 'Explore' ? (
          <Explore navigation={navigation} goBack={goBack} />
        ) : tab == 'Message' ? (
          <Message navigation={navigation} goBack={goBack} />
        ) : tab == 'Profile' ? (
          <MyProfile navigation={navigation} goBack={goBack} />
        ) : null}
        {tab == 'Explore' ? (
          <View
            style={{
              backgroundColor: '#ffffff',
              opacity: 0.92,
              position: 'absolute',
              justifyContent: 'center',
              alignItems: 'center',
              bottom: 0,
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,

              elevation: 5,
              left: 0,
              right: 0,
              height: getHeight(6),
            }}
          >
            <TouchableOpacity
              style={{ flexDirection: 'row' }}
              onPress={() => {
                navigation.navigate('My Channels');
              }}
            >
              <AntDesign name={'adduser'} color={'#4F6D77'} size={14} />

              <Text style={{ color: '#4F6D77', fontSize: 14, marginLeft: 5 }}>
                View My Channels
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
      {/* <LinearGradient style={{ flex: 0.11 }} colors={['#032F3C', '#094558', '#126B87']}>
        <View style={styles.tabBar}>
          {tab == 'Home' ? (
            <LinearGradient colors={['#07566A', '#20A2BF']} style={styles.tab}>
              <TouchableOpacity
                // style={styles.tab}
                style={{ justifyContent: 'center', alignItems: 'center' }}
                onPress={() => setTab('Home')}
              >
                <Refreshsvg height={22} width={22} style={{ marginBottom: 5 }} />
                <Text style={{ ...styles.tabText, fontWeight: 'bold' }}>Refresh</Text>
              </TouchableOpacity>
            </LinearGradient>
          ) : (
            <TouchableOpacity style={styles.tab} onPress={() => setTab('Home')}>
              <Homesvg height={22} width={22} style={{ marginBottom: 5 }} />
              <Text style={styles.tabText}>Home</Text>
            </TouchableOpacity>
          )}

          {tab == 'Explore' ? (
            <LinearGradient style={styles.tab} colors={['#07566A', '#20A2BF']}>
              <TouchableOpacity
                style={{ justifyContent: 'center', alignItems: 'center' }}
                onPress={() => setTab('Explore')}
              >
                <Explorefillsvg height={22} width={22} style={{ marginBottom: 5 }} />
                <Text style={{ ...styles.tabText, fontWeight: 'bold' }}>Explore</Text>
              </TouchableOpacity>
            </LinearGradient>
          ) : (
            <TouchableOpacity style={styles.tab} onPress={() => setTab('Explore')}>
              <Exploresvg height={22} width={22} style={{ marginBottom: 5 }} />
              <Text style={styles.tabText}>Explore</Text>
            </TouchableOpacity>
          )}

          {tab == 'Message' ? (
            <LinearGradient colors={['#07566A', '#20A2BF']} style={styles.tab}>
              <TouchableOpacity
                style={{ justifyContent: 'center', alignItems: 'center' }}
                onPress={() => setTab('Message')}
              >
                <Messagefillsvg height={22} width={22} style={{ marginBottom: 5 }} />
                <Text style={{ ...styles.tabText, fontWeight: 'bold' }}>Messages</Text>
              </TouchableOpacity>
            </LinearGradient>
          ) : (
            <TouchableOpacity style={styles.tab} onPress={() => setTab('Message')}>
              <Messagesvg height={22} width={22} style={{ marginBottom: 5 }} />
              <Text style={styles.tabText}>Messages</Text>
            </TouchableOpacity>
          )}

          {tab == 'Profile' ? (
            <LinearGradient colors={['#07566A', '#20A2BF']} style={styles.tab}>
              <TouchableOpacity
                style={{ justifyContent: 'center', alignItems: 'center' }}
                onPress={() => setTab('Profile')}
              >
                <Profilefillsvg height={22} width={22} style={{ marginBottom: 5 }} />
                <Text style={{ ...styles.tabText, fontWeight: 'bold' }}>Profile</Text>
              </TouchableOpacity>
            </LinearGradient>
          ) : (
            <TouchableOpacity style={styles.tab} onPress={() => setTab('Profile')}>
              <Profilesvg height={22} width={22} style={{ marginBottom: 5 }} />
              <Text style={styles.tabText}>Profile</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
      {requestModel ? <PrayerModel setRequestModel={setRequestModel} /> : null} */}
    </View>
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
