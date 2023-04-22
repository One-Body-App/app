import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Text,
  View,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Avatar, Divider, Provider } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import Entypo from 'react-native-vector-icons/Entypo';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { setPrayers, setUserPrayers } from '@/redux/actions/GeneralActions';
import Pray from '@/assets/svg/Pray.svg';
import moment from 'moment';
import { ApiCall } from '@/services/api';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import PrayerSocials from '../PrayerSocials';
import PrayerInputTypeEdit from '../PrayerInputTypeEdit';
import PrayerInputAnswer from '../PrayerInputAnswer';
import Button from '../Button';
import FastImage from 'react-native-fast-image';
import { getAllPrayer, getMyPrayer } from '@/redux/actions/PrayerAction';
import { useNavigation } from '@react-navigation/native';

const PrayersComponent = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const token = useSelector((state) => state.auth.userToken);
  const userPrayers = useSelector((state) => state.prayer.userPrayers);
  const currentPage = useSelector((state) => state.prayer.MyPrayerCurrentPage);
  const totalPage = useSelector((state) => state.prayer.MyPrayerTotalPage);

  const user = useSelector((state) => state.auth.userProfile);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [curentIndex, setCurrentIndex] = useState(null);
  const [isediting, setIsediting] = useState();
  const [isAnswerd, setIsAnswerd] = useState();

  useEffect(() => {
    dispatch(
      getMyPrayer({
        pageno: currentPage,
        token: token,
        userPrayers: userPrayers,
        setIsLoading: setIsLoading,
      })
    );
    // getPrayers(currentPage);
  }, []);

  const handleLoadMore = () => {
    if (currentPage < totalPage) {
      setIsLoading(true);
      dispatch(
        getMyPrayer({
          pageno: currentPage + 1,
          token: token,
          userPrayers: userPrayers,
        })
      );
    }
  };

  const updatePrayer = async (id, params) => {
    try {
      const res = await ApiCall({
        route: `prayers/update-prayer/${id}`,
        verb: 'patch',
        token: token,
        params: params,
      });
      if (res?.status == '200') {
        dispatch(
          getMyPrayer({
            pageno: 1,
            token: token,
            userPrayers: userPrayers,
            setIsLoading: setIsLoading,
          })
        );
        dispatch(
          getAllPrayer({
            pageno: 1,
            token: token,
          })
        );
      } else {
        console.log('error', res?.response);
      }
    } catch (e) {
      console.log('saga error -- ', e.toString());
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <FlatList
        data={userPrayers}
        style={{ paddingBottom: getHeight(60) }}
        contentContainerStyle={{ paddingBottom: getHeight(40) }}
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={() => (
          <View style={{ padding: 18 }}>
            <Divider />
          </View>
        )}
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
              “Do not be anxious about anything, but in every situation, by prayer and petition,
              with thanksgiving, present your requests to God.”
              <Text style={{ fontWeight: 'bold' }}> Philippians 4:6</Text>{' '}
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
                getMyPrayer({
                  pageno: 1,
                  token: token,
                  userPrayers: userPrayers,
                  setIsLoading: setIsLoading,
                })
              )
            }
          />
        }
        onEndReachedThreshold={1}
        renderItem={({ item, index }) => (
          <View
            style={{
              width: '95%',
              alignSelf: 'center',
              padding: 5,
              borderRadius: 5,
            }}
          >
            <View style={{ flexDirection: 'row', width: '90%' }}>
              <TouchableOpacity onPress={() => navigation.navigate('Home', { tabs: 'Profile' })}>
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
                  paddingTop: 0,
                  color: '#032F3C',
                  fontFamily: 'Rubik',
                  textAlign: 'left',
                  marginLeft: 7,
                  padding: 5,
                  paddingBottom: 15,
                  lineHeight: 20,
                }}
              >
                {item?.prayer}
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                marginTop: 10,
                justifyContent: 'space-between',
                paddingHorizontal: getWidth(1),
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
                    alignItems: 'center',
                    padding: 3,
                  }}
                >
                  <Pray style={{ color: '#126B87' }} />
                  <Text style={{ color: '#126B87', marginLeft: 5 }}>
                    {item?.prayingCount} Prayed
                  </Text>
                </View>

                {item?.isAnswered == true ? (
                  <Button
                    text={'Answered'}
                    btnStyle={{
                      backgroundColor: '#EBF3F5',
                      padding: 10,
                      paddingHorizontal: getWidth(4),
                      marginLeft: 7,
                      borderRadius: 5,
                    }}
                    onPress={() => console.log('clicked')}
                    btnTextStyle={{ color: '#5B7279' }}
                  />
                ) : null}
                {item?.isInActive == true ? (
                  <Button
                    text={'Archived'}
                    btnStyle={{
                      backgroundColor: 'red',
                      padding: 10,
                      paddingHorizontal: getWidth(4),
                      marginLeft: 7,
                      borderRadius: 5,
                    }}
                    btnTextStyle={{ color: 'white' }}
                    onPress={() => console.log('clicked')}
                  />
                ) : null}
                <Text style={{ color: '#757575', marginLeft: getWidth(2) }}>
                  {moment(item?.updatedAt).format('MM-YYYY')}
                </Text>
              </View>

              <Menu>
                <MenuTrigger
                  text={
                    <Entypo name={'dots-three-vertical'} size={getFontSize(2.5)} color="#a6a6a6" />
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
                  {item?.isAnswered == false ? (
                    <MenuOption
                      style={{ marginLeft: 10, padding: 10 }}
                      onSelect={() => {
                        setIsAnswerd(true);
                        setIsediting(false);
                        setCurrentIndex(index);
                      }}
                      text="Answer"
                    />
                  ) : null}
                  <MenuOption
                    style={{ marginLeft: 10, padding: 10, paddingTop: 5 }}
                    onSelect={() =>
                      updatePrayer(
                        item?._id,
                        item?.isInActive == true ? { isInActive: false } : { isInActive: true }
                      )
                    }
                    text={item?.isInActive == true ? 'UnArchive' : 'Archive'}
                  />
                  <MenuOption
                    style={{ marginLeft: 10, padding: 10, paddingTop: 5 }}
                    onSelect={() => updatePrayer(item?._id, { isDeleted: true })}
                  >
                    <Text style={{ color: 'red' }}>Delete</Text>
                  </MenuOption>
                </MenuOptions>
              </Menu>
            </View>
            {curentIndex == index && isediting == true ? (
              <PrayerInputTypeEdit
                pray={item?.prayer}
                praytype={item?.prayerType}
                id={item?._id}
                setIsediting={setIsediting}
                setCurrentIndex={setCurrentIndex}
              />
            ) : null}
            {curentIndex == index && isAnswerd == true ? (
              <PrayerInputAnswer
                id={item?._id}
                setIsAnswerd={setIsAnswerd}
                setCurrentIndex={setCurrentIndex}
              />
            ) : null}
          </View>
        )}
      />
    </View>
  );
};
export default PrayersComponent;
