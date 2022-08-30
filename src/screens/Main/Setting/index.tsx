import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Linking,
  Animated,
  Image,
  ImageBackground,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Avatar, Provider, TextInput } from 'react-native-paper';
import DropDown from 'react-native-paper-dropdown';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { styles } from './styles';
import Header from '@/components/Header';
import { logout } from '@/redux//actions/AuthActions';
import { useDispatch, useSelector } from 'react-redux';
import { color } from 'react-native-reanimated';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import { LoginManager } from 'react-native-fbsdk-next';
import auth from '@react-native-firebase/auth';

const Setting = ({ navigation }) => {
  const dispatch = useDispatch();
  const GOOGLE_PACKAGE_NAME = 'agrawal.trial.yourfeedback';
  const APPLE_STORE_ID = 'id284882215';
  const user = useSelector((state) => state.auth.userData);
  const startRatingCounter = () => {
    Alert.alert(
      'Rate us',
      'Would you like to share your review with us? This will help and motivate us a lot.',

      [
        { text: 'Sure', onPress: () => openStore() },
        {
          text: 'No Thanks!',

          onPress: () => console.log('No Thanks Pressed'),
          style: 'cancel',
        },
      ],
      { cancelable: false }
    );
  };
  const openStore = () => {
    //This is the main trick
    if (Platform.OS != 'ios') {
      Linking.openURL(`market://details?id=${GOOGLE_PACKAGE_NAME}`).catch((err) =>
        alert('Please check for Google Play Store')
      );
    } else {
      Linking.openURL(`itms://itunes.apple.com/in/app/apple-store/${APPLE_STORE_ID}`).catch((err) =>
        alert('Please check for the App Store' + err)
      );
    }
  };

  return (
    <View style={styles.container}>
      <GeneralStatusBar
        backgroundColor="white"
        barStyle="dark-content"
        hidden={false}
        translucent={true}
      />

      <Header
        title={'Settings'}
        leftView={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} />
          </TouchableOpacity>
        }
        RightView={<View style={{ width: getWidth(5) }} />}
      />
      <View style={styles.innerContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('passwordChange')} style={styles.list}>
          <View>
            <Text style={styles.heading}>Password</Text>
            <Text style={{ color: '#70747D' }}>Change Password</Text>
          </View>
          <AntDesign name="right" size={20} color={'#70747D'} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('PhoneNumberUpdate')}
          style={styles.list}
        >
          <View>
            <Text style={styles.heading}>Phone number</Text>
            <Text style={{ color: '#70747D' }}>*********3456</Text>
          </View>
          <AntDesign name="right" size={20} color={'#70747D'} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('Notificationandemail')}
          style={styles.list}
        >
          <View>
            <Text style={styles.heading}>Notification & Email Setting</Text>
          </View>
          <AntDesign name="right" size={20} color={'#70747D'} />
        </TouchableOpacity>

        {user?.isInfluencer == true ? null : (
          <TouchableOpacity
            onPress={() => {
              user?.isInfluencer == true
                ? Alert.alert('You Already a Influencer')
                : navigation.navigate('InfluencerStepOne');
            }}
            style={styles.list}
          >
            <Text style={styles.heading}>Become an influencer</Text>

            <AntDesign name="right" size={20} color={'#70747D'} />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => startRatingCounter()} style={styles.list}>
          <Text style={styles.heading}>Feedback</Text>

          <AntDesign name="right" color={'#70747D'} size={20} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('Deactivateaccount')}
          style={styles.list}
        >
          <Text
            style={{
              ...styles.heading,
              color: 'red',
            }}
          >
            Deactivate account
          </Text>

          <AntDesign name="right" color={'red'} size={20} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        onPress={() => {
          LoginManager.logOut();
          auth().signOut();
          dispatch(logout());
        }}
        style={{ ...styles.lists, marginBottom: 10, borderBottomWidth: 0 }}
      >
        <Text style={styles.logouttext}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
};
export default Setting;
