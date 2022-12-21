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
import { getuserAll } from '@/redux//actions/UserAction';
import AddIntrestsModel from '@/components/AddIntrestsModel';
import SubscribeFlatlist from '@/components/SubscribeFlatlist';
import FastImage from 'react-native-fast-image';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import Entypo from 'react-native-vector-icons/Entypo';
import ImageModal from 'react-native-image-modal';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { Interest, User } from '@/utils/types';
import { RootStackParamList } from '@/src/Navigation/types';
import { StackScreenProps } from '@react-navigation/stack';

type Props = StackScreenProps<RootStackParamList, 'Channel'>;

const Chanel = ({ navigation }: Props) => {
  const subscribes = useSelector((state: RootState) => state.user.userSubscribes);
  const [show, setShow] = useState(false);
  const user = useSelector((state: RootState) => state.auth.userProfile);
  const [showSubscription, setShowSubscription] = useState(false);
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.userToken);

  const [following, setFollowing] = useState<User[]>([]);

  const [selectedInterest, setSelectedInterest] = useState<Interest[]>(user?.interests ?? []);

  const removeInterests = async (newInterest: Interest) => {
    dispatch(setLoader(true));

    try {
      const res = await ApiCall({
        route: 'user/remove-interests',
        token: token,
        params: {
          interests: selectedInterest.filter((interest) => interest._id != newInterest._id),
        },
        verb: 'patch',
      });

      if (res?.status == 200) {
        dispatch(setLoader(false));
        selectedInterest.filter((itemToFilter) => itemToFilter._id == newInterest?._id).length > 0
          ? setSelectedInterest(
              selectedInterest.filter(function (item2) {
                return item2._id !== newInterest?._id;
              })
            )
          : setSelectedInterest([...selectedInterest, newInterest]);
      } else {
        dispatch(setLoader(false));
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  const handleUnSubscribe = async (id: string) => {
    try {
      const res = await ApiCall({
        route: `user/unsubscribe/${id}`,
        token: token,
        verb: 'patch',
      });
      if (res?.status == 200) {
        // dispatch(getuserGet({ token: token, get: 'following', role: user?.role }));
        await getFollowing();
      } else {
        const result = following.filter((item) => item._id != id);
        // setSubscibe(result);
      }
    } catch (e) {
      console.log('saga sign up err --- ', e);
    }
  };

  const getFollowing = async () => {
    try {
      const res = await ApiCall({
        route: 'user/get-following',
        verb: 'get',
        token: token,
      });
      console.log(res?.response, 'res?.responseres?.response');
      if (res?.status == 200) {
        setFollowing(res?.response?.data);
      } else {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  useEffect(() => {
    getFollowing();
  }, []);

  const SubscribeFlatlists = () => {
    return (
      <FlatList
        data={following}
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
                  uri:
                    item?.profileImage && item?.profileImage != ''
                      ? item?.profileImage
                      : 'https://cdn.onebodyapp.com/user/no-image.png',
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
                  {item?.whatIDo?.name}
                </Text>
              </View>
            </View>

            <Button
              btnStyle={[styles.subscribebutton]}
              btnTextStyle={styles.subtex}
              text={'Unfollow'}
              onPress={() => {
                handleUnSubscribe(item?._id);
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
        title={'Connections'}
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
        >
          <View style={styles.content3}>
            <View style={styles.headLine} />
            <View style={styles.container}>
              <SubscribeFlatlist />
            </View>
          </View>
        </Modal>
        <FlatList
          data={selectedInterest}
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
              onPress={() => removeInterests(item)}
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
          onPress={() => navigation.navigate('Explore')}
        />
      </View>
    </View>
  );
};
export default Chanel;
