import React from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SceneMap, TabView } from 'react-native-tab-view';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import GoBackIcon from '@/components/GoBackIcon';
import LoginComponent from '@/components/LoginComponent';
import GradientHeader from '@/components/GradientHeader';
import SignupButtons from '@/components/SignupButtons';
import { getWidth } from '@/utils/ResponsiveFun';
import { appColor } from '../../../constants';
import { styles } from './styles';

const Signup = () => {
  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    { key: 'Signup', title: 'Sign up' },
    { key: 'Login', title: 'Log in' },
  ]);
  const renderScene = SceneMap({
    Signup: SignupButtons,
    Login: LoginComponent,
  });
  const renderTabBar = (props) => {
    return (
      <LinearGradient colors={[appColor.PrimaryColor, appColor.PrimaryColor]} style={styles.tabBar}>
        {props.navigationState.routes.map((route, i) => {
          return (
            <TouchableOpacity style={styles.tabItem} onPress={() => setIndex(i)}>
              <Animated.Text
                style={props?.navigationState?.index == i ? styles.selectedTabText : styles.TabTex}
              >
                {route.title}
              </Animated.Text>
              {props?.navigationState?.index == i ? (
                <View style={styles.animatedview} />
              ) : (
                <View style={styles.animatedview2} />
              )}
            </TouchableOpacity>
          );
        })}
      </LinearGradient>
    );
  };
  return (
    <View style={styles.container}>
      <GeneralStatusBar
        backgroundColor={appColor.StatusBarColor}
        barStyle="light-content"
        hidden={false}
        translucent={true}
      />
      <GradientHeader />
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        renderTabBar={renderTabBar}
        onIndexChange={setIndex}
        initialLayout={{ width: getWidth(100) }}
      />
      <GoBackIcon color={'white'} />
    </View>
  );
};

export default Signup;
