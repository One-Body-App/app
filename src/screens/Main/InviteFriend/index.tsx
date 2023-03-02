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
  TextInput,
  ScrollView,
} from 'react-native';
import { Avatar, Provider } from 'react-native-paper';
import DropDown from 'react-native-paper-dropdown';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Ionicons from 'react-native-vector-icons/Ionicons';
import QRCode from 'react-native-qrcode-svg';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Header from '@/components/Header';
import Button from '@/components/Button';
import { styles } from './styles';
import Share from 'react-native-share';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import { GeneralStyle } from '../../../constants/GeneralStyle';
import { useTheme } from '@react-navigation/native';

const InviteFriend = ({ navigation }) => {
  const shareUrl = async () => {
    const shareOptions = {
      title: 'Share url',
      message: 'invite link is there..........',
      failOnCancel: false,
    };
    try {
      const ShareResponse = await Share.open(shareOptions);
      setResult(JSON.stringify(ShareResponse, null, 2));
    } catch (error) {
      console.log('Error =>', error);
      setResult('error: '.concat(getErrorString(error)));
    }
  };
  const { dark, colors } = useTheme();
  return (
    <View style={styles.container}>
      <GeneralStatusBar hidden={false} translucent={true} />

      <Header
        title={'Invite a friend'}
        leftView={
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Ionicons name="menu" size={24} color={colors.text} />
          </TouchableOpacity>
        }
        RightView={<View style={{ width: getWidth(5) }} />}
      />
      <View style={styles.innerContainer}>
        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: getHeight(5),
          }}
        >
          <Text style={[styles.heading, { color: dark ? colors.text : '#032F3C' }]}>
            Scan QR code
          </Text>
          <Text style={styles.text}>Scan QR code to invite your friend</Text>
        </View>
        <QRCode
          size={getFontSize(35)}
          value="http://awesome.link.qr"
          logo={require('@/assets/images/LogoMain.png')}
          logoSize={getFontSize(9)}
          logoBackgroundColor="white"
        />
        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: getHeight(7),
          }}
        >
          <Text style={[styles.heading, { color: dark ? colors.text : '#032F3C' }]}>
            Invite link
          </Text>
          <Text style={styles.text}>Or send an invite link to your friend</Text>
        </View>

        <Button
          text={'SHARE THE LINK'}
          // RightIcon={<Ionicons name={'share-outline'} size={getFontSize(3)} />}
          btnStyle={{
            ...GeneralStyle.btn,
            backgroundColor: '#E6EAEC',
            marginTop: 25,
          }}
          btnTextStyle={{ ...GeneralStyle.btnText, color: '#032F3C' }}
          onPress={() => shareUrl()}
        />
      </View>
    </View>
  );
};
export default InviteFriend;
