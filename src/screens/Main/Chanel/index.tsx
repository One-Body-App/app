import React, { useEffect, useRef, useState } from 'react';

import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { Avatar, Divider } from 'react-native-paper';
import Modal from 'react-native-modal';

import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Header from '@/components/Header';
import { styles } from './styles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Button from '@/components/Button';
import { useDispatch, useSelector } from 'react-redux';
import { ApiCall } from '@/services/api';
import { setLoader } from '@/redux//actions/GeneralActions';
import { getuserGet, setUserIntrest, setUserSubscribe } from '@/redux//actions/UserAction';
import AddIntrestsModel from '@/components/AddIntrestsModel';
import SubscribeFlatlist from '@/components/SubscribeFlatlist';
import FastImage from 'react-native-fast-image';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import Entypo from 'react-native-vector-icons/Entypo';
import ImageModal from 'react-native-image-modal';

const Chanel = ({ navigation }) => {
  const loader = useSelector((state) => state.general.loader);
  const intrest = useSelector((state) => state.user.userInrest);
  const user = useSelector((state) => state.auth.userProfile);

  const subscribes = useSelector((state) => state.user.userSubscribes);
  const [show, setShow] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.userToken);

  const removeIntrest = async (id) => {
    const arr = intrest.filter((item) => item._id != id);
    dispatch(setUserIntrest(arr));
    try {
      const res = await ApiCall({
        route: `${user?.role}/remove-interest`,
        token: token,
        params: { interests: [id] },
        verb: 'patch',
      });
      if (res?.status == '200') {
        // dispatch(getuserGet({ token: token, get: 'interests', role: user?.role }));

        console.log('res == 200 ... ', res);
      } else {
        console.log('res != 200', res);
      }
    } catch (e) {
      console.log('saga error -- ', e.toString());
    }
  };

  const unSubscribed = async (id) => {
    const arr = subscribes.filter((item) => item._id != id);
    dispatch(setUserSubscribe(arr));
    try {
      const res = await ApiCall({
        route: `${user?.role}/unsubscribe/${id}`,
        token: token,
        verb: 'patch',
      });
      if (res?.status == '200') {
        // dispatch(getuserGet({ token: token, get: 'following', role: user?.role }));
        console.log('res == 200 ... ', res?.response);
      } else {
        console.log('res != 200 ... ', res?.response);
      }
    } catch (e) {
      console.log('saga error -- ', e.toString());
    }
  };

  useEffect(() => {
    dispatch(setLoader(true));
    // dispatch(getuserGet({ token: token, get: 'following', role: user?.role }));
    setTimeout(function () {
      // dispatch(getuserGet({ token: token, get: 'interests', role: user?.role }));
    }, 2000);
  }, []);

  const SubscribeFlatlists = () => {
    return (
      <FlatList
        data={subscribes}
        ListFooterComponent={() => <View style={{ padding: 7 }} />}
        ListHeaderComponent={<Text style={styles.mysubscription}>My Subscriptions</Text>}
        ItemSeparatorComponent={() => <Divider />}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('UserProfile', {
                id: item?._id,
              })
            }
            style={styles.subscribeview}
          >
            <View style={{ flexDirection: 'row', width: '45%' }}>
              <ImageModal
                resizeMode="contain"
                style={{ width: 70, height: 70, borderRadius: 35 }}
                source={{
                  uri: item?.profileImage,
                }}
              />

              <View style={{ ...styles.simpleview, justifyContent: 'center' }}>
                <Text numberOfLines={2} style={styles.subscribetext}>
                  {item?.name}
                </Text>
                <Text
                  style={{
                    color: '#757575',
                    fontFamily: 'Rubik-Regular',
                  }}
                >
                  {item?.whatIDo?.whatIDo}
                </Text>
              </View>
            </View>

            <Button
              btnStyle={[styles.subscribebutton]}
              btnTextStyle={styles.subtex}
              text={'Subscribed'}
              onPress={() => {
                unSubscribed(item?._id);
              }}
            />
          </TouchableOpacity>
        )}
      />
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <GeneralStatusBar
        backgroundColor="white"
        barStyle="dark-content"
        hidden={false}
        translucent={true}
      />

      <Header
        title={'My Channels'}
        leftView={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back-outline" size={20} />
          </TouchableOpacity>
        }
        RightView={<View style={{ width: getWidth(5) }} />}
      />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <AddIntrestsModel setShow={setShow} show={show} />
        <Modal
          backdropOpacity={0.3}
          isVisible={showSubscription}
          onBackdropPress={() => setShowSubscription(false)}
          onSwipeComplete={() => setShowSubscription(false)}
          swipeDirection={['down']}
          style={styles.bottomView}
          onRequestClose={() => setShowSubscription(false)}
        >
          <View style={styles.content3}>
            <View style={styles.headLine} />
            <View style={styles.container}>
              <SubscribeFlatlist />
            </View>
          </View>
        </Modal>
        <FlatList
          data={intrest}
          ListFooterComponent={
            <View>
              <SubscribeFlatlists />
            </View>
          }
          ListHeaderComponent={<Text style={styles.myinterest}>My Interests</Text>}
          keyExtractor={(item, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          numColumns={4}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              onPress={() => removeIntrest(item?._id)}
              style={[styles.listItem, { backgroundColor: '#032F3C' }]}
            >
              <Text numberOfLines={1} style={{ color: 'white', maxWidth: getWidth(19) }}>
                {item?.name}
              </Text>
            </TouchableOpacity>
          )}
        />
        <Button
          text="Add Interests & Subscribe"
          leftIcon={<Entypo name="plus" color={'#032f3c'} style={{ marginRight: 5 }} />}
          btnStyle={styles.batonstyle}
          btnTextStyle={{ fontSize: getFontSize(2), color: '#032f3c' }}
          onPress={() => navigation.navigate('Home', { tabs: 'Explore' })}
        />
      </View>
    </View>
  );
};
export default Chanel;
