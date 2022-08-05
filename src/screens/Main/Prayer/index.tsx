import React, { useEffect, useRef, useState } from 'react';
import {
  Text,
  View,
  ImageBackground,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  TextInput,
  ScrollView,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Avatar, Provider } from 'react-native-paper';
import DropDown from 'react-native-paper-dropdown';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import EvilIcons from 'react-native-vector-icons/EvilIcons';

import Header from '@/components/Header';
import Button from '@/components/Button';
import Modal from 'react-native-modal';
import { styles } from './styles';
import LinearGradient from 'react-native-linear-gradient';
import { SceneMap, TabView } from 'react-native-tab-view';
import PrayerInputType from '@/components/PrayerInputType';
import { useDispatch, useSelector } from 'react-redux';

import PrayerSocials from '@/components/PrayerSocials';
import { setPrayers } from '@/redux//actions/GernalActions';
import WallComponent from '@/components/WallComponent';
import PrayersComponent from '@/components/PrayersComponent';
import TestimoniesComponent from '@/components/TestimoniesComponent';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import LogoHeader from '@/assets/svg/logo2.svg';

const Prayer = ({ navigation }) => {
  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    { key: 'Wall', title: 'Wall' },
    { key: 'Prayers', title: 'Prayers' },
    { key: 'Testimonies', title: 'Testimonies' },
  ]);

  const renderScene = SceneMap({
    Wall: WallComponent,
    Prayers: PrayersComponent,
    Testimonies: TestimoniesComponent,
  });

  const renderTabBar = (props) => {
    const inputRange = props.navigationState.routes.map((x, i) => i);

    return (
      <LinearGradient colors={['#032F3C', '#032F3C']} style={styles.tabBar}>
        {props.navigationState.routes.map((route, i) => {
          return (
            <TouchableOpacity style={styles.tabItem} onPress={() => setIndex(i)}>
              {/* <Animated.Text style={{color: 'white'}}>
                {route.title}
              </Animated.Text> */}
              {props?.navigationState?.index == i ? (
                <Animated.Text style={{ color: 'white', fontFamily: 'Rubik-Medium' }}>
                  {route.title}
                </Animated.Text>
              ) : (
                <Animated.Text style={{ color: 'white' }}>{route.title}</Animated.Text>
              )}
              {props?.navigationState?.index == i ? <View style={styles.viewun} /> : null}
            </TouchableOpacity>
          );
        })}
      </LinearGradient>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <GeneralStatusBar
        backgroundColor="#126B87"
        barStyle="light-content"
        hidden={false}
        translucent={true}
      />

      <LinearGradient colors={['#126B87', '#094558', '#032F3C']} style={styles.header}>
        <View style={styles.logview}>
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Ionicons name="menu" size={24} color="white" />
          </TouchableOpacity>
          <LogoHeader
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
          <View />
        </View>
        <Text style={styles.walltext}>Prayer Wall</Text>
      </LinearGradient>

      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        renderTabBar={renderTabBar}
        onIndexChange={setIndex}
        initialLayout={styles.loyalsty}
      />
    </View>
  );
};
export default Prayer;
