import React from 'react';
import {
  View,
  TouchableWithoutFeedback,
  Animated,
  SafeAreaView,
  Text,
  TouchableOpacity,
} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';
import { Avatar } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { getFontSize, getWidth } from '@/utils/ResponsiveFun';
import { TabView, SceneMap, SceneRendererProps, NavigationState } from 'react-native-tab-view';
import { styles } from './styles';
import HomeAllComponent from '@/components/HomeAllComponent';
import HomeNewsComponent from '@/components/HomeNewsComponent';
import HomeSocialComponent from '@/components/HomeSocialComponent';
import HomeBlogComponent from '@/components/HomeBlogComponent';

import { setPrayersLive } from '@/redux//actions/GeneralActions';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import LogoHeader from '@/assets/svg/logo2.svg';
import { useDispatch, useSelector } from 'react-redux';

import { ApiCall } from '@/services/api';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { useTheme } from '@react-navigation/native';

interface Props {
  setRequestModel: (requestModel: boolean) => void;
  openDrawer: () => void;
  navigate: (screenName: string) => void;
}

const Home = ({ openDrawer, navigate, setRequestModel }: Props) => {
  const [index, setIndex] = React.useState(0);
  const token = useSelector((state: RootState) => state.auth.userToken);
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

  const getAllLive = async () => {
    try {
      const res = await ApiCall({
        route: 'prayers/live-wall',
        verb: 'get',
        token: token,
      });
      if (res?.status == 200) {
        dispatch(setPrayersLive(res?.response?.data));
      } else {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      console.log('saga get all live prayer error -- ', e.toString());
    }
  };

  const theme = useTheme();

  return (
    <>
      <SafeAreaView style={{ flex: 0, backgroundColor: '#126B87' }} />

      <SafeAreaView style={styles.continer}>
        <View style={{ flex: 1 }}>
          <TabView
            navigationState={{ index, routes }}
            renderScene={renderScene}
            renderTabBar={(props) => {
              return (
                <View style={styles.tabBar}>
                  {props.navigationState.routes.map((route, i) => {
                    return (
                      <TouchableOpacity key={i} style={styles.tabItem} onPress={() => setIndex(i)}>
                        <Animated.Text
                          style={
                            props?.navigationState?.index == i
                              ? {
                                  color: theme.dark ? theme.colors.text : '#032F3C',
                                  fontWeight: 'bold',
                                }
                              : {
                                  color: theme.dark ? '#B2BEB5' : '#126B87',
                                  fontWeight: 'bold',
                                }
                          }
                        >
                          {route.title}
                        </Animated.Text>
                        {props?.navigationState?.index == i ? (
                          <View style={styles.propview} />
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            }}
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
      </SafeAreaView>
    </>
  );
};

export default Home;
