import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import { Avatar, TextInput } from 'react-native-paper';
import Toast from 'react-native-simple-toast';
import { useDispatch, useSelector } from 'react-redux';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

import Button from './Button';
import { ApiCall } from '@/services/api';
import { getuserAll } from '@/redux/actions/UserAction';
import FastImage from 'react-native-fast-image';
import { useNavigation } from '@react-navigation/native';
import ImageModal from 'react-native-image-modal';

const SubscribeFlatlist = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const token = useSelector((state) => state.auth.userToken);
  const allusers = useSelector((state) => state.user.allUser);
  const user = useSelector((state) => state.auth.userData);

  const [subscribe, setSubscibe] = useState([]);
  // const [allusers, setAllUsers] = useState([]);

  const handelSubscribe = async (id) => {
    // updatelocalLike(id);
    setSubscibe([...subscribe, id]);
    try {
      const res = await ApiCall({
        route: `${user?.role}/subscribe/${id}`,
        token: token,
        verb: 'patch',
      });
      if (res?.status == '200') {
        dispatch(getuserAll({ token: token }));
      } else {
        const result = subscribe.filter((item) => item != id);
        setSubscibe(result);
        Toast.show(' ' + res?.response?.message);
      }
    } catch (e) {
      console.log('saga sign up err --- ', e);
    }
  };
  useEffect(() => {
    dispatch(getuserAll({ token: token }));
  }, []);
  return (
    <FlatList
      data={allusers}
      horizontal={true}
      showsHorizontalScrollIndicator={false}
      ListFooterComponent={() => <View style={{ padding: 7 }} />}
      ListHeaderComponent={() => <View style={{ padding: 7 }} />}
      ItemSeparatorComponent={() => <View style={{ margin: 7 }} />}
      ListEmptyComponent={() => (
        <View style={styles.askinterest}>
          <Text style={{ margin: 5, fontSize: getFontSize(2), color: '#7c7c7c' }}>
            We have not found any other User
          </Text>
          <Button
            text="Refresh"
            btnStyle={styles.subscribebutton}
            btnTextStyle={{ fontSize: getFontSize(2.5), color: 'white' }}
            onPress={() => dispatch(getuserAll({ token: token }))}
          />
        </View>
      )}
      renderItem={({ item, index }) => (
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('UserProfile', {
              role: item?.role,
              id: item?._id,
            })
          }
          style={styles.subscribeview}
        >
          <TouchableOpacity>
            <ImageModal
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                marginBottom: 5,
              }}
              source={{
                uri: item?.profileImage,
              }}
              resizeMode={'contain'}
            />
          </TouchableOpacity>
          <View
            style={{
              height: getHeight(6),
            }}
          >
            <Text numberOfLines={2} style={styles.subscribetext}>
              {item?.userName}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                color: '#757575',
              }}
            >
              {item?.whatIDo?.whatIDo}
            </Text>
          </View>
          <Button
            btnStyle={[
              styles.subscribebutton,
              subscribe.includes(item?._id) ? { backgroundColor: 'gray' } : null,
            ]}
            btnTextStyle={styles.subtex}
            text={subscribe.includes(item?._id) ? 'Subscribed' : 'Subscribe'}
            onPress={() => {
              handelSubscribe(item?._id);
            }}
          />
        </TouchableOpacity>
      )}
    />
  );
};
const styles = StyleSheet.create({
  subscribeview: {
    alignItems: 'center',

    width: getWidth(28),
    height: getHeight(24),
    borderRadius: 10,
  },
  askinterest: {
    justifyContent: 'center',
    alignItems: 'center',
    height: getHeight(15),
    width: getWidth(100),
  },

  subscribetext: {
    padding: 2,
    color: '#032F3C',
    fontFamily: 'Rubik-Medium',
    fontSize: 12,

    textAlign: 'center',
  },
  subscribebutton: {
    backgroundColor: '#7c7c7c',
    padding: 12,

    justifyContent: 'center',
    alignItems: 'center',

    width: getWidth(28),
    borderRadius: 10,
  },
  subtex: {
    fontWeight: 'bold',
    color: '#F6F6F6',
    letterSpacing: 0.5,
  },
});
export default SubscribeFlatlist;
