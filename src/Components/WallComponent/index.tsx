import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Text,
  View,
  Keyboard,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Avatar, Divider } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import Entypo from 'react-native-vector-icons/Entypo';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import { setLoader, setPrayers } from '@/redux/actions/GeneralActions';
import { ApiCall } from '@/services/api';
import PrayerInputType from '../PrayerInputType';
import PrayerSocials from '../PrayerSocials';
import FastImage from 'react-native-fast-image';
import { getAllPrayer } from '@/redux/actions/PrayerAction';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Love from '@/assets/svg/redlove.svg';
import Love2 from '@/assets/svg/Love.svg';
import { useNavigation } from '@react-navigation/native';

const WallComponent = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const token = useSelector((state) => state.auth.userToken);
  const user = useSelector((state) => state.auth.userProfile);
  const prayers = useSelector((state) => state.prayer.prayers);
  const currentPage = useSelector((state) => state.prayer.ALLPrayerCurrentPage);
  const totalPage = useSelector((state) => state.prayer.ALLPrayerTotalPage);
  const [isKeyboardVisible, setKeyboardVisible] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // getPrayers(currentPage);
    dispatch(
      getAllPrayer({
        pageno: 1,
        token: token,
        Prayers: prayers,
        setIsLoading: setIsLoading,
      })
    );
  }, []);
  const handleLoadMore = () => {
    if (currentPage < totalPage) {
      setIsLoading(true);
      dispatch(
        getAllPrayer({
          pageno: currentPage + 1,
          token: token,
          Prayers: prayers,
          setIsLoading: setIsLoading,
        })
      );
    }
  };

  const handelLike = async (id, type) => {
    // updatelocalLike(id);
    try {
      const res = await ApiCall({
        route: `prayers/Love-answer/${id}`,
        token: token,
        verb: 'patch',
      });
      if (res?.status == '200') {
        updateList(id, res?.response?.data);
      } else {
        console.log('error', res?.response);
      }
    } catch (e) {
      console.log('saga sign up err --- ', e);
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

  const OpenConversation = async (id) => {
    dispatch(setLoader(true));
    try {
      const res = await ApiCall({
        params: { receiver: id },
        token: token,
        route: 'chat/new-chat-room',
        verbb: 'post',
      });

      if (res?.status == '200') {
        dispatch(setLoader(false));

        navigation.navigate('conversation', {
          reciver: res?.response?.data?.receiver,
          reciverId: res?.response?.data?._id,
        });
      } else {
        console.log('error', res?.response);
        dispatch(setLoader(false));
      }
    } catch (e) {
      console.log('chanel create err --- ', e);
    }
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      (Platform.OS = 'ios') ? setKeyboardVisible(e.endCoordinates.height) : null; // or some other action
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(5); // or some other action
    });

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ flex: 0.9 }}>
        <FlatList
          data={prayers}
          showsHorizontalScrollIndicator={false}
          ItemSeparatorComponent={() => (
            <View style={{ padding: 18 }}>
              <Divider />
            </View>
          )}
          ListHeaderComponent={() => <View style={{ padding: 10 }} />}
          ListFooterComponent={() => (
            <View>
              <ActivityIndicator animating={isLoading} size="large" color="#000" />
            </View>
          )}
          onEndReached={() => handleLoadMore()}
          refreshing={refreshing}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() =>
                dispatch(
                  getAllPrayer({
                    pageno: 1,
                    token: token,
                  })
                )
              }
            />
          }
          onEndReachedThreshold={1}
          renderItem={({ item }) => (
            <View>
              {item?.post?.isAnswered == false && item?.isAnswer == false ? (
                <View
                  style={{
                    width: '95%',
                    alignSelf: 'center',
                    padding: 5,
                    paddingHorizontal: getWidth(4),
                    borderRadius: 5,
                  }}
                >
                  <View style={{ flexDirection: 'row', width: '90%' }}>
                    {item?.post?.prayerType == 'anonymous' ? (
                      <View style={{ width: 40, height: 40, borderRadius: 25 }} />
                    ) : (
                      <TouchableOpacity
                        onPress={() =>
                          navigation.navigate('UserProfile', {
                            role: item?.userProfile?.role,
                            id: item?.userProfile?._id,
                          })
                        }
                      >
                        <FastImage
                          style={{ width: 40, height: 40, borderRadius: 25 }}
                          source={{
                            uri: item?.userProfile?.profileImage,
                          }}
                          resizeMode={FastImage.resizeMode.stretch}
                        />
                      </TouchableOpacity>
                    )}
                    <Text
                      style={{
                        fontWeight: '400',
                        alignSelf: 'center',
                        width: '90%',
                        color: '#032F3C',
                        fontFamily: 'Rubik',
                        textAlign: 'left',
                        marginLeft: 7,
                        padding: 5,
                        paddingTop: 0,
                        paddingBottom: 15,
                        lineHeight: 20,
                      }}
                    >
                      {item?.post?.prayer}
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      marginTop: 7,
                      justifyContent: 'space-between',
                      paddingHorizontal: getWidth(5),
                    }}
                  >
                    <PrayerSocials
                      item={item}
                      color={'#126B87'}
                      setPrayers={setPrayers}
                      prayers={prayers}
                    />
                    {item?.post?.prayerType == 'anonymous' ? null : (
                      <TouchableOpacity
                        onPress={() => OpenConversation(item?.userProfile?._id)}
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: '#81979E' }}>Message</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ) : (
                <View>
                  {item?.post?.answers ? (
                    <View
                      style={{
                        width: '95%',
                        alignSelf: 'center',
                        borderWidth: 1,
                        borderColor: '#126B87',
                        padding: 10,
                        borderRadius: 10,
                      }}
                    >
                      <Text
                        style={{
                          position: 'absolute',
                          top: -10,
                          backgroundColor: 'white',
                          width: '34%',
                          color: '#126B87',
                          left: 15,
                          right: 0,
                        }}
                      >
                        {' '}
                        Answered Prayer
                      </Text>
                      <View style={{ flexDirection: 'row', width: '95%' }}>
                        <TouchableOpacity
                          onPress={() =>
                            navigation.navigate('UserProfile', {
                              role: item?.role,
                              id: item?._id,
                            })
                          }
                        >
                          <FastImage
                            style={{ width: 40, height: 40, borderRadius: 25 }}
                            source={{
                              uri: item?.userProfile?.profileImage,
                            }}
                            resizeMode={FastImage.resizeMode.stretch}
                          />
                        </TouchableOpacity>

                        <View style={{ flex: 1, marginTop: 2 }}>
                          {item?.post?.answers ? (
                            <Text
                              style={{
                                fontWeight: '400',

                                width: '100%',

                                color: '#5B7279',
                                fontFamily: 'Rubik',
                                textAlign: 'left',

                                padding: 5,
                                paddingLeft: 10,
                                paddingTop: 0,
                                paddingBottom: 15,
                                lineHeight: 20,
                              }}
                            >
                              {item?.post?.prayer}
                            </Text>
                          ) : (
                            <Text
                              style={{
                                fontWeight: '400',

                                width: '100%',

                                color: '#032F3C',
                                fontFamily: 'Rubik',
                                textAlign: 'left',

                                padding: 5,
                                paddingTop: 0,

                                paddingBottom: 5,
                                lineHeight: 20,
                              }}
                            >
                              {item?.post?.answer}
                            </Text>
                          )}
                          {item?.post?.answers ? (
                            <Divider
                              style={{
                                height: 1,
                                marginVertical: 5,
                              }}
                            />
                          ) : null}
                          <Text
                            style={{
                              fontWeight: '400',
                              alignSelf: 'center',
                              width: '100%',
                              color: '#032F3C',
                              fontFamily: 'Rubik',
                              textAlign: 'left',
                              padding: 5,
                              paddingLeft: 0,
                              paddingBottom: 15,
                              lineHeight: 20,
                            }}
                          >
                            {item?.post?.answers?.answer}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={{
                          flexDirection: 'row',
                          marginTop: 7,
                          justifyContent: 'space-between',
                          paddingHorizontal: getWidth(5),
                        }}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            width: '75%',

                            alignItems: 'center',
                          }}
                        >
                          <TouchableOpacity
                            onPress={() => handelLike(item?.post?._id)}
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'center',
                              marginLeft: 10,
                              alignItems: 'center',
                            }}
                          >
                            <Love />
                            <Text style={{ color: '#126B87', marginLeft: 5 }}>
                              {item?.post?.loveCount}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <View
                      style={{
                        width: '95%',
                        alignSelf: 'center',
                        padding: 5,
                        paddingHorizontal: getWidth(4),
                        borderRadius: 5,
                      }}
                    >
                      <View style={{ flexDirection: 'row', width: '90%' }}>
                        <TouchableOpacity
                          onPress={() =>
                            navigation.navigate('UserProfile', {
                              role: item?.userProfile?.role,
                              id: item?.userProfile?._id,
                            })
                          }
                        >
                          <FastImage
                            style={{ width: 40, height: 40, borderRadius: 25 }}
                            source={{
                              uri: item?.userProfile?.profileImage,
                            }}
                            resizeMode={FastImage.resizeMode.stretch}
                          />
                        </TouchableOpacity>

                        <Text
                          style={{
                            fontWeight: '400',
                            alignSelf: 'center',
                            width: '90%',
                            color: '#032F3C',
                            fontFamily: 'Rubik',
                            textAlign: 'left',
                            marginLeft: 7,
                            padding: 5,
                            paddingTop: 0,
                            paddingBottom: 15,
                            lineHeight: 20,
                          }}
                        >
                          {item?.post?.answer}
                        </Text>
                      </View>

                      <View
                        style={{
                          flexDirection: 'row',
                          marginTop: 7,
                          justifyContent: 'space-between',
                          paddingHorizontal: getWidth(10),
                        }}
                      >
                        <TouchableOpacity
                          onPress={() => handelLike(item?.post?._id)}
                          style={{
                            justifyContent: 'center',

                            alignItems: 'center',
                          }}
                        >
                          <Love2 color={'#126B87'} style={{ color: '#126B87' }} />

                          <Text style={{ color: '#4F6D77' }}>Love</Text>
                        </TouchableOpacity>
                        {/* <PrayerSocials
                          item={item}
                          color={'#126B87'}
                          setPrayers={setPrayers}
                          prayers={prayers}
                        /> */}
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        />
      </View>
      <View
        style={{
          left: 0,
          right: 0,
          bottom: isKeyboardVisible,
          position: 'absolute',

          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,

          elevation: 5,

          backgroundColor: 'white',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <PrayerInputType color={'#70747d'} />
      </View>
    </View>
  );
};
export default WallComponent;
