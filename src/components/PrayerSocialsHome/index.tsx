import React, { useCallback, useEffect, useState } from 'react';
import { Text, View, TextInput, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Ionicons from '@react-native-vector-icons/ionicons';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import FontAwesome5 from '@react-native-vector-icons/fontawesome';
import Toast from 'react-native-simple-toast';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Button from '../Button';
import { setLoader, setPrayers, setPrayersLive } from '@/src/redux/actions/GeneralActions';
import Love from '@/assets/svg/heart-white.svg';
import Loved from '@/assets/svg/loved_white.svg';
import Pray from '@/assets/svg/pray_white.svg';
import Praying from '@/assets/svg/prayed_white.svg';
import Rejoice from '@/assets/svg/rejoice_white.svg';
import Rejoiced from '@/assets/svg/Rejoiced_white.svg';
import { styles } from './styles';
import { ApiCall } from '@/src/services/api';
import { RootState } from '@/src/redux/reducers/rootReducer';

interface PrayerSocialsHomeProps {
  item: {
    post?: {
      _id?: string;
      loves?: string[];
      rejoice?: string[];
      praying?: string[];
      prayerType?: string;
    };
  };
  color?: string;
}

function PrayerSocialsHome({ item, color }: PrayerSocialsHomeProps) {
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const prayers = useSelector((state: RootState) => state.prayer.prayersLive);

  const handelLike = async (id: string | undefined, type: 'praying' | 'rejoice' | 'loves') => {
    try {
      const res = await ApiCall({
        route: `prayers/${type}/${id}`,
        token,
        verb: 'patch',
      });
      if (res?.status === 200) {
        getAllLive();
        updateList(id, res?.response?.data);
      }
    } catch (error) {
      // no-op: handle silently
    }
  };

  const getAllLive = async () => {
    try {
      const res = await ApiCall({
        route: `prayers/live-wall`,
        verb: 'get',
        token,
      });
      if (res?.status === 200) {
        dispatch(setPrayersLive(res?.response?.data));
      }
    } catch (error) {
      // no-op: handle silently
    }
  };
  const updateList = (id: any, prayitem: any) => {
    // const arr = prayers;
    const index = prayers.findIndex((p: { post: { _id: any } }) => p?.post?._id === id);
    prayers[index] = prayitem;
    const arr = prayers;
    dispatch(setPrayers([]));

    dispatch(setPrayers(arr));
  };
  const updateList2 = (id: any, prayitem: any) => {
    const arr = prayers;

    const index = arr.findIndex((p: { post: { _id: any } }) => p?.post?._id === id);
    arr[index] = prayitem;
    dispatch(setPrayers([]));

    dispatch(setPrayers(arr));
  };
  const checkLike = useCallback(
    (
      entry: {
        post?: {
          loves?: (string | null)[];
          rejoice?: (string | null)[];
          praying?: (string | null)[];
        };
      },
      type: 'loves' | 'rejoice' | 'praying'
    ) => {
      const userId = user?.userId ?? '';
      if (type === 'loves') {
        return !!entry?.post?.loves?.includes(userId);
      }
      if (type === 'rejoice') {
        return !!entry?.post?.rejoice?.includes(userId);
      }
      if (type === 'praying') {
        return !!entry?.post?.praying?.includes(userId);
      }
      return false;
    },
    [user?.userId]
  );
  return (
    <View style={{ flexDirection: 'row' }}>
      {item?.post?.prayerType === 'exhortation' ? null : (
        <TouchableOpacity
          style={{
            justifyContent: 'center',
            width: '27%',

            alignItems: 'center',
          }}
          onPress={() => {
            const itm = item;

            updateList2(item?.post?._id, itm);
            handelLike(item?.post?._id, 'praying');
          }}
        >
          {checkLike(item, 'praying') ? <Praying color="#126B87" /> : <Pray color="#126B87" />}
          <Text
            style={
              checkLike(item, 'praying')
                ? { color, marginTop: 5 }
                : { color: '#e6eaec', marginTop: 5 }
            }
          >
            {checkLike(item, 'praying') ? 'Praying' : 'Pray'}
          </Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        onPress={() => {
          const itm = item;

          updateList2(item?.post?._id, itm);
          handelLike(item?.post?._id, 'rejoice');
        }}
        style={[
          {
            justifyContent: 'center',
            alignItems: 'center',
          },
          item?.post?.prayerType === 'exhortation' ? { width: '37%' } : { width: '27%' },
        ]}
      >
        {checkLike(item, 'rejoice') ? <Rejoiced color="#126B87" /> : <Rejoice color="#126B87" />}
        <Text
          style={
            checkLike(item, 'rejoice')
              ? { color, marginTop: 5 }
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
          const itm = item;
          updateList2(item?.post?._id, itm);
          handelLike(item?.post?._id, 'loves');
        }}
      >
        {checkLike(item, 'loves') ? <Loved color="#126B87" /> : <Love color="#126B87" />}
        <Text
          style={
            checkLike(item, 'loves') ? { color, marginTop: 5 } : { color: '#e6eaec', marginTop: 5 }
          }
        >
          {checkLike(item, 'loves') ? 'Loved' : 'Love'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
export default PrayerSocialsHome;
