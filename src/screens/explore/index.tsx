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
import { StackScreenProps } from '@react-navigation/stack';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import Button from '@/components/Button';

import { getUserProfile } from '@/src/redux/actions/UserAction';
import { ApiCall } from '@/src/services/api';
import { styles } from './styles';

import { RootState } from '@/src/redux/reducers/rootReducer';

import { Interest, User } from '@/utils/types';
import {
  ExploreStackParamsList,
  MainBottomStackParamsList,
  MainDrawerParamsList,
} from '@/src/navigator/types';
import StyledTextInput from '@/components/styled/TextInput';
import { Colors, Typography } from '@/src/styles';
import SearchIcon from '@/assets/icons/search.svg';
import { borderRadius } from '@/src/styles/outlines';
import StyledText from '@/components/styled/Text';
import { spacing } from '@/src/styles/spacing';
import { iterestListItem, profileImageList } from '@/src/styles/items';
import { NO_PROFILE_IMAGE } from '@/services/constants';
import CustomModal from '@/src/components/CustomModal';
// type ScreenNavigationProp = NavigationProp<RootStackParamList, 'Home'>;

type Props = CompositeScreenProps<
  StackScreenProps<ExploreStackParamsList, 'Explore'>,
  CompositeScreenProps<
    DrawerScreenProps<MainDrawerParamsList, 'Main'>,
    BottomTabScreenProps<MainBottomStackParamsList, 'ExploreTab'>
  >
>;

enum SortType {
  alpha = 'alpha',
  popular = 'popular',
  geo = 'geo',
  forMe = 'forMe',
}

function Explore({ navigation }: Props) {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // const navigation = useNavigation<ScreenNavigationProp>();

  const offset = useRef(new Animated.Value(0)).current;
  const token = useSelector((state: RootState) => state.auth.userToken);
  const user = useSelector((state: RootState) => state.auth.getProfileData);

  // const [subscribe, setSubscibe] = useState<string[]>(user?.following ?? []);
  const [showInterestModal, setShowInterestModal] = useState<boolean>(false);
  const [showFollowingModal, setShowFollowingModal] = useState<boolean>(false);

  const [following, setFollowing] = useState<User[]>([]);
  const [sort, setSort] = useState<SortType>(SortType.forMe);
  const [searchInterest, setSearchInterest] = useState<Interest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchChannels, setSearchChannels] = useState<User[]>([]);
  const [searchChannelsToFollow, setSearchChannelsToFollow] = useState<User[]>();
  const [searchChannelsToFollowText, setSearchChannelsToFollowText] = useState<string>('');
  const [selectedInterest, setSelectedInterest] = useState<Interest[]>(user?.interests ?? []);

  const [loadingMore, setLoadingMore] = useState<boolean>(true);
  const [isEndOfList, setIsEndOfList] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const getAllUserRequest = async (pageNumber: number) => {
    try {
      const res = await ApiCall({
        token,
        route: `user/get-users-to-subscribe/${pageNumber}?term=${searchChannelsToFollowText}&itemsPerPage=50&sort=${
          sort == SortType.forMe ? '' : sort
        }`,
        verb: 'get',
      });
      setIsRefreshing(false);
      setLoadingMore(false);

      if (res?.status == 200) {
        let userData = [];

        if (pageNumber == 1) {
          userData = res?.response.data ?? [];
          setIsEndOfList(false);
        } else {
          userData = [...users, ...(res?.response.data ?? [])];
          if (res?.response.data.length < 1) {
            setIsEndOfList(true);
          }
        }

        setUsers(userData);
      } else {
        console.log('error', res?.response);
      }
    } catch (e) {
      setIsRefreshing(false);
      console.log('saga get all user err --- ', e);
    }
  };

  useEffect(() => {
    setIsRefreshing(false);
  }, [searchChannelsToFollow]);

  useEffect(() => {
    if (user) {
      const getData = async () => {
        getAllUserRequest(page);
      };
      setLoadingMore(true);
      getData();
    }
  }, [page, user, sort, searchChannelsToFollowText]);

  useEffect(() => {
    getAllUserRequest(1);
    dispatch(getUserProfile({ token }));
    getInterests();
    getFollowing();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      getAllUserRequest(1);
    });

    return unsubscribe;
  }, [navigation]);

  const addInterests = async (newInterest: Interest) => {
    setIsLoading(true);

    try {
      const res = await ApiCall({
        route: 'user/add-interests',
        token,
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
        // dispatch(getuserAll({ token: token }));
        getAllUserRequest(1);
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
        token,
        params: { interests: removeInterest._id },
        verb: 'patch',
      });

      if (res?.status == 200) {
        setSelectedInterest(
          selectedInterest.filter(function (item2) {
            return item2._id !== removeInterest?._id;
          })
        );

        // dispatch(getuserAll({ token: token }));
        getAllUserRequest(1);
      }
      setIsLoading(false);
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  const getInterests = async () => {
    setIsLoading(true);
    try {
      const res = await ApiCall({
        route: 'tags/interest',
        verb: 'get',
        token,
      });

      if (res?.status == 200) {
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
        token,
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
        token,
        verb: 'patch',
      });
      if (res?.status == 200) {
        // dispatch(getuserGet({ token: token, get: 'following', role: user?.role }));
        await getFollowing();
        // dispatch(getuserAll({ token: token }));
        getAllUserRequest(1);
      } else {
        const result = following.filter((item) => item._id != id);
        // setSubscibe(result);
        Toast.show(` ${res?.response}`, Toast.LONG);
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
        token,
        verb: 'patch',
      });
      if (res?.status == 200) {
        // dispatch(getuserGet({ token: token, get: 'following', role: user?.role }));
        await getFollowing();

        // dispatch(getuserAll({ token: token }));
        getAllUserRequest(1);
      } else {
        const result = following.filter((item) => item._id != id);
        // setSubscibe(result);
        Toast.show(` ${res?.response}`, Toast.LONG);
      }
      setIsLoading(false);
    } catch (e) {
      console.log('saga sign up err --- ', e);
    }
  };

  const renderListHeader = () => {
    return (
      <View style={{ paddingHorizontal: spacing.x24 }}>
        <View style={{ flexDirection: 'row' }}>
          <Button
            text="My Connections"
            onPress={() => {
              setShowFollowingModal(true);
            }}
            btnTextStyle={{
              color: Colors.neutral[200],
            }}
            btnStyle={{
              backgroundColor: Colors.neutral[700],
              paddingVertical: spacing.x10,
              flex: 1,
              borderRadius: borderRadius.button,
            }}
            wrapperViewBtnStyle={[styles.mainButtonWrapper, { marginRight: spacing.x10 }]}
          />
          <Button
            text="My Interests"
            onPress={() => {
              setShowInterestModal(true);
            }}
            btnTextStyle={{
              color: Colors.neutral[200],
            }}
            btnStyle={{
              backgroundColor: Colors.neutral[700],
              paddingVertical: spacing.x10,
              flex: 1,
              borderRadius: borderRadius.button,
            }}
            wrapperBtnStyle={{ flex: 1 }}
            wrapperViewBtnStyle={[styles.mainButtonWrapper, { marginLeft: spacing.x10 }]}
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
            value={searchChannelsToFollowText}
            returnKeyType="search"
            placeholder="Search"
            clearButtonMode="always"
            onChangeText={(text) => {
              setSearchChannelsToFollowText(text);
              setPage(1);
            }}
            leftIcon={
              <View style={{ justifyContent: 'center' }}>
                {isLoading ? (
                  <ActivityIndicator
                    animating={isLoading}
                    size="small"
                    color={Colors.neutral[200]}
                    style={{ marginRight: spacing.x10 }}
                  />
                ) : (
                  <SearchIcon
                    style={{ height: 20, width: 20, marginRight: spacing.x10 }}
                    stroke={Colors.neutral[200]}
                  />
                )}
              </View>
            }
          />
        </View>
        <ScrollView
          horizontal
          style={{ marginBottom: spacing.x24, flexDirection: 'row' }}
          showsHorizontalScrollIndicator={false}
        >
          <Button
            btnStyle={[
              styles.filterButton,
              {
                backgroundColor:
                  sort == SortType.forMe ? Colors.primarySapphire.brand : Colors.neutral[800],
              },
            ]}
            btnTextStyle={[{ color: sort == SortType.forMe ? 'white' : Colors.neutral[200] }]}
            text="For Me"
            onPress={() => {
              if (sort != SortType.forMe) setSort(SortType.forMe);
            }}
          />
          <Button
            btnStyle={[
              styles.filterButton,
              {
                backgroundColor:
                  sort == SortType.alpha ? Colors.primarySapphire.brand : Colors.neutral[800],
              },
            ]}
            btnTextStyle={[{ color: sort == SortType.alpha ? 'white' : Colors.neutral[200] }]}
            text="A-Z"
            onPress={() => {
              if (sort != SortType.alpha) setSort(SortType.alpha);
            }}
          />
          <Button
            btnStyle={[
              styles.filterButton,
              {
                backgroundColor:
                  sort == SortType.popular ? Colors.primarySapphire.brand : Colors.neutral[800],
              },
            ]}
            btnTextStyle={[{ color: sort == SortType.popular ? 'white' : Colors.neutral[200] }]}
            text="Popular"
            onPress={() => {
              if (sort != SortType.popular) setSort(SortType.popular);
            }}
          />

          {user?.profile.location?.coordinates ? (
            <Button
              btnStyle={[
                styles.filterButton,
                {
                  backgroundColor:
                    sort == SortType.geo ? Colors.primarySapphire.brand : Colors.neutral[800],
                },
              ]}
              btnTextStyle={[{ color: sort == SortType.geo ? 'white' : Colors.neutral[200] }]}
              text="Nearby"
              onPress={() => {
                if (sort != SortType.geo) setSort(SortType.geo);
              }}
            />
          ) : null}
        </ScrollView>
      </View>
    );
  };
  const { colors } = useTheme();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ backgroundColor: colors.background, flex: 1 }}>
        {renderListHeader()}
        <View style={{ flex: 1 }}>
          <FlatList
            data={users}
            keyExtractor={(item) => {
              return item._id ?? item.id;
            }}
            // contentContainerStyle={{
            //   flex: 1,
            // }}
            style={{ flexGrow: 1 }}
            numColumns={2}
            contentContainerStyle={{ paddingHorizontal: spacing.x24 }}
            scrollIndicatorInsets={{ right: 1 }}
            ListEmptyComponent={() => {
              if (!isRefreshing && !isLoading) {
                return (
                  <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <StyledText style={{ margin: spacing.x16 }}>
                      {searchChannelsToFollowText
                        ? 'No search results'
                        : 'Looks like you haven’t selected any interests'}
                    </StyledText>
                  </View>
                );
              }
              return null;
            }}
            refreshing={isRefreshing}
            refreshControl={
              <RefreshControl
                enabled
                refreshing={isRefreshing}
                onRefresh={() => {
                  setIsRefreshing(true);
                  // setSearchChannelsToFollow([]);
                  // dispatch(getuserAll({ token: token }));
                  getAllUserRequest(1);
                }}
              />
            }
            onEndReached={() => {
              if (!loadingMore && !isRefreshing && !isEndOfList) {
                setPage(page + 1);
              }
            }}
            onEndReachedThreshold={0.5}
            renderItem={({ item }) => {
              return (
                <TouchableOpacity
                  onPress={() => {
                    // navigation.navigate('UserProfile', {
                    //   id: item?.id,
                    // })
                    if (item?.id) {
                      navigation.navigate('Main', {
                        screen: 'SearchTab',
                        params: {
                          screen: 'UserProfile',
                          params: {
                            id: item?.id,
                          },
                        },
                      });
                    }
                  }}
                  style={{ flex: 1, marginBottom: spacing.x24 }}
                >
                  <View
                    style={{
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <FastImage
                      style={[profileImageList, { height: 80, width: 80 }]}
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
                        paddingRight: spacing.x10,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <StyledText
                        style={[
                          Typography.body.x2,
                          {
                            color: Colors.neutral.brand,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {item?.name}
                      </StyledText>
                      {item.profile?.whatIDo || item.profile?.typeOfOrganization ? (
                        <StyledText
                          style={[
                            Typography.body.x1,
                            {
                              color: Colors.neutral[300],
                            },
                          ]}
                        >
                          {item.profile.whatIDo
                            ? item.profile.whatIDo?.name
                            : item.profile.typeOfOrganization
                              ? (item.profile.typeOfOrganization?.organizationType ??
                                item.profile.typeOfOrganization?.name)
                              : ''}
                        </StyledText>
                      ) : null}
                    </View>

                    <Button
                      btnStyle={[
                        {
                          marginTop: spacing.x10,
                          paddingVertical: spacing.x10,
                          paddingHorizontal: spacing.x24,
                          borderRadius: borderRadius.button,
                          backgroundColor: following.some((user) => user._id == item?.id)
                            ? Colors.neutral[800]
                            : Colors.primarySapphire.brand,
                        },
                      ]}
                      btnTextStyle={{
                        color: following.some((user) => user._id == item?.id)
                          ? Colors.primary.brand
                          : 'white',
                      }}
                      text={
                        following.some((user) => user._id == item?.id) ? 'Connected' : 'Connect'
                      }
                      onPress={() => {
                        if (item?.id) {
                          if (following.some((user) => user._id == item?.id)) {
                            handleUnSubscribe(item?.id);
                          } else {
                            handleSubscribe(item?.id);
                          }
                        }
                      }}
                      wrapperViewBtnStyle={{ justifyContent: 'flex-end' }}
                    />
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        <CustomModal
          modalVisible={showInterestModal}
          onclose={() => setShowInterestModal(false)}
          style={{ margin: 0 }}
        >
          <SafeAreaView
            style={{
              backgroundColor: colors.background,

              flex: 1,
            }}
          >
            <View style={{ paddingHorizontal: spacing.x24, justifyContent: 'center' }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignContent: 'center',
                  paddingVertical: spacing.x16,
                }}
              >
                <StyledText style={Typography.fontSize.x4}>My Interests</StyledText>
                <TouchableOpacity
                  style={{ justifyContent: 'center' }}
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
            <View style={{ flex: 30, justifyContent: 'space-around' }}>
              <ScrollView
                contentContainerStyle={{
                  alignSelf: 'center',
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  alignItems: 'center',

                  marginHorizontal: spacing.x10,
                  marginTop: spacing.x32,
                }}
              >
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
                        ? [
                            iterestListItem,
                            {
                              backgroundColor: Colors.primary.brand,
                              borderColor: Colors.primary[300],
                            },
                          ]
                        : { ...iterestListItem, backgroundColor: Colors.neutral[700] }
                    }
                  >
                    <StyledText
                      numberOfLines={1}
                      style={
                        selectedInterest.filter((itemToFilter) => itemToFilter._id == item?._id)
                          .length > 0
                          ? { color: 'white' }
                          : { color: Colors.neutral[400] }
                      }
                    >
                      {item?.name}
                    </StyledText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </SafeAreaView>
        </CustomModal>

        <CustomModal
          modalVisible={showFollowingModal}
          onclose={() => setShowFollowingModal(false)}
          style={{ margin: 0 }}
        >
          <SafeAreaView
            style={{
              backgroundColor: colors.background,

              flex: 1,
            }}
          >
            <View style={{ paddingHorizontal: spacing.x24, flex: 1, justifyContent: 'center' }}>
              <View style={{ justifyContent: 'center' }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignContent: 'center',
                    paddingVertical: spacing.x16,
                  }}
                >
                  <StyledText style={Typography.fontSize.x4}>My Connections</StyledText>
                  <TouchableOpacity
                    style={{ justifyContent: 'center' }}
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
              </View>
              <View style={{ marginBottom: spacing.x24 }}>
                <StyledTextInput
                  clearButtonMode="always"
                  returnKeyType="search"
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
                    <View style={{ justifyContent: 'center' }}>
                      {isLoading ? (
                        <ActivityIndicator
                          animating={isLoading}
                          size="small"
                          color={Colors.neutral[200]}
                          style={{ marginRight: spacing.x10 }}
                        />
                      ) : (
                        <SearchIcon
                          style={{ height: 20, width: 20, marginRight: spacing.x10 }}
                          stroke={Colors.neutral[200]}
                        />
                      )}
                    </View>
                  }
                />
              </View>

              <View style={{ flex: 1, justifyContent: 'space-around' }}>
                <FlatList
                  data={searchChannels}
                  onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: offset } } }], {
                    useNativeDriver: false,
                  })}
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item, index }) => {
                    return (
                      <TouchableOpacity
                        onPress={() => {
                          // navigation.navigate('UserProfile', {
                          //   id: item?.id,
                          // })
                          setShowFollowingModal(false);
                          if (item?.id) {
                            navigation.navigate('Main', {
                              screen: 'SearchTab',
                              params: {
                                screen: 'UserProfile',
                                params: {
                                  id: item?.id,
                                },
                              },
                            });
                          }
                        }}
                        style={{
                          marginBottom: spacing.x24,
                          alignItems: 'center',
                          flexDirection: 'row',
                        }}
                      >
                        <Image
                          style={profileImageList}
                          resizeMode="contain"
                          source={{
                            uri:
                              item?.profileImage && item?.profileImage != ''
                                ? item?.profileImage
                                : NO_PROFILE_IMAGE,
                          }}
                        />

                        <View
                          style={{
                            flex: 2,
                            justifyContent: 'center',

                            paddingHorizontal: spacing.x10,
                          }}
                        >
                          <StyledText numberOfLines={1} style={[Typography.body.x2]}>
                            {item?.name}
                          </StyledText>
                          {item.profile?.whatIDo || item.profile?.typeOfOrganization ? (
                            <StyledText
                              style={[
                                Typography.body.x1,
                                {
                                  color: Colors.neutral[300],
                                },
                              ]}
                            >
                              {item.profile.whatIDo
                                ? item.profile.whatIDo?.name
                                : item.profile.typeOfOrganization
                                  ? (item.profile.typeOfOrganization?.organizationType ??
                                    item.profile.typeOfOrganization?.name)
                                  : ''}
                            </StyledText>
                          ) : null}
                        </View>

                        <Button
                          btnStyle={[
                            {
                              paddingVertical: spacing.x10,
                              paddingHorizontal: spacing.x24,
                            },
                          ]}
                          disabledBtnStyle={{
                            paddingVertical: spacing.x10,
                            paddingHorizontal: spacing.x24,
                            opacity: 0.5,
                          }}
                          btnTextStyle={{ color: Colors.neutral[200] }}
                          disabledBtnTextStyle={{ color: Colors.neutral[300] }}
                          text="Remove"
                          onPress={() => {
                            if (item?.id) {
                              handleUnSubscribe(item?.id);
                            }
                          }}
                          disabled={isLoading}
                          wrapperViewBtnStyle={{
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
        </CustomModal>
      </View>
    </KeyboardAvoidingView>
  );
}
export default Explore;
