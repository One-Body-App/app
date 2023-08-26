import {
  CompositeScreenProps,
  NavigationProp,
  useNavigation,
  useTheme,
} from '@react-navigation/native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  GestureResponderEvent,
  ScrollView,
  RefreshControl,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { Avatar, TextInput } from 'react-native-paper';
import Toast from 'react-native-simple-toast';
import Icon from 'react-native-vector-icons/Entypo';
import { useDispatch, useSelector } from 'react-redux';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import AnimatedHeader from '@/src/components/AnimatedHeader';
import Button from '@/src/components/Button';
import GeneralStatusBar from '@/src/components/GeneralStatusBar';
import {
  getuserAll,
  getuserGet,
  getUserProfile,
  setUserSubscribe,
} from '@/redux/actions/UserAction';
import { ApiCall } from '@/services/api';
import { styles } from './styles';
import ImageModal from 'react-native-image-modal';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import { GeneralStyle } from '@/src/constants/GeneralStyle';
import { RootStackParamList } from '@/src/Navigation/types';
import Modal from 'react-native-modal';
import { Interest, User } from '@/utils/types';
import { setLoader } from '@/src/Redux/actions/GeneralActions';
import { StackScreenProps } from '@react-navigation/stack';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import {
  ExploreStackParamsList,
  MainBottomStackParamsList,
  MainDrawerParamsList,
} from '@/src/navigator/types';

// type ScreenNavigationProp = NavigationProp<RootStackParamList, 'Home'>;

type Props = CompositeScreenProps<
  StackScreenProps<ExploreStackParamsList, 'Explore'>,
  CompositeScreenProps<
    DrawerScreenProps<MainDrawerParamsList, 'Main'>,
    BottomTabScreenProps<MainBottomStackParamsList, 'ExploreTab'>
  >
>;

const Explore = ({ navigation }: Props) => {
  const dispatch = useDispatch();

  // const navigation = useNavigation<ScreenNavigationProp>();

  const offset = useRef(new Animated.Value(0)).current;
  const token = useSelector((state: RootState) => state.auth.userToken);
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const allusers = useSelector((state: RootState) => state.user.allUser);

  // const [subscribe, setSubscibe] = useState<string[]>(user?.following ?? []);
  const [showInterestModal, setShowInterestModal] = useState<boolean>(false);
  const [showFollowingModal, setShowFollowingModal] = useState<boolean>(false);
  const [interest, setInterest] = useState<Interest[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [searchInterest, setSearchInterest] = useState<Interest[]>([]);
  const [searchChannels, setSearchChannels] = useState<User[]>([]);
  const [searchChannelsToFollow, setSearchChannelsToFollow] = useState<User[]>();
  const [searchChannelsToFollowText, setSearchChannelsToFollowText] = useState<string>('');
  const [selectedInterest, setSelectedInterest] = useState<Interest[]>(user?.interests ?? []);

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setIsRefreshing(false);
  }, [searchChannelsToFollow]);

  useEffect(() => {
    if (searchChannelsToFollowText) {
      setFilteredUsers(allusers, searchChannelsToFollowText);
    } else {
      setSearchChannelsToFollow(allusers);
    }
  }, [allusers]);

  useEffect(() => {
    dispatch(getuserAll({ token: token }));
    dispatch(getUserProfile({ token: token }));
    getInterest();
    getFollowing();
  }, []);

  const addInterests = async (newInterest: Interest) => {
    dispatch(setLoader(true));

    try {
      const res = await ApiCall({
        route: 'user/add-interests',
        token: token,
        params: { interests: newInterest },
        verb: 'patch',
      });

      if (res?.status == 200) {
        selectedInterest.filter((itemToFilter) => itemToFilter._id == newInterest?._id).length > 0
          ? setSelectedInterest(
              selectedInterest.filter(function (item2) {
                return item2._id !== newInterest?._id;
              })
            )
          : setSelectedInterest([...selectedInterest, newInterest]);
        dispatch(getuserAll({ token: token }));
      } else {
        dispatch(setLoader(false));
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  const removeInterests = async (removeInterest: Interest) => {
    dispatch(setLoader(true));

    try {
      const res = await ApiCall({
        route: 'user/remove-interests',
        token: token,
        params: { interests: removeInterest._id },
        verb: 'patch',
      });

      if (res?.status == 200) {
        setSelectedInterest(
          selectedInterest.filter(function (item2) {
            return item2._id !== removeInterest?._id;
          })
        );

        dispatch(getuserAll({ token: token }));
      } else {
        dispatch(setLoader(false));
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  const getInterest = async () => {
    try {
      const res = await ApiCall({
        route: 'tags/interest',
        verb: 'get',
        token: token,
      });

      if (res?.status == 200) {
        setInterest(res?.response);
        setSearchInterest(res?.response);
      } else {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  const getFollowing = async () => {
    try {
      const res = await ApiCall({
        route: 'user/get-following',
        verb: 'get',
        token: token,
      });

      if (res?.status == 200) {
        setFollowing(res?.response?.data);
        setSearchChannels(res?.response?.data);
      } else {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  const handleSubscribe = async (id: string) => {
    try {
      const res = await ApiCall({
        route: `user/subscribe/${id}`,
        token: token,
        verb: 'patch',
      });
      if (res?.status == 200) {
        // dispatch(getuserGet({ token: token, get: 'following', role: user?.role }));
        await getFollowing();
        dispatch(getuserAll({ token: token }));
      } else {
        const result = following.filter((item) => item._id != id);
        // setSubscibe(result);
        Toast.show(' ' + res?.response, Toast.LONG);
      }
    } catch (e) {
      console.log('saga sign up err --- ', e);
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

        dispatch(getuserAll({ token: token }));
      } else {
        const result = following.filter((item) => item._id != id);
        // setSubscibe(result);
        Toast.show(' ' + res?.response, Toast.LONG);
      }
    } catch (e) {
      console.log('saga sign up err --- ', e);
    }
  };

  const setFilteredUsers = (users: User[], text: string) => {
    const newSearchChannels = [];
    for (let i = 0; i < users.length; i++) {
      if (users[i] && users[i].name) {
        if (users[i].name.toLowerCase().indexOf(text.toLowerCase()) > -1) {
          newSearchChannels.push(users[i]);
        }
      }
    }
    setSearchChannelsToFollow(newSearchChannels);
  };

  const renderListHeader = useMemo(() => {
    return (
      <>
        <TextInput
          style={{ ...GeneralStyle.input }}
          mode="outlined"
          value={searchChannelsToFollowText}
          left={
            <TextInput.Icon
              icon={() => (
                <EvilIcons
                  name={'search'}
                  size={getFontSize(4)}
                  color={'#757575'}
                  style={{ marginTop: 5 }}
                />
              )}
            />
          }
          theme={{ roundness: 40 }}
          activeOutlineColor={'#126B87'}
          outlineColor="#126B87"
          label={'Search name or organization'}
          placeholderTextColor={'#032F3C'}
          onChangeText={(text) => {
            setSearchChannelsToFollowText(text);

            setFilteredUsers(allusers, text);
          }}
        />

        <View style={{ flexDirection: 'row' }}>
          <Button
            text={'+Add Interests'}
            onPress={(): void => {
              setShowInterestModal(true);
            }}
            btnTextStyle={{}}
            btnStyle={styles.mainButton}
            wrapperBtnStyle={{ flex: 1 }}
            wrapperViewBtnStyle={styles.mainButtonWrapper}
          />

          <Button
            text={'Connections'}
            onPress={(): void => {
              setShowFollowingModal(true);
            }}
            btnTextStyle={{}}
            btnStyle={styles.mainButton}
            wrapperBtnStyle={{ flex: 1 }}
            wrapperViewBtnStyle={styles.mainButtonWrapper}
          />
        </View>
      </>
    );
  }, [searchChannelsToFollowText]);
  const { colors } = useTheme();

  return (
    <View style={{ backgroundColor: colors.background, flex: 1 }}>
      <GeneralStatusBar backgroundColor={colors.background} hidden={false} translucent={true} />

      <Text style={{ ...styles.title, color: colors.text }}>
        Explore Influencers & Organizations
      </Text>

      <FlatList
        ListHeaderComponent={renderListHeader}
        data={searchChannelsToFollow}
        numColumns={2}
        contentContainerStyle={{
          paddingBottom: 120,
          marginHorizontal: getWidth(3),
        }}
        showsHorizontalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.askinterest}>
            <Text style={{ margin: 15, color: '#7c7c7c' }}>
              {searchChannelsToFollowText
                ? 'No search results'
                : 'Looks like you haven’t selected any interests'}
            </Text>
          </View>
        )}
        refreshing={isRefreshing}
        refreshControl={
          <RefreshControl
            enabled={true}
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              setSearchChannelsToFollow([]);
              dispatch(getuserAll({ token: token }));
            }}
          />
        }
        renderItem={({ item, index }) => {
          return (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('UserProfile', {
                  id: item?._id,
                })
              }
              style={styles.subscribeview}
            >
              <View
                style={{
                  alignItems: 'center',
                  alignContent: 'center',
                  justifyContent: 'center',
                  alignSelf: 'center',
                  padding: 10,

                  borderRadius: 120,
                }}
              >
                <FastImage
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 100,
                    marginBottom: 5,
                    borderColor:
                      item?.profileImage && item?.profileImage != '' ? '#032F3C' : '#09aadb',
                    borderWidth: 1,
                  }}
                  resizeMode="contain"
                  source={{
                    uri:
                      item?.profileImage && item?.profileImage != ''
                        ? item?.profileImage
                        : 'https://cdn.onebodyapp.com/user/no-image.png',
                  }}
                />
              </View>

              <View
                style={{
                  height: getHeight(6),
                  alignItems: 'center',
                }}
              >
                <Text numberOfLines={2} style={styles.subscribetext}>
                  {item?.name}
                </Text>
                <Text
                  style={{
                    color: '#757575',
                    alignSelf: 'center',
                  }}
                >
                  {item.whatIDo?.name}
                </Text>
              </View>

              <Button
                btnStyle={[
                  styles.subscribebutton,
                  following.some((user) => user._id == item?._id)
                    ? { backgroundColor: 'gray' }
                    : null,
                ]}
                btnTextStyle={styles.subtex}
                text={following.some((user) => user._id == item?._id) ? 'Following' : 'Follow'}
                onPress={() => {
                  handleSubscribe(item?._id);
                }}
                wrapperViewBtnStyle={{ flex: 1, justifyContent: 'center' }}
              />
            </TouchableOpacity>
          );
        }}
      />

      <Modal
        backdropOpacity={0.3}
        isVisible={showInterestModal}
        onBackdropPress={() => setShowInterestModal(false)}
        onSwipeComplete={() => setShowInterestModal(false)}
        swipeDirection={['down']}
        style={styles.bottomView}
        propagateSwipe={true}
      >
        <View style={styles.content2}>
          <View style={styles.headLine} />
          <View style={styles.contview}>
            <TextInput
              style={{ ...GeneralStyle.input, width: getWidth(80), marginBottom: 10 }}
              mode="outlined"
              clearButtonMode="always"
              onChangeText={(text) => {
                const newSearchInterest = [];
                for (let i = 0; i < interest.length; i++) {
                  if (interest[i].name.toLowerCase().indexOf(text.toLowerCase()) > -1) {
                    newSearchInterest.push(interest[i]);
                  }
                  setSearchInterest(newSearchInterest);
                }
              }}
              left={
                <TextInput.Icon
                  icon={() => (
                    <EvilIcons
                      name={'search'}
                      size={getFontSize(4)}
                      color={'#5B7279'}
                      style={{ marginTop: 5 }}
                    />
                  )}
                />
              }
              theme={{ roundness: 40 }}
              activeOutlineColor={'#5B7279'}
              outlineColor="#9EA1A2"
              label={'Search Interests'}
              placeholderTextColor={'black'}
            />
            <ScrollView contentContainerStyle={{ ...styles.flatlistview, marginTop: 35 }}>
              {searchInterest.length < 1 ? <Text>No Search Results</Text> : null}
              {searchInterest.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    if (
                      selectedInterest.filter((itemToFilter) => itemToFilter._id == item?._id)
                        .length > 0
                    ) {
                      removeInterests(item);
                    } else {
                      addInterests(item);
                    }
                  }}
                  style={
                    selectedInterest.filter((itemToFilter) => itemToFilter._id == item?._id)
                      .length > 0
                      ? [styles.listItem, { backgroundColor: '#032F3C', borderColor: '#032f3c' }]
                      : styles.listItem
                  }
                >
                  <Text
                    numberOfLines={1}
                    style={
                      selectedInterest.filter((itemToFilter) => itemToFilter._id == item?._id)
                        .length > 0
                        ? { color: 'white' }
                        : { color: '#757575' }
                    }
                  >
                    {item?.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        backdropOpacity={0.3}
        isVisible={showFollowingModal}
        onBackdropPress={() => setShowFollowingModal(false)}
        onSwipeComplete={() => setShowFollowingModal(false)}
        swipeDirection={['down']}
        style={styles.bottomView}
        propagateSwipe={true}
      >
        <View style={styles.content2}>
          <View style={styles.headLine} />
          <View style={styles.contview}>
            <TextInput
              style={{ ...GeneralStyle.input, marginBottom: 10 }}
              mode="outlined"
              onChangeText={(text) => {
                const newSearchChannels = [];
                for (let i = 0; i < following.length; i++) {
                  if (following[i].name.toLowerCase().indexOf(text.toLowerCase()) > -1) {
                    newSearchChannels.push(following[i]);
                  }
                  setSearchChannels(newSearchChannels);
                }
              }}
              left={
                <TextInput.Icon
                  icon={() => (
                    <EvilIcons
                      name={'search'}
                      size={getFontSize(4)}
                      color={'#757575'}
                      style={{ marginTop: 5 }}
                    />
                  )}
                />
              }
              theme={{ roundness: 40 }}
              activeOutlineColor={'#126B87'}
              outlineColor="#126B87"
              label={'Search name'}
              placeholderTextColor={'#032F3C'}
            />
            <FlatList
              data={searchChannels}
              contentContainerStyle={{
                marginBottom: getHeight(120),
                // marginHorizontal: getWidth(1),
              }}
              onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: offset } } }], {
                useNativeDriver: false,
              })}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item, index }) => {
                return (
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('UserProfile', {
                        id: item?._id,
                      })
                    }
                    style={{ ...styles.subscribeview, flexDirection: 'row' }}
                  >
                    <View
                      style={{
                        alignItems: 'center',
                        alignContent: 'center',
                        justifyContent: 'center',
                        alignSelf: 'center',
                        padding: 5,
                        flexDirection: 'row',
                        borderRadius: 120,
                        borderColor:
                          item?.profileImage && item?.profileImage != '' ? '#032F3C' : '#09aadb',
                      }}
                    >
                      <Image
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: 50,
                          marginBottom: 5,
                        }}
                        resizeMode="contain"
                        source={{
                          uri:
                            item?.profileImage && item?.profileImage != ''
                              ? item?.profileImage
                              : 'https://cdn.onebodyapp.com/user/no-image.png',
                        }}
                      />
                    </View>

                    <View
                      style={{
                        flex: 2,
                        justifyContent: 'center',
                        paddingHorizontal: 10,
                      }}
                    >
                      <Text numberOfLines={2} style={[styles.subscribetext, { textAlign: 'left' }]}>
                        {item?.name}
                      </Text>
                    </View>

                    <Button
                      btnStyle={[
                        styles.subscribebutton,
                        {
                          padding: 8,

                          width: getWidth(23),
                        },
                      ]}
                      btnTextStyle={styles.subtex}
                      text="Unfollow"
                      onPress={() => {
                        handleUnSubscribe(item?._id);
                      }}
                      wrapperViewBtnStyle={{ flex: 1, justifyContent: 'center' }}
                    />
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};
export default Explore;
