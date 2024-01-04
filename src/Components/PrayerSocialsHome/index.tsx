import React, { useEffect, useState } from 'react';
import { Text, View, TextInput, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Button from '../Button';
import { setLoader, setPrayers, setPrayersLive } from '@/src/Redux/actions/GeneralActions';
import Love from '@/assets/svg/heart-white.svg';
import Loved from '@/assets/svg/loved_white.svg';
import Pray from '@/assets/svg/pray_white.svg';
import Praying from '@/assets/svg/prayed_white.svg';
import Rejoice from '@/assets/svg/rejoice_white.svg';
import Rejoiced from '@/assets/svg/Rejoiced_white.svg';
import { styles } from './styles';
import { ApiCall } from '@/src/Services/api';
import Toast from 'react-native-simple-toast';

const PrayerSocialsHome = ({ item, color }) => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.userToken);
  const user = useSelector((state) => state.auth.getProfileData);
  const prayers = useSelector((state) => state.prayer.prayersLive);

  const handelLike = async (id, type) => {
    try {
      const res = await ApiCall({
        route: `prayers/${type}/${id}`,
        token: token,
        verb: 'patch',
      });
      if (res?.status == '200') {
        getAllLive();
        updateList(id, res?.response?.data);
      } else {
        console.log('res==400', res?.response);
      }
    } catch (e) {
      console.log('saga sign up err --- ', e);
    }
  };

  const getAllLive = async () => {
    try {
      const res = await ApiCall({
        route: `prayers/live-wall`,
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
  const updateList = (id, prayitem) => {
    // const arr = prayers;
    var index = prayers.findIndex((p) => p?.post?._id == id);
    prayers[index] = prayitem;
    const arr = prayers;
    dispatch(setPrayers([]));

    dispatch(setPrayers(arr));
  };
  const updateList2 = (id, prayitem) => {
    const arr = prayers;

    var index = arr.findIndex((p) => p?.post?._id == id);
    arr[index] = prayitem;
    dispatch(setPrayers([]));

    dispatch(setPrayers(arr));
  };
  const checkLike = (item, type) => {
    if (type == 'loves') {
      return item?.post?.loves.includes(user?.userID);
    } else if (type == 'rejoice') {
      return item?.post?.rejoice.includes(user?.userID);
    } else if (type == 'praying') {
      return item?.post?.praying.includes(user?.userID);
    }
  };
  return (
    <View style={{ flexDirection: 'row' }}>
      {item?.post?.prayerType == 'exhortation' ? null : (
        <TouchableOpacity
          style={{
            justifyContent: 'center',
            width: '27%',

            alignItems: 'center',
          }}
          onPress={() => {
            let itm = item;

            updateList2(item?.post?._id, itm);
            handelLike(item?.post?._id, 'praying');
          }}
        >
          {checkLike(item, 'praying') ? (
            <Praying style={{ color: '#126B87' }} />
          ) : (
            <Pray style={{ color: '#126B87' }} />
          )}
          <Text
            style={
              checkLike(item, 'praying')
                ? { color: color, marginTop: 5 }
                : { color: '#e6eaec', marginTop: 5 }
            }
          >
            {checkLike(item, 'praying') ? 'Praying' : 'Pray'}
          </Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        onPress={() => {
          let itm = item;

          updateList2(item?.post?._id, itm);
          handelLike(item?.post?._id, 'rejoice');
        }}
        style={[
          {
            justifyContent: 'center',
            alignItems: 'center',
          },
          item.post.prayerType == 'exhortation' ? { width: '37%' } : { width: '27%' },
        ]}
      >
        {checkLike(item, 'rejoice') ? (
          <Rejoiced style={{ color: '#126B87' }} />
        ) : (
          <Rejoice style={{ color: '#126B87' }} />
        )}
        <Text
          style={
            checkLike(item, 'rejoice')
              ? { color: color, marginTop: 5 }
              : { color: '#e6eaec', marginTop: 5 }
          }
        >
          {checkLike(item, 'rejoice') ? 'Rejoiced' : 'Rejoice'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          width: '27%',
        }}
        onPress={() => {
          let itm = item;
          updateList2(item?.post?._id, itm);
          handelLike(item?.post?._id, 'loves');
        }}
      >
        {checkLike(item, 'loves') ? (
          <Loved style={{ color: '#126B87' }} />
        ) : (
          <Love color={'#126B87'} style={{ color: '#126B87' }} />
        )}
        <Text
          style={
            checkLike(item, 'loves')
              ? { color: color, marginTop: 5 }
              : { color: '#e6eaec', marginTop: 5 }
          }
        >
          {checkLike(item, 'loves') ? 'Loved' : 'Love'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
export default PrayerSocialsHome;
