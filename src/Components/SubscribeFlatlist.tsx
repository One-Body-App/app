import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  Image,
} from 'react-native';
import Toast from 'react-native-simple-toast';
import { useDispatch, useSelector } from 'react-redux';
import { getHeight, getWidth } from '@/utils/ResponsiveFun';

import Button from './Button';
import { ApiCall } from '@/services/api';
import { getuserAll } from '@/redux/actions/UserAction';
import FastImage from 'react-native-fast-image';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootState } from '../Redux/reducers/rootReducer';

import { RootStackParamList } from '../Navigation/types';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons/faUser';
import { faCircle } from '@fortawesome/free-solid-svg-icons/faCircle';
import { User } from '@/utils/types';

type ScreenNavigationProp = NavigationProp<RootStackParamList, 'Home'>;

const SubscribeFlatlist = ({
  horizontal,
  numColumns,
  hideFollowButton,
  itemStyle,
  setScrollPosition,
  users,
}: {
  horizontal?: boolean;
  numColumns?: number;
  hideFollowButton?: boolean;
  itemStyle?: StyleProp<ViewStyle>;
  setScrollPosition?: (position: number) => void;
  users?: User[];
}) => {
  const dispatch = useDispatch();
  const navigation = useNavigation<ScreenNavigationProp>();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const allusers = useSelector((state: RootState) => state.user.allUser);
  const user = useSelector((state: RootState) => state.auth.userProfile);

  const [subscribe, setSubscibe] = useState<string[]>([]);
  // const [allusers, setAllUsers] = useState([]);

  const handleSubscribe = async (id: string) => {
    // updatelocalLike(id);
    setSubscibe([...subscribe, id]);
    try {
      const res = await ApiCall({
        route: `user/subscribe/${id}`,
        token: token,
        verb: 'patch',
      });
      if (res?.status == 200) {
        dispatch(getuserAll({ token: token, limit: 10 }));
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
    dispatch(getuserAll({ token: token, limit: 10 }));
  }, []);
  return (
    <FlatList
      nestedScrollEnabled
      data={users ? users : allusers}
      numColumns={numColumns}
      horizontal={horizontal}
      showsHorizontalScrollIndicator={false}
      ListFooterComponent={() => <View style={{ padding: 7 }} />}
      ListHeaderComponent={() => <View style={{ padding: 7 }} />}
      ItemSeparatorComponent={() => <View style={{ margin: 7 }} />}
      onScroll={(e) => {
        if (setScrollPosition) setScrollPosition(e.nativeEvent.contentOffset.y);
      }}
      renderItem={({ item, index }) => (
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('UserProfile', {
              id: item?._id,
            })
          }
          style={[styles.subscribeview, itemStyle]}
        >
          <View>
            <FastImage
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                marginBottom: 5,
                borderColor: item?.profileImage ? '#032F3C' : '#09aadb',
                borderWidth: 1,
              }}
              source={{ uri: item?.profileImage || 'https://cdn.onebodyapp.com/user/no-image.png' }}
              resizeMode={'contain'}
            />
          </View>

          <View
            style={{
              height: getHeight(6),
            }}
          >
            <Text numberOfLines={2} style={styles.subscribetext}>
              {item?.role == 'organization' && item?.profile?.companyName
                ? item?.profile?.companyName
                : item?.name}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                color: '#757575',
              }}
            >
              {item?.name}
            </Text>
          </View>
          {!hideFollowButton ? (
            <Button
              btnStyle={[
                styles.subscribebutton,
                subscribe.includes(item?._id) ? { backgroundColor: 'gray' } : null,
              ]}
              btnTextStyle={styles.subtex}
              text={subscribe.includes(item?._id) ? 'Following' : 'Follow'}
              onPress={() => {
                handleSubscribe(item?._id);
              }}
            />
          ) : null}
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

    width: getWidth(30),
    borderRadius: 10,
  },
  subtex: {
    fontWeight: 'bold',
    color: '#F6F6F6',
    letterSpacing: 0.5,
  },
});
export default SubscribeFlatlist;
