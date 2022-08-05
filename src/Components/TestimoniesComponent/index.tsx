import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Text,
  View,
  RefreshControl,
  Keyboard,
  ActivityIndicator,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Avatar, Divider } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import Entypo from 'react-native-vector-icons/Entypo';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

import FastImage from 'react-native-fast-image';
import AnswerPrayers from '../AnswerPrayers';
import { getTestimonies } from '@/redux/actions/PraerAction';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import Love from '@/assets/svg/redlove.svg';
import { useNavigation } from '@react-navigation/native';

const TestimoniesComponent = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const token = useSelector((state) => state.auth.userToken);
  const user = useSelector((state) => state.auth.userData);
  const testimonies = useSelector((state) => state.prayer.Testomnies);
  const currentPage = useSelector((state) => state.prayer.TestomniesPrayerCurrentPage);
  const totalPage = useSelector((state) => state.prayer.TestomniesPrayerTotalPage);
  // const [testimonies, setTestimonies] = useState();
  // const [currentPage, setCurrentPage] = useState(1);
  const [isKeyboardVisible, setKeyboardVisible] = useState(0);
  // const [totalPage, setTotalPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    dispatch(
      getTestimonies({
        pageno: currentPage,
        token: token,
        Testimonies: testimonies,
        setIsLoading: setIsLoading,
      })
    );
    // getPrayers(currentPage);
  }, []);

  const handleLoadMore = () => {
    if (currentPage < totalPage) {
      setIsLoading(true);
      dispatch(
        getTestimonies({
          pageno: currentPage + 1,
          token: token,
          Testimonies: testimonies,
          setIsLoading: setIsLoading,
        })
      );
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
      <FlatList
        data={testimonies}
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ padding: 15 }} />}
        ListHeaderComponent={() => (
          <View>
            <Text
              style={{
                width: getWidth(90),
                color: '#757575',
                lineHeight: 20,
                textAlign: 'center',
                alignSelf: 'center',
                marginVertical: 20,
              }}
            >
              “This is the confidence we have in approaching God: that if we ask anything according
              to his will, he hears us. And if we know that he hears us—whatever we ask—we know that
              we have what we asked of him.”{' '}
              <Text style={{ fontWeight: 'bold' }}> 1 John 5:14-15</Text>{' '}
            </Text>
          </View>
        )}
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
                getTestimonies({
                  pageno: 1,
                  token: token,
                })
              )
            }
          />
        }
        onEndReachedThreshold={1}
        renderItem={({ item }) => (
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
              <TouchableOpacity onPress={() => navigation.navigate('Home', { tabs: 'Profile' })}>
                <FastImage
                  style={{ width: 40, height: 40, borderRadius: 25 }}
                  source={{
                    uri: item?.userProfile?.profileImage,
                  }}
                  resizeMode={FastImage.resizeMode.stretch}
                />
              </TouchableOpacity>

              <View style={{ flex: 1, marginTop: 2 }}>
                {item?.prayerData ? (
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
                    {item?.prayerData?.prayer}
                  </Text>
                ) : null}
                {item?.prayerData ? (
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
                    paddingLeft: 7,
                    paddingBottom: 15,
                    lineHeight: 20,
                  }}
                >
                  {item?.answer}
                </Text>
              </View>
            </View>

            <View
              style={{
                flexDirection: 'row',
                marginTop: 7,

                justifyContent: 'space-between',
                paddingHorizontal: getWidth(0),
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  width: '75%',

                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    marginLeft: 10,
                    alignItems: 'center',
                  }}
                >
                  {/* <Text style={{color: '#126B87', marginLeft: 5}}>
                    {item?.prayingCount}0
                  </Text> */}
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    marginLeft: 10,
                    alignItems: 'center',
                  }}
                >
                  <Love />
                  <Text style={{ color: '#126B87', marginLeft: 5 }}>{item?.loveCount}</Text>
                </View>
              </View>
              <Menu>
                <MenuTrigger
                  text={
                    <Entypo name={'dots-three-vertical'} size={getFontSize(3)} color="#757575" />
                  }
                />
                <MenuOptions>
                  {/* <MenuOption
                    onSelect={() => {
                      setIsediting(true);
                      setIsAnswerd(false);
                      setCurrentIndex(index);
                    }}
                    text="Edit"
                  /> */}

                  <MenuOption
                    style={{ marginLeft: 10, padding: 10 }}
                    // onSelect={() =>
                    //   updatePrayer(
                    //     item?._id,
                    //     item?.isInActive == true
                    //       ? {isInActive: false}
                    //       : {isInActive: true},
                    //   )
                    // }
                    text={item?.isInActive == true ? 'UnArchive' : 'Archive'}
                  />
                  <MenuOption
                    style={{ marginLeft: 10, padding: 10, paddingTop: 5 }}
                    // onSelect={() => updatePrayer(item?._id, {isDeleted: true})}
                  >
                    <Text style={{ color: 'red' }}>Delete</Text>
                  </MenuOption>
                </MenuOptions>
              </Menu>
            </View>
          </View>
        )}
      />
      <View
        style={{
          left: 0,
          right: 0,
          bottom: isKeyboardVisible,
          position: 'absolute',
          paddingBottom: getHeight(1.3),
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
        <AnswerPrayers />
      </View>
    </View>
  );
};
export default TestimoniesComponent;
