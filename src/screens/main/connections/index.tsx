import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  View,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  StatusBar,
} from 'react-native';

import { useDispatch, useSelector } from 'react-redux';
import ImageModal from '@dreamwalk-os/react-native-image-modal';
import { useFocusEffect, useIsFocused, useTheme } from '@react-navigation/native';
import { DrawerScreenProps } from '@react-navigation/drawer';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import { ApiCall } from '@/src/services/api';
import { setLoader } from '@/src/redux/actions/GeneralActions';
import { getuserAll } from '@/src/redux/actions/UserAction';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { Interest, User } from '@/utils/types';
import useMountEffect from '@/src/hooks/useMountEffect';

import { Typography } from '@/src/styles';
import StyledText from '@/components/styled/Text';
import { spacing } from '@/src/styles/spacing';
import { getProfileRoleLabel } from '@/src/components/profile/profileUtils';

import { iterestListItem, profileImageList } from '@/src/styles/items';
import { MainDrawerParamsList } from '@/src/navigator/types';
import { STANDARD_SECONDARY_LIST_BATCH_CONFIG } from '@/src/navigator/motionPolicy';
import CustomModal from '@/src/components/CustomModal';
import GlassTabBar from '@/src/components/GlassTabBar';

// --- One Body Brand Palette ---
const OBPalette = {
  grays: {
    base: '#3c4b64',
    100: '#e6eaec',
    200: '#cdd5d8',
    300: '#b3c1c5',
    400: '#9aacb1',
    500: '#81979e',
    600: '#68828a',
    700: '#4f6d77',
    800: '#355963',
    900: '#000015',
    black: '#032f3c',
  },
  primary: {
    dark: '#126b87',
    base: '#41899f',
    50: '#71a6b7',
    25: '#a0c4cf',
  },
  info: {
    dark: '#12d2d9',
    base: '#41dbe1',
    50: '#89e9ec',
    25: '#d0f6f7',
  },
};

type Props = DrawerScreenProps<MainDrawerParamsList, 'Connections'>;

function Connected({ navigation }: Props) {
  const [showInterestModal, setShowInterestModal] = useState<boolean>(false);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.userToken);

  const devLog = useCallback((...args: any[]) => {
    if (__DEV__) {
      console.log(...args);
    }
  }, []);

  const [filter, setFilter] = useState<'connectors' | 'connected'>('connected');
  const [searchChannelsText] = useState<string>('');
  const [isListLoading, setIsListLoading] = useState<boolean>(false);

  const [following, setFollowing] = useState<User[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);

  const [selectedInterest, setSelectedInterest] = useState<Interest[]>(user?.interests ?? []);

  const removeInterests = async (newInterest: Interest) => {
    dispatch(setLoader(true));
    try {
      const res = await ApiCall({
        route: 'user/remove-interests',
        token,
        params: {
          interests: selectedInterest.filter((interest) => interest._id !== newInterest._id),
        },
        verb: 'patch',
      });

      if (res?.status === 200) {
        dispatch(setLoader(false));
        const exists = selectedInterest.some((interest) => interest._id === newInterest?._id);
        if (exists) {
          setSelectedInterest((prev) =>
            prev.filter((interest) => interest._id !== newInterest?._id)
          );
        } else {
          setSelectedInterest((prev) => [...prev, newInterest]);
        }
      } else {
        dispatch(setLoader(false));
      }
    } catch (e: any) {
      dispatch(setLoader(false));
      devLog('saga error -- ', e.toString());
    }
  };

  const handleUnSubscribe = (id: string, name?: string) => {
    Alert.alert(
      'Remove Connection',
      `Are you sure you want to remove ${name ?? 'this connection'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await ApiCall({
                route: `user/unsubscribe/${id}`,
                token,
                verb: 'patch',
              });
              if (res?.status === 200) {
                setFollowing((prev) => prev.filter((item) => item._id !== id));
              }
            } catch (e) {
              devLog('unsubscribe error -- ', e);
            }
          },
        },
      ]
    );
  };

  const getFollowing = useCallback(async () => {
    setIsListLoading(true);
    try {
      const res = await ApiCall({
        route: 'user/get-following',
        verb: 'get',
        token,
      });

      if (res?.status === 200) {
        setFollowing(res?.response?.data);
      } else {
        devLog('error', res?.response);
      }
    } catch (e: any) {
      devLog('saga error -- ', e.toString());
    } finally {
      setIsListLoading(false);
    }
  }, [devLog, token]);

  const getFollowers = useCallback(async () => {
    setIsListLoading(true);
    try {
      const res = await ApiCall({
        route: 'user/get-followers',
        verb: 'get',
        token,
      });

      if (res?.status === 200) {
        setFollowers(res?.response?.data);
      } else {
        devLog('error', res?.response);
      }
    } catch (e: any) {
      devLog('saga error -- ', e.toString());
    } finally {
      setIsListLoading(false);
    }
  }, [devLog, token]);

  const getInterests = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await ApiCall({
        route: 'tags/interest',
        verb: 'get',
        token,
      });

      if (res?.status === 200) {
        setInterests(res?.response);
      } else {
        devLog('error', res?.response);
      }
    } catch (e: any) {
      devLog('saga error -- ', e.toString());
    } finally {
      setIsLoading(false);
    }
  }, [devLog, token]);

  const addInterests = async (newInterest: Interest) => {
    setIsLoading(true);
    try {
      const res = await ApiCall({
        route: 'user/add-interests',
        token,
        params: { interests: newInterest },
        verb: 'patch',
      });

      if (res?.status === 200) {
        const exists = selectedInterest.some((interest) => interest._id === newInterest?._id);
        if (exists) {
          setSelectedInterest((prev) =>
            prev.filter((interest) => interest._id !== newInterest?._id)
          );
        } else {
          setSelectedInterest((prev) => [...prev, newInterest]);
        }
        dispatch(getuserAll({ token }));
      }
    } catch (e: any) {
      devLog('saga error -- ', e.toString());
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredUsers = useCallback((users: User[], text: string) => {
    const newSearchChannels = [];
    for (let i = 0; i < users.length; i++) {
      if (users[i] && users[i].name) {
        if (users[i].name.toLowerCase().indexOf(text.toLowerCase()) > -1) {
          newSearchChannels.push(users[i]);
        }
      }
    }
    return newSearchChannels;
  }, []);

  const formatCount = useCallback((value?: number) => {
    const count = value ?? 0;
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}m`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return `${count}`;
  }, []);

  const refreshList = useCallback(async () => {
    await Promise.all([getFollowing(), getFollowers()]);
  }, [getFollowing, getFollowers]);

  useMountEffect(() => {
    getFollowing();
    getFollowers();
    getInterests();
  });

  const searchResultsFollowing = useMemo(
    () => (searchChannelsText ? getFilteredUsers(following, searchChannelsText) : following),
    [following, searchChannelsText, getFilteredUsers]
  );

  const searchResultsFollowers = useMemo(
    () => (searchChannelsText ? getFilteredUsers(followers, searchChannelsText) : followers),
    [followers, searchChannelsText, getFilteredUsers]
  );

  const emptyMessages = {
    connectors: 'No connectors yet.',
    connected: 'You are not connected to anyone yet.',
  };

  const tabLabels = useMemo(
    () => [
      `${formatCount(user?.followerCount)} Connectors`,
      `${formatCount(user?.following?.length)} Connected`,
    ],
    [user?.followerCount, user?.following?.length, formatCount]
  );

  const activeTabIndex = filter === 'connectors' ? 0 : 1;

  const handleTabChange = useCallback((index: number) => {
    setFilter(index === 0 ? 'connectors' : 'connected');
  }, []);

  const { colors, dark } = useTheme();
  const isFocused = useIsFocused();

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') {
        return undefined;
      }

      const statusBarStyle = dark ? 'light-content' : 'dark-content';
      const statusBarBackgroundColor = colors.background;

      const applyStatusBar = () => {
        StatusBar.setBarStyle(statusBarStyle, false);
        StatusBar.setBackgroundColor(statusBarBackgroundColor, false);
        StatusBar.setTranslucent(false);
      };

      applyStatusBar();
      const frame = requestAnimationFrame(applyStatusBar);

      return () => {
        cancelAnimationFrame(frame);
      };
    }, [colors.background, dark])
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex1}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {Platform.OS === 'android' && isFocused ? (
        <StatusBar
          barStyle={dark ? 'light-content' : 'dark-content'}
          backgroundColor={colors.background}
          translucent={false}
        />
      ) : null}
      <View style={[styles.flex1, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.headerContainer, { backgroundColor: colors.card }]}>
          <GlassTabBar
            tabs={tabLabels}
            activeIndex={activeTabIndex}
            onTabChange={handleTabChange}
          />
        </View>

        {/* List Section */}
        <View style={styles.flex1}>
          <FlatList
            data={filter === 'connectors' ? searchResultsFollowers : searchResultsFollowing}
            contentContainerStyle={styles.listContentContainer}
            keyExtractor={(item) => item._id}
            refreshControl={
              <RefreshControl
                refreshing={isListLoading}
                onRefresh={refreshList}
                tintColor={OBPalette.primary.base}
                colors={[OBPalette.primary.base]}
              />
            }
            ListEmptyComponent={
              !isListLoading ? (
                <View style={styles.emptyState}>
                  <StyledText style={styles.emptyStateText}>
                    {searchChannelsText ? 'No matching connections found.' : emptyMessages[filter]}
                  </StyledText>
                </View>
              ) : null
            }
            renderItem={({ item }) => {
              const roleName = getProfileRoleLabel(item);

              return (
                <TouchableOpacity
                  onPress={() => {
                    navigation.navigate('Main', {
                      screen: 'ExploreTab',
                      params: {
                        screen: 'UserProfile',
                        params: { id: item?._id },
                      },
                    });
                  }}
                  style={styles.listItem}
                >
                  <View style={styles.listItemContent}>
                    <View style={styles.imageWrapper}>
                      <ImageModal
                        resizeMode="cover"
                        style={[profileImageList as any, styles.profileImage]}
                        source={{
                          uri:
                            item?.profileImage && item?.profileImage !== ''
                              ? item?.profileImage
                              : 'https://cdn.onebodyapp.com/user/no-image.png',
                        }}
                      />
                    </View>

                    <View style={styles.userInfoWrapper}>
                      <StyledText style={styles.userName} numberOfLines={1}>
                        {item?.name}
                      </StyledText>
                      {roleName ? (
                        <StyledText style={styles.userRole} numberOfLines={1}>
                          {roleName}
                        </StyledText>
                      ) : null}
                    </View>

                    {filter === 'connected' ? (
                      <View style={styles.actionWrapper}>
                        <TouchableOpacity
                          style={styles.removeButtonPill}
                          onPress={() => handleUnSubscribe(item?._id, item?.name)}
                        >
                          <StyledText style={styles.removeButtonText}>Remove</StyledText>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            }}
            scrollIndicatorInsets={{ right: 1 }}
            removeClippedSubviews={STANDARD_SECONDARY_LIST_BATCH_CONFIG.removeClippedSubviews}
            initialNumToRender={STANDARD_SECONDARY_LIST_BATCH_CONFIG.initialNumToRender}
            maxToRenderPerBatch={STANDARD_SECONDARY_LIST_BATCH_CONFIG.maxToRenderPerBatch}
            updateCellsBatchingPeriod={
              STANDARD_SECONDARY_LIST_BATCH_CONFIG.updateCellsBatchingPeriod
            }
            windowSize={STANDARD_SECONDARY_LIST_BATCH_CONFIG.windowSize}
          />
        </View>

        {/* Interests Modal */}
        <CustomModal
          modalVisible={showInterestModal}
          onclose={() => setShowInterestModal(false)}
          style={{ margin: 0 }}
        >
          <SafeAreaView style={[styles.flex1, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitle}>
                {isLoading ? (
                  <ActivityIndicator
                    animating={isLoading}
                    size="small"
                    color={OBPalette.primary.base}
                    style={{ marginRight: spacing.x10 }}
                  />
                ) : null}
                <StyledText
                  style={[
                    Typography.fontSize.x4,
                    { color: OBPalette.grays.black, fontWeight: 'bold' },
                  ]}
                >
                  My Interests
                </StyledText>
              </View>
              <TouchableOpacity onPress={() => setShowInterestModal(false)}>
                <MaterialCommunityIcons
                  name="window-close"
                  size={24}
                  color={OBPalette.grays[500]}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.flex1}>
              <ScrollView contentContainerStyle={styles.interestScrollView}>
                {interests.length < 1 && !isLoading ? (
                  <StyledText style={{ color: OBPalette.grays[400] }}>No Search Results</StyledText>
                ) : null}

                {interests.map((item) => {
                  const isSelected = selectedInterest.some((i) => i._id === item?._id);
                  return (
                    <TouchableOpacity
                      key={item?._id ?? item?.name}
                      onPress={() => {
                        if (isSelected) removeInterests(item);
                        else addInterests(item);
                      }}
                      style={[
                        iterestListItem,
                        styles.interestPill,
                        isSelected ? styles.interestPillActive : styles.interestPillInactive,
                      ]}
                    >
                      <StyledText
                        numberOfLines={1}
                        style={[
                          styles.interestPillText,
                          isSelected
                            ? styles.interestPillTextActive
                            : styles.interestPillTextInactive,
                        ]}
                      >
                        {item?.name}
                      </StyledText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </SafeAreaView>
        </CustomModal>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: OBPalette.grays[100],
  },
  listContentContainer: {
    flexGrow: 1,
    paddingHorizontal: 20, // Brings the list off the edges of the screen
    paddingTop: 8,
  },
  listItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: OBPalette.grays[100], // Softer separation line
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  imageWrapper: {
    marginRight: 14,
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: OBPalette.grays[100],
  },
  userInfoWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 10,
  },
  userName: {
    color: OBPalette.grays.black,
    fontWeight: '600',
    fontSize: 16, // Slightly larger for readability
    marginBottom: 2,
  },
  userRole: {
    color: OBPalette.grays[500],
    fontSize: 13,
  },
  actionWrapper: {
    justifyContent: 'center',
  },
  removeButtonPill: {
    backgroundColor: OBPalette.grays[100],
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  removeButtonText: {
    color: OBPalette.grays[600],
    fontSize: 13,
    fontWeight: '600',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: OBPalette.grays[100],
  },
  modalHeaderTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  interestScrollView: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  interestPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 12,
    borderWidth: 1,
  },
  interestPillActive: {
    backgroundColor: OBPalette.primary.base,
    borderColor: OBPalette.primary.base,
  },
  interestPillInactive: {
    backgroundColor: '#ffffff',
    borderColor: OBPalette.grays[200],
  },
  interestPillText: {
    fontSize: 14,
    fontWeight: '500',
  },
  interestPillTextActive: {
    color: '#ffffff',
  },
  interestPillTextInactive: {
    color: OBPalette.grays[600],
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: OBPalette.grays[400],
    fontSize: 15,
  },
});

export default Connected;
