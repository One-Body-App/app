import React, { useEffect, useState } from 'react';
import { Text, View, TextInput, Pressable } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Ionicons from '@react-native-vector-icons/ionicons';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import FontAwesome5 from '@react-native-vector-icons/fontawesome';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Button from '../Button';
import { setLoader, setPrayers } from '@/src/redux/actions/GeneralActions';
import Love from '@/assets/svg/Love.svg';
import Loved from '@/assets/svg/Loved.svg';
import Prayers from '@/assets/svg/prayers.svg';
import Rejoice from '@/assets/svg/Rejoice.svg';
import Rejoiced from '@/assets/svg/Rejoiced.svg';
import { styles } from './styles';
import { ApiCall } from '@/src/services/api';
import { RootState } from '@/src/redux/reducers/rootReducer';

interface PrayerSocialsProps {
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

function PrayerSocials({ item, color }: PrayerSocialsProps) {
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const prayers = useSelector((state: RootState) => state.prayer.prayers);

  const handelLike = async (id: string | undefined, type: 'praying' | 'rejoice' | 'loves') => {
    // updatelocalLike(id);
    try {
      const res = await ApiCall({
        route: `prayers/${type}/${id}`,
        token,
        verb: 'patch',
      });
      if (res?.status === 200) {
        updateList(id, res?.response?.data);
      }
    } catch (error) {
      // no-op: handle silently
    }
  };
  const updateList = (id: any, prayitem: any) => {
    // const arr = prayers;
    const index = prayers.findIndex((p) => p?.post?._id === id);
    prayers[index] = prayitem;
    const arr = prayers;
    dispatch(setPrayers([]));

    dispatch(setPrayers(arr));
  };
  const updateList2 = (id: any, prayitem: any) => {
    const arr = prayers;

    const index = arr.findIndex((p) => p?.post?._id === id);
    arr[index] = prayitem;
    dispatch(setPrayers([]));

    dispatch(setPrayers(arr));
  };
  const checkLike = (
    entry: {
      post?: {
        loves?: string[] | null;
        rejoice?: string[] | null;
        praying?: string[] | null;
      };
    },
    type: string
  ) => {
    if (type === 'loves') {
      return !!entry?.post?.loves?.includes(user?.userId ?? '');
    }
    if (type === 'rejoice') {
      return !!entry?.post?.rejoice?.includes(user?.userId ?? '');
    }
    if (type === 'praying') {
      return !!entry?.post?.praying?.includes(user?.userId ?? '');
    }
    return false;
  };
  return (
    <View style={{ flexDirection: 'row' }}>
      {item?.post?.prayerType === 'exhortation' ? null : (
        <Pressable
          style={{
            justifyContent: 'center',
            width: '28%',

            alignItems: 'center',
          }}
          onPress={() => {
            const itm = item;

            updateList2(item?.post?._id, itm);
            handelLike(item?.post?._id, 'praying');
          }}
        >
          <Prayers color="#126B87" />
          <Text style={checkLike(item, 'praying') ? { color } : { color: '#4F6D77' }}>
            {checkLike(item, 'praying') ? 'Praying' : 'Pray'}
          </Text>
        </Pressable>
      )}
      <Pressable
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
          item?.post?.prayerType === 'exhortation' ? { width: '38%' } : { width: '28%' },
        ]}
      >
        {checkLike(item, 'rejoice') ? <Rejoiced color="#126B87" /> : <Rejoice color="#126B87" />}
        <Text style={checkLike(item, 'rejoice') ? { color } : { color: '#4F6D77' }}>
          {checkLike(item, 'rejoice') ? 'Rejoiced' : 'Rejoice'}
        </Text>
      </Pressable>
      <Pressable
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          width: '28%',
        }}
        onPress={() => {
          const itm = item;
          updateList2(item?.post?._id, itm);
          handelLike(item?.post?._id, 'loves');
        }}
      >
        {checkLike(item, 'loves') ? <Loved color="#126B87" /> : <Love color="#126B87" />}
        <Text style={checkLike(item, 'loves') ? { color } : { color: '#4F6D77' }}>
          {checkLike(item, 'loves') ? 'Loved' : 'Love'}
        </Text>
      </Pressable>
    </View>
  );
}
export default PrayerSocials;
