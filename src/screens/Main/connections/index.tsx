import React, { useEffect, useRef, useState } from 'react';

import {
  View,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from 'react-native';

import Modal from 'react-native-modal';

import Button from '@/src/components/Button';
import { useDispatch, useSelector } from 'react-redux';
import { ApiCall } from '@/src/services/api';
import { setLoader } from '@/src/redux/actions/GeneralActions';
import { getuserAll } from '@/src/redux/actions/UserAction';

import ImageModal from '@dreamwalk-os/react-native-image-modal';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { Interest, User } from '@/utils/types';

import { useTheme } from '@react-navigation/native';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { Colors, Typography } from '@/src/styles';
import { borderRadius } from '@/src/styles/outlines';
import { StyledTextInput } from '@/src/components/styled/TextInput';
import SearchIcon from '@/assets/icons/search.svg';
import { StyledText } from '@/src/components/styled/Text';
import { spacing } from '@/src/styles/spacing';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { iterestListItem, profileImageList } from '@/src/styles/items';
import { MainDrawerParamsList } from '@/src/navigator/types';

type Props = DrawerScreenProps<MainDrawerParamsList, 'Connections'>;

const Connected = ({ navigation }: Props) => {
  const [showInterestModal, setShowInterestModal] = useState<boolean>(false);

  const [interests, setInterests] = useState<Interest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const user = useSelector((state: RootState) => state.auth.getProfileData);

  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const userProfile = useSelector((state: RootState) => state.auth.userProfile);
  const [filter, setFilter] = useState<'connectors' | 'connected'>('connected');

  const [searchChannelsText, setSearchChannelsText] = useState<string>('');

  const [following, setFollowing] = useState<User[]>([]);
  const [searchResultsFollowing, setSearchResultsFollowing] = useState<User[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [searchResultsFollowers, setSearchResultsFollowers] = useState<User[]>([]);

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

      if (res?.status == 200) {
        setFollowing(res?.response?.data);
        setSearchResultsFollowing(res?.response?.data);
      } else {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  const getFollowers = async () => {
    // try {
    //   const res = await ApiCall({
    //     route: 'user/get-following',
    //     verb: 'get',
    //     token: token,
    //   });

    //   if (res?.status == 200) {
    //     setFollowing(res?.response?.data);
    //   } else {
    //     console.log('error', res?.response);
    //   }
    // } catch (e: any) {
    //   console.log('saga error -- ', e.toString());
    // }
    setFollowers([]);
    setSearchResultsFollowers([]);
  };

  const getInterests = async () => {
    setIsLoading(true);
    try {
      const res = await ApiCall({
        route: 'tags/interest',
        verb: 'get',
        token: token,
      });

      if (res?.status == 200) {
        setInterests(res?.response);
      } else {
        console.log('error', res?.response);
      }
      setIsLoading(false);
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

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

  const getFilteredUsers = (users: User[], text: string) => {
    const newSearchChannels = [];
    for (let i = 0; i < users.length; i++) {
      if (users[i] && users[i].name) {
        if (users[i].name.toLowerCase().indexOf(text.toLowerCase()) > -1) {
          newSearchChannels.push(users[i]);
        }
      }
    }
    return newSearchChannels;
  };

  useEffect(() => {
    getFollowing();
    if (userProfile?.isInfluencer) {
      getFollowers();
    }

    getInterests();
  }, [userProfile]);

  useEffect(() => {
    if (searchChannelsText) {
      setSearchResultsFollowing(getFilteredUsers(searchResultsFollowing, searchChannelsText));
    } else {
      setSearchResultsFollowing(following);
    }

    if (userProfile?.isInfluencer) {
      if (searchChannelsText) {
        setSearchResultsFollowers(getFilteredUsers(searchResultsFollowers, searchChannelsText));
      } else {
        setSearchResultsFollowers(following);
      }
    }

    setIsLoading(false);
  }, [searchChannelsText, userProfile]);

  const { dark } = useTheme();

  const { colors } = useTheme();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ backgroundColor: colors.background, flex: 1 }}>
        <View>
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
              paddingVertical: spacing.x10,
              flex: 1,
              borderRadius: borderRadius.button,
            }}
            wrapperViewBtnStyle={{ marginHorizontal: spacing.x24, marginVertical: spacing.x16 }}
          />

          <View style={{ marginBottom: spacing.x24 }}>
            <StyledTextInput
              wrapperStyle={{ marginHorizontal: spacing.x24 }}
              value={searchChannelsText}
              returnKeyType="search"
              placeholder="Search"
              clearButtonMode="always"
              onChangeText={(text) => {
                setSearchChannelsText(text);
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
          <View
            style={{
              flexDirection: 'row',

              // paddingHorizontal: 10,
              marginBottom: spacing.x24,
              backgroundColor: Colors.neutral[700],

              paddingHorizontal: spacing.x48,
              paddingTop: spacing.x16,
              // flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                flex: 1,

                alignItems: 'center',
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  if (filter != 'connectors') setFilter('connectors');
                }}
              >
                <View
                  style={{
                    paddingBottom: spacing.x10,
                    borderBottomColor: Colors.neutral.brand,
                    borderBottomWidth: filter == 'connectors' ? 2 : 0,
                    alignSelf: 'flex-start',
                  }}
                >
                  <StyledText>{searchResultsFollowers.length} Connectors</StyledText>
                </View>
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1, alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => {
                  if (filter != 'connected') setFilter('connected');
                }}
              >
                <View
                  style={{
                    paddingBottom: spacing.x10,
                    borderBottomColor: Colors.neutral.brand,
                    borderBottomWidth: filter == 'connected' ? 2 : 0,
                    alignSelf: 'flex-start',
                  }}
                >
                  <StyledText>{searchResultsFollowing.length} Connected</StyledText>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <FlatList
            data={filter == 'connectors' ? searchResultsFollowers : searchResultsFollowing}
            contentContainerStyle={{ flexGrow: 1 }}
            renderItem={({ item }) => {
              return (
                <TouchableOpacity
                  onPress={() => {
                    navigation.navigate('Main', {
                      screen: 'ExploreTab',
                      params: {
                        screen: 'UserProfile',
                        params: {
                          id: item?._id,
                        },
                      },
                    });
                  }}
                  style={{
                    justifyContent: 'space-between',
                    flexDirection: 'row',
                    alignItems: 'center',

                    flex: 1,
                    padding: spacing.x10,
                    borderRadius: spacing.x10,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <ImageModal
                      resizeMode="contain"
                      style={profileImageList}
                      source={{
                        uri:
                          item?.profileImage && item?.profileImage != ''
                            ? item?.profileImage
                            : 'https://cdn.onebodyapp.com/user/no-image.png',
                      }}
                    />

                    <View style={{ flex: 2.3 }}>
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
                      btnStyle={{
                        paddingVertical: spacing.x10,
                        paddingHorizontal: spacing.x24,
                        borderRadius: borderRadius.button,
                        backgroundColor: Colors.neutral[800],
                      }}
                      btnTextStyle={{ color: Colors.neutral[200] }}
                      text={'Remove'}
                      onPress={() => {
                        handleUnSubscribe(item?._id);
                      }}
                      wrapperViewBtnStyle={{ flex: 1.25, justifyContent: 'flex-end' }}
                    />
                  </View>
                </TouchableOpacity>
              );
            }}
            scrollIndicatorInsets={{ right: 1 }}
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
            <View style={{ paddingHorizontal: spacing.x24, justifyContent: 'center' }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingVertical: spacing.x16,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                  {isLoading ? (
                    <ActivityIndicator
                      animating={isLoading}
                      size="small"
                      color={Colors.neutral[200]}
                      style={{ marginRight: spacing.x10 }}
                    />
                  ) : null}
                  <StyledText style={Typography.fontSize.x4}>My Interests</StyledText>
                </View>
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
                {interests.length < 1 ? <StyledText>No Search Results</StyledText> : null}
                {interests.map((item, index) => (
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
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
};
export default Connected;
