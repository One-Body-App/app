import { CompositeScreenProps, useTheme } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  FlatList,
  Animated,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import FastImage from 'react-native-fast-image';

import Toast from 'react-native-simple-toast';
import { useDispatch, useSelector } from 'react-redux';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Button from '@/src/components/Button';

import { getuserAll, getUserProfile } from '@/redux/actions/UserAction';
import { ApiCall } from '@/services/api';
import { styles } from './styles';

import { RootState } from '@/src/Redux/reducers/rootReducer';

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
import { StyledTextInput } from '@/src/components/styled/TextInput';
import { Colors } from '@/src/styles';
import SearchIcon from '@/assets/icons/search.svg';
import { borderRadius } from '@/src/styles/outlines';
import { StyledText } from '@/src/components/styled/Text';
import { spacing } from '@/src/styles/spacing';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
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
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // const navigation = useNavigation<ScreenNavigationProp>();

  const offset = useRef(new Animated.Value(0)).current;
  const token = useSelector((state: RootState) => state.auth.userToken);
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const allusers = useSelector((state: RootState) => state.user.allUser);

  // const [subscribe, setSubscibe] = useState<string[]>(user?.following ?? []);
  const [showInterestModal, setShowInterestModal] = useState<boolean>(false);
  const [showFollowingModal, setShowFollowingModal] = useState<boolean>(false);

  const [showMyConnections, setShowMyConnections] = useState<boolean>(false);
  const [interest, setInterest] = useState<Interest[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [filter, setFilter] = useState<'alpha' | 'popular'>('alpha');
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
    let items = searchChannelsToFollowText ? searchChannelsToFollow ?? [] : allusers;

    if (filter == 'alpha') {
      items = items.sort((a, b) => {
        if (a.name.toLowerCase() < b.name.toLowerCase()) {
          return -1;
        }
        if (a.name.toLowerCase() > b.name.toLowerCase()) {
          return 1;
        }

        return 0;
      });
    } else {
      items = items.sort((a, b) => {
        if (a.followerCount && b.followerCount) {
          if (a.followerCount < b.followerCount) {
            return -1;
          }
          if (a.followerCount > b.followerCount) {
            return 1;
          }
        }

        return 0;
      });
    }

    if (searchChannelsToFollowText) {
      setFilteredUsers(items, searchChannelsToFollowText);
    } else {
      setSearchChannelsToFollow(items);
    }

    setIsLoading(false);
  }, [allusers, filter]);

  // useEffect(() => {
  //   let items = allusers;
  //   if (searchChannelsToFollowText) {
  //     items =
  //       searchChannelsToFollow && searchChannelsToFollow?.length > 0 ? searchChannelsToFollow : [];
  //   }
  //   console.log(filter);
  //   if (filter == 'alpha') {
  //     items = allusers.sort((a, b) => {
  //       if (a.name.toLowerCase() < b.name.toLowerCase()) {
  //         return -1;
  //       }
  //       if (a.name.toLowerCase() > b.name.toLowerCase()) {
  //         return 1;
  //       }

  //       return 0;
  //     });
  //   } else {
  //     items = allusers.sort((a, b) => {
  //       if (a.followers < b.followers) {
  //         return -1;
  //       }
  //       if (a.followers > b.followers) {
  //         return 1;
  //       }

  //       return 0;
  //     });
  //   }
  //   if (searchChannelsToFollowText) {
  //     setFilteredUsers(items, searchChannelsToFollowText);
  //   } else {
  //     setSearchChannelsToFollow(items);
  //   }
  // }, [filter]);

  useEffect(() => {
    dispatch(getuserAll({ token: token }));
    dispatch(getUserProfile({ token: token }));
    getInterest();
    getFollowing();
  }, []);

  const addInterests = async (newInterest: Interest) => {
    setIsLoading(true);

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
      }
      setIsLoading(false);
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  const removeInterests = async (removeInterest: Interest) => {
    setIsLoading(true);

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
      }
      setIsLoading(false);
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  const getInterest = async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  const getFollowing = async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  const handleSubscribe = async (id: string) => {
    setIsLoading(true);
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
      setIsLoading(false);
    } catch (e) {
      console.log('saga sign up err --- ', e);
    }
  };

  const handleUnSubscribe = async (id: string) => {
    setIsLoading(true);
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
      setIsLoading(false);
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

  const renderListHeader = () => {
    return (
      <View style={{ flex: 3.5 }}>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <Button
            text={'My Connections'}
            onPress={() => {
              setShowFollowingModal(true);
            }}
            btnTextStyle={{
              color: Colors.neutral[200],
            }}
            btnStyle={{
              backgroundColor: Colors.neutral[700],
              paddingVertical: 12,
              flex: 1,
              borderRadius: borderRadius.button,
            }}
            wrapperBtnStyle={{ flex: 1 }}
            wrapperViewBtnStyle={[styles.mainButtonWrapper, { marginRight: 10 }]}
          />
          <Button
            text={'My Interests'}
            onPress={() => {
              setShowInterestModal(true);
            }}
            btnTextStyle={{
              color: Colors.neutral[200],
            }}
            btnStyle={{
              backgroundColor: Colors.neutral[700],
              paddingVertical: 12,
              flex: 1,
              borderRadius: borderRadius.button,
            }}
            wrapperBtnStyle={{ flex: 1 }}
            wrapperViewBtnStyle={[styles.mainButtonWrapper, { marginLeft: 10 }]}
          />
        </View>

        {/* <TextInput
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
        /> */}

        <View style={{ marginBottom: 20 }}>
          <StyledTextInput
            wrapperStyle={{ height: 45 }}
            value={input}
            autoFocus
            returnKeyType="search"
            placeholder="Search"
            clearButtonMode="always"
            onChangeText={(text) => {
              setInput(text);
            }}
            leftIcon={
              <View>
                {isLoading ? (
                  <ActivityIndicator
                    animating={isLoading}
                    size="small"
                    color={Colors.neutral[200]}
                    style={{ marginRight: 10 }}
                  />
                ) : (
                  <SearchIcon
                    style={{ height: 20, width: 20, marginRight: 10 }}
                    stroke={Colors.neutral[200]}
                  />
                )}
              </View>
            }
          />
        </View>
        <View style={{ marginBottom: 25, flexDirection: 'row' }}>
          <Button
            btnStyle={[
              styles.filterButton,
              {
                backgroundColor:
                  filter == 'alpha' ? Colors.primarySapphire.brand : Colors.neutral[800],
              },
            ]}
            btnTextStyle={[{ color: filter == 'alpha' ? 'white' : Colors.neutral[200] }]}
            text="A-Z"
            onPress={() => {
              if (filter != 'alpha') setFilter('alpha');
            }}
          />
          <Button
            btnStyle={[
              styles.filterButton,
              {
                backgroundColor:
                  filter == 'popular' ? Colors.primarySapphire.brand : Colors.neutral[800],
              },
            ]}
            btnTextStyle={[{ color: filter == 'popular' ? 'white' : Colors.neutral[200] }]}
            text="Popular"
            onPress={() => {
              if (filter != 'popular') setFilter('popular');
            }}
          />
        </View>
      </View>
    );
  };
  const { colors } = useTheme();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={60}
    >
      <View style={{ backgroundColor: colors.background, flex: 1, marginHorizontal: 20 }}>
        {renderListHeader()}
        <View style={{ flex: 8 }}>
          <FlatList
            data={searchChannelsToFollow}
            // contentContainerStyle={{
            //   flex: 1,
            // }}
            ListEmptyComponent={() => (
              <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                <StyledText style={{ margin: 15, color: '#7c7c7c' }}>
                  {searchChannelsToFollowText
                    ? 'No search results'
                    : 'Looks like you haven’t selected any interests'}
                </StyledText>
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
            renderItem={({ item }) => {
              return (
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('UserProfile', {
                      id: item?._id,
                    })
                  }
                  style={{ flex: 1, marginBottom: 20 }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <FastImage
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: borderRadius.max,
                        marginBottom: 5,
                        borderColor: Colors.neutral[800],
                        borderWidth: 1,
                        marginRight: 10,
                      }}
                      resizeMode="contain"
                      source={{
                        uri:
                          item?.profileImage && item?.profileImage != ''
                            ? item?.profileImage
                            : 'https://cdn.onebodyapp.com/user/no-image.png',
                      }}
                    />

                    <View style={{ flex: 2 }}>
                      <StyledText
                        style={{
                          color: Colors.neutral.brand,
                        }}
                        numberOfLines={2}
                      >
                        {item?.name}
                      </StyledText>
                      {item.profile?.whatIDo || item.profile?.typeOfOrganization ? (
                        <StyledText
                          style={{
                            color: Colors.neutral[300],
                          }}
                        >
                          {item.profile.whatIDo
                            ? item.profile.whatIDo?.name
                            : item.profile.typeOfOrganization
                            ? item.profile.typeOfOrganization?.name
                            : ''}
                        </StyledText>
                      ) : null}
                    </View>

                    <Button
                      btnStyle={[
                        {
                          paddingVertical: 10,
                          paddingHorizontal: 20,
                          borderRadius: borderRadius.button,
                          backgroundColor: following.some((user) => user._id == item?._id)
                            ? Colors.neutral[800]
                            : Colors.primarySapphire.brand,
                        },
                      ]}
                      btnTextStyle={{ color: 'white' }}
                      text={
                        following.some((user) => user._id == item?._id) ? 'Connected' : 'Connect'
                      }
                      onPress={() => {
                        handleSubscribe(item?._id);
                      }}
                      wrapperViewBtnStyle={{ flex: 1.25, justifyContent: 'flex-end' }}
                    />
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        <Modal
          backdropOpacity={0.3}
          isVisible={showInterestModal}
          onBackdropPress={() => setShowInterestModal(false)}
          onSwipeComplete={() => setShowInterestModal(false)}
          swipeDirection={['down']}
          propagateSwipe={true}
          style={{ margin: 0 }}
          avoidKeyboard={true}
        >
          <SafeAreaView
            style={{
              backgroundColor: colors.background,

              flex: 1,
            }}
          >
            <View style={{ paddingHorizontal: spacing.x24, flex: 1 }}>
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    flex: 1,
                  }}
                >
                  <StyledText style={{ fontSize: 18 }}>My Interests</StyledText>
                  <TouchableOpacity
                    onPress={() => {
                      // setModalVisible(false);
                      setShowInterestModal(false);
                    }}
                  >
                    <MaterialCommunityIcons
                      name="window-close"
                      size={18}
                      color={Colors.primary.brand}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <View style={{ flex: 30, justifyContent: 'space-around' }}>
              <ScrollView contentContainerStyle={{ ...styles.flatlistview, marginTop: 35 }}>
                {searchInterest.length < 1 ? <StyledText>No Search Results</StyledText> : null}
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
                    <StyledText
                      numberOfLines={1}
                      style={
                        selectedInterest.filter((itemToFilter) => itemToFilter._id == item?._id)
                          .length > 0
                          ? { color: 'white' }
                          : { color: '#757575' }
                      }
                    >
                      {item?.name}
                    </StyledText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </SafeAreaView>
        </Modal>

        <Modal
          backdropOpacity={0.3}
          isVisible={showFollowingModal}
          onBackdropPress={() => setShowFollowingModal(false)}
          onSwipeComplete={() => setShowFollowingModal(false)}
          swipeDirection={['down']}
          style={{ margin: 0 }}
          propagateSwipe={true}
          avoidKeyboard={true}
        >
          <SafeAreaView
            style={{
              backgroundColor: colors.background,

              flex: 1,
            }}
          >
            <View style={{ paddingHorizontal: spacing.x24, flex: 1 }}>
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    flex: 1,
                  }}
                >
                  <StyledText style={{ fontSize: 18 }}>My Connections</StyledText>
                  <TouchableOpacity
                    onPress={() => {
                      // setModalVisible(false);
                      setShowFollowingModal(false);
                    }}
                  >
                    <MaterialCommunityIcons
                      name="window-close"
                      size={18}
                      color={Colors.primary.brand}
                    />
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1, marginBottom: 20 }}>
                  <StyledTextInput
                    autoFocus
                    clearButtonMode="always"
                    wrapperStyle={{ flex: 1 }}
                    returnKeyType={'search'}
                    placeholder="Search"
                    onChangeText={(text) => {
                      const newSearchChannels = [];
                      for (let i = 0; i < following.length; i++) {
                        if (following[i].name.toLowerCase().indexOf(text.toLowerCase()) > -1) {
                          newSearchChannels.push(following[i]);
                        }
                        setSearchChannels(newSearchChannels);
                      }
                    }}
                    leftIcon={
                      <View>
                        {isLoading ? (
                          <ActivityIndicator
                            animating={isLoading}
                            size="small"
                            color={Colors.neutral[200]}
                            style={{ marginRight: 10 }}
                          />
                        ) : (
                          <SearchIcon
                            style={{ height: 20, width: 20, marginRight: 10 }}
                            stroke={Colors.neutral[200]}
                          />
                        )}
                      </View>
                    }
                  />
                </View>
              </View>
              <View style={{ flex: 6, justifyContent: 'space-around' }}>
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
                        style={{ marginBottom: 20, alignItems: 'center', flexDirection: 'row' }}
                      >
                        <Image
                          style={{
                            width: 50,
                            height: 50,
                            borderRadius: borderRadius.max,

                            borderColor: Colors.neutral[800],
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

                        <View
                          style={{
                            flex: 2,
                            // justifyContent: 'center',
                            paddingHorizontal: 10,
                          }}
                        >
                          <StyledText
                            numberOfLines={2}
                            style={[styles.subscribetext, { textAlign: 'left' }]}
                          >
                            {item?.name}
                          </StyledText>
                        </View>

                        <Button
                          btnStyle={[
                            {
                              padding: 8,
                            },
                          ]}
                          disabledBtnStyle={{
                            padding: 8,
                            opacity: 0.5,
                          }}
                          btnTextStyle={{ color: Colors.neutral[200] }}
                          disabledBtnTextStyle={{ color: Colors.neutral[300] }}
                          text="Unfollow"
                          onPress={() => {
                            handleUnSubscribe(item?._id);
                          }}
                          disabled={isLoading}
                          wrapperViewBtnStyle={{
                            flex: 1,
                            justifyContent: 'center',
                            backgroundColor: Colors.neutral[800],
                            borderRadius: borderRadius.button,
                          }}
                        />
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </View>
          </SafeAreaView>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
};
export default Explore;
