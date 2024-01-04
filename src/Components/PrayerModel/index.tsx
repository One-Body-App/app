import React, { useEffect, useState, createRef } from 'react';
import {
  Text,
  View,
  Image,
  ActivityIndicator,
  Keyboard,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Platform,
} from 'react-native';
import { Avatar } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { setLoader, setPrayers, setUserPrayers } from '@/redux/actions/GeneralActions';
import { ApiCall } from '@/services/api';
import { styles } from './styles';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Button from '../Button';
import PrayerInputType from '../PrayerInputType';
import PrayerSocials from '../PrayerSocials';
import FastImage from 'react-native-fast-image';
import { AutoScrollFlatList } from 'react-native-autoscroll-flatlist';
import PrayerInputHome from '../PrayerInputHome';
import { getAllPrayer, getAllPrayerLive, getMyPrayer } from '@/redux/actions/PrayerAction';
import LiveStreamFlatlist from '../LiveStreamFlatlist';
import LiveStreamFlatlist2 from '../LiveStreamFlatlist2';
import { useNavigation } from '@react-navigation/native';
import { TwilioService } from '@/services/Twillio/TwilioServicetjs';
import { getToken } from '@/services/Twillio/api-service';

const PrayerModel = ({ setRequestModel }) => {
  const dispatch = useDispatch();
  const prayers = useSelector((state) => state.prayer.prayersLive);
  const token = useSelector((state) => state.auth.userToken);
  const userPrayers = useSelector((state) => state.prayer.prayers);
  const [isKeyboardVisible, setKeyboardVisible] = useState(0);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      (Platform.OS = 'ios') ? setKeyboardVisible(e.endCoordinates.height) : null; // or some other action
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(0); // or some other action
    });

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);
  const navigation = useNavigation();

  const goToprayer = (item) => {
    const arr = [item, ...userPrayers];
    dispatch(setPrayers(arr));
    navigation.navigate('Prayer');
  };

  const OpenConversation = async (id) => {
    // onCreateOrJoin(id);
    dispatch(setLoader(true));
    try {
      const res = await ApiCall({
        params: { receiver: id },
        token: token,
        route: 'chat/new-chat-room',
        verb: 'post',
      });
      if (res?.status == '200') {
        dispatch(setLoader(false));
        navigation.navigate('conversation', {
          reciver: res?.response?.data?.receiver,
          reciverId: res?.response?.data?._id,
        });
      } else {
        console.log('error', re?.response);
        dispatch(setLoader(false));
      }
    } catch (e) {
      console.log('chanel create err --- ', e);
    }
  };

  return (
    <LinearGradient
      // colors={['#126B87', '#094558', '#032F3C']}
      colors={['#7c97a0', '#032F3C', '#032F3C']}
      style={{ ...styles.requestModel, bottom: isKeyboardVisible }}
    >
      {/* <LiveStreamFlatlist prayers={prayers} goToprayer={goToprayer} /> */}
      <LiveStreamFlatlist2
        prayers={prayers}
        goToprayer={goToprayer}
        OpenConversation={OpenConversation}
      />
      <TouchableOpacity
        onPress={() => {
          setRequestModel(false);
        }}
        style={{
          padding: 5,
          position: 'absolute',
          alignSelf: 'flex-end',

          top: 0,

          right: 0,
        }}
      >
        <Ionicons name="close" size={30} color="white" />
      </TouchableOpacity>

      <LinearGradient
        colors={['#032f3c', '#032f3c']}
        style={{
          position: 'absolute',
          paddingBottom: 5,
          backgroundColor: '#032f3c',
          bottom: 0,
          left: 0,
          right: 0,
          opacity: 0.95,
        }}
      >
        <PrayerInputHome color={'white'} />
      </LinearGradient>
    </LinearGradient>
  );
};
export default PrayerModel;
