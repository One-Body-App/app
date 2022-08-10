import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  Text,
  View,
  YellowBox,
  TextInput,
  Image,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Animated,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Avatar } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import { TabView, SceneMap } from 'react-native-tab-view';
import { styles } from './styles';
import HomeAllComponent from '@/components/HomeAllComponent';
import HomeNewsComponent from '@/components/HomeNewsComponent';
import HomeSocialComponent from '@/components/HomeSocialComponent';
import HomeBlogComponent from '@/components/HomeBlogComponent';

import Button from '@/components/Button';
import { setLoader, setPrayersLive } from '@/redux//actions/GeneralActions';
import PrayerModel from '@/components/PrayerModel';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import LogoHeader from '@/assets/svg/logo2.svg';
import { useDispatch, useSelector } from 'react-redux';
import { getAllPrayerLive } from '@/redux//actions/PrayerAction';

import { ApiCall } from '@/services/api';

const Home = ({ navigation, setRequestModel }) => {
  const [index, setIndex] = React.useState(0);
  const token = useSelector((state) => state.auth.userToken);
  const dispatch = useDispatch();

  const [routes] = React.useState([
    { key: 'All', title: 'ALL' },
    { key: 'News', title: 'NEWS' },
    { key: 'Social', title: 'SOCIAL' },
    { key: 'Blog', title: 'BLOG' },
  ]);
  const renderScene = SceneMap({
    All: HomeAllComponent,
    News: HomeNewsComponent,
    Social: HomeSocialComponent,
    Blog: HomeBlogComponent,
  });
  const renderTabBar = (props) => {
    const inputRange = props.navigationState.routes.map((x, i) => i);

    return (
      <View style={styles.tabBar}>
        {props.navigationState.routes.map((route, i) => {
          return (
            <TouchableOpacity style={styles.tabItem} onPress={() => setIndex(i)}>
              <Animated.Text
                style={
                  props?.navigationState?.index == i
                    ? {
                        color: '#032F3C',
                        fontWeight: 'bold',
                      }
                    : {
                        color: '#126B87',
                        fontWeight: 'bold',
                      }
                }
              >
                {route.title}
              </Animated.Text>
              {props?.navigationState?.index == i ? <View style={styles.propview} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const getAllLive = async () => {
    try {
      const res = await ApiCall({
        route: 'prayers/live-wall',
        verb: 'get',
        token: token,
      });
      if (res?.status == '200') {
        dispatch(setPrayersLive(res?.response?.data));
      } else {
        console.log('error', res?.response);
      }
    } catch (e) {
      console.log('saga get all live prayer error -- ', e.toString());
    }
  };

  return (
    <View style={styles.continer}>
      <GeneralStatusBar
        backgroundColor="#126B87"
        barStyle="light-content"
        hidden={false}
        translucent={true}
      />

      <LinearGradient colors={['#126B87', '#094558', '#032F3C']} style={styles.header}>
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
        <TouchableOpacity onPress={() => navigation.navigate('Search')}>
          <Ionicons name="search-outline" size={24} color="white" />
        </TouchableOpacity>
      </LinearGradient>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        renderTabBar={renderTabBar}
        onIndexChange={setIndex}
        initialLayout={{ width: getWidth(100) }}
      />
      <TouchableWithoutFeedback
        onPress={() => {
          setRequestModel(true);
          getAllLive();
        }}
      >
        <Avatar.Image
          style={styles.fab}
          size={getFontSize(10)}
          source={require('@/assets/images/fab.png')}
        />
      </TouchableWithoutFeedback>
    </View>
  );
};

export default Home;
