import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
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
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { Avatar, TextInput } from 'react-native-paper';
import Toast from 'react-native-simple-toast';
import Icon from 'react-native-vector-icons/Entypo';
import { useDispatch, useSelector } from 'react-redux';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import AnimatedHeader from '@/components/AnimatedHeader';
import Button from '@/components/Button';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import { getuserAll, getuserGet, setUserSubscribe } from '@/redux/actions/UserAction';
import { ApiCall } from '@/services/api';
import { styles } from './styles';
import ImageModal from 'react-native-image-modal';

const Explore = (props) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const offset = useRef(new Animated.Value(0)).current;
  const token = useSelector((state) => state.auth.userToken);
  const user = useSelector((state) => state.auth.userData);
  const allusers = useSelector((state) => state.user.allUser);
  console.log('all user', allusers);

  const [subscribe, setSubscibe] = useState([]);

  useEffect(() => {
    dispatch(getuserAll({ token: token }));
  }, []);

  const handelSubscribe = async (id) => {
    setSubscibe([...subscribe, id]);
    try {
      const res = await ApiCall({
        route: `${user?.role}/subscribe/${id}`,
        token: token,
        verb: 'patch',
      });
      if (res?.status == '200') {
        // dispatch(getuserGet({ token: token, get: 'following', role: user?.role }));
        dispatch(getuserAll({ token: token }));
      } else {
        const result = subscribe.filter((item) => item != id);
        setSubscibe(result);
        Toast.show(' ' + res?.message);
      }
    } catch (e) {
      console.log('saga sign up err --- ', e);
    }
  };
  return (
    <View style={{ backgroundColor: 'white' }}>
      <GeneralStatusBar
        backgroundColor="white"
        barStyle="dark-content"
        hidden={false}
        translucent={true}
      />

      <AnimatedHeader
        animatedValue={offset}
        HEADER_HEIGHT={200}
        primarycolor={'#032F3C'}
        headerTitle={'Explore Influencers & Organizations'}
        goBack={props.goBack}
        backgroundImage={require('@/assets/images/pray2.jpeg')}
        tabBar={
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              alignItems: 'center',

              height: getHeight(7),
            }}
          >
            <Text>Local</Text>
            <Text>Feature</Text>
            <Text>Popular</Text>
            <Text>A-Z</Text>
          </View>
        }
      />

      <FlatList
        data={allusers}
        numColumns={3}
        contentContainerStyle={{
          marginBottom: getHeight(120),
          marginHorizontal: getWidth(3),
        }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: offset } } }], {
          useNativeDriver: false,
        })}
        showsHorizontalScrollIndicator={false}
        ListFooterComponent={() => <View style={{ padding: 450 }} />}
        ItemSeparatorComponent={() => <View style={{ margin: 7 }} />}
        ListEmptyComponent={() => (
          <View style={styles.askinterest}>
            <Text>No Any Influencers</Text>
            <Text style={{ margin: 15, color: '#7c7c7c' }}>
              Looks like you haven’t selected any interests
            </Text>
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
            <ImageModal
              resizeMode="contain"
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                marginBottom: 5,
              }}
              source={{
                uri: item?.profileImage,
              }}
            />

            <View
              style={{
                height: getHeight(6),
              }}
            >
              <Text numberOfLines={2} style={styles.subscribetext}>
                {item?.userName}
              </Text>
              <Text
                style={{
                  color: '#757575',
                  alignSelf: 'center',
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
    </View>
  );
};
export default Explore;
