import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Animated,
  Image,
  ImageBackground,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Avatar, Provider, Switch, TextInput } from 'react-native-paper';
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

const Notificationandemail = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.userData);
  const [notificationSwitchOn, setNotificationSwitch] = React.useState(false);
  const [notificationSwitchOn2, setNotificationSwitch2] = React.useState(false);
  const [notificationSwitchOn3, setNotificationSwitch3] = React.useState(false);
  return (
    <View style={styles.container}>
      <GeneralStatusBar
        backgroundColor="white"
        barStyle="dark-content"
        hidden={false}
        translucent={true}
      />

      <Header
        title={'Notification & email settings'}
        leftView={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} />
          </TouchableOpacity>
        }
        RightView={<View style={{ width: getWidth(5) }} />}
      />
      <View style={styles.innerContainer}>
        <View style={styles.list}>
          <View style={styles.point} />
          <Text style={styles.heading}>Push Notifications</Text>

          <Switch
            value={notificationSwitchOn}
            color="#126B87"
            onValueChange={() => {
              setNotificationSwitch(!notificationSwitchOn);
            }}
          />
        </View>
        <View style={styles.list}>
          <View style={styles.point} />

          <Text style={styles.heading}>Email Notifications</Text>

          <Switch
            value={notificationSwitchOn2}
            color="#126B87"
            onValueChange={() => {
              setNotificationSwitch2(!notificationSwitchOn2);
            }}
          />
        </View>
        <View style={styles.list}>
          <View style={styles.point} />

          <View style={{ width: '70%' }}>
            <Text style={styles.heading}>Newsletters</Text>
            <Text numberOfLines={2} style={{ color: '#70747D' }}>
              Receive emails with events reccommendations based on...
            </Text>
          </View>

          <Switch
            value={notificationSwitchOn3}
            color="#126B87"
            onValueChange={() => {
              setNotificationSwitch3(!notificationSwitchOn3);
            }}
          />
        </View>
      </View>
    </View>
  );
};
export default Notificationandemail;
