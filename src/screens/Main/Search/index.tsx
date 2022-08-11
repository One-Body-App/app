import React, { useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Avatar, Provider, TextInput } from 'react-native-paper';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Ionicons from 'react-native-vector-icons/Ionicons';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import { styles } from './styles';
import { useDispatch, useSelector } from 'react-redux';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import { GeneralStyle } from '../../../constants/GeneralStyle';
import { TabView, SceneMap } from 'react-native-tab-view';

import SearchContainComponent from '@/components/SearchContainComponent';

const Search = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.userData);

  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    { key: 'Recent', title: 'Most Recent' },
    { key: 'Contains', title: 'Contains' },
    { key: 'Match', title: 'Best Match' },
  ]);
  const renderScene = SceneMap({
    Recent: SearchContainComponent,
    Contains: SearchContainComponent,
    Match: SearchContainComponent,
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
                      }
                }
              >
                {route.title}
              </Animated.Text>
              {props?.navigationState?.index == i ? (
                <View style={styles.propview} />
              ) : (
                <View style={styles.propview2} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Ionicons
        name="close"
        size={getFontSize(3.5)}
        onPress={() => navigation.goBack()}
        color="#126B87"
        style={{ alignSelf: 'flex-end', margin: getHeight(1), marginBottom: 0 }}
      />
      <TextInput
        style={{ ...GeneralStyle.input, width: getWidth(80) }}
        mode="outlined"
        left={
          <TextInput.Icon
            name={() => (
              <EvilIcons
                name={'search'}
                size={getFontSize(4)}
                color={'#757575'}
                style={{ marginTop: 5 }}
              />
            )}
          />
        }
        theme={{ roundness: 40 }}
        activeOutlineColor={'#126B87'}
        outlineColor="#126B87"
        label={'Search by Title, Article or Topic'}
        placeholderTextColor={'#032F3C'}
      />
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        renderTabBar={renderTabBar}
        onIndexChange={setIndex}
        initialLayout={{ width: getWidth(100) }}
      />
    </View>
  );
};
export default Search;
