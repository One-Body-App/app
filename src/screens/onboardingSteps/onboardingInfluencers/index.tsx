import React, { useCallback, useState } from 'react';
import { View, Image, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { useToast } from 'react-native-toast-notifications';
import { serialize } from 'object-to-formdata';
import { useTheme } from '@react-navigation/native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import useMountEffect from '@/src/hooks/useMountEffect';
import OnboardingStepsLayout from '../../layout/OnboardingStepsLayout';
import { OnboardingStackParamList } from '@/src/navigator/types';
import { AccountType, User } from '@/utils/types';
import StyledText from '@/components/styled/Text';
import { Colors, Typography } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';

import { RootState } from '@/src/redux/reducers/rootReducer';
import { ApiCall } from '@/services/api';
import { setLoader } from '@/src/redux/actions/GeneralActions';
import StyledTextInput from '@/components/styled/TextInput';
import { fontSize } from '@/src/styles/typography';
import { orgprofileUpdate, profileUpdate } from '@/src/redux/actions/AuthActions';
import SearchIcon from '@/assets/icons/search.svg';
import { profileImageList } from '@/src/styles/items';
import { STANDARD_SECONDARY_LIST_BATCH_CONFIG } from '@/src/navigator/motionPolicy';

type Props = StackScreenProps<OnboardingStackParamList, 'OnboardingInfluencers'>;

function EmptyInfluencersList() {
  return (
    <StyledText style={[Typography.body.x2M, { padding: spacing.x16, textAlign: 'center' }]}>
      No Search Results
    </StyledText>
  );
}

function OnboardingInfluencers({ route }: Props) {
  const { dark } = useTheme();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const isLoading = useSelector((state: RootState) => state.general.loader);

  const [influencers, setInfluencers] = useState<User[]>([]);
  const [selectedInfluencers, setselectedInfluencers] = useState<string[]>([]);

  const toast = useToast();
  const dispatch = useDispatch();
  const [searchText, setSearchText] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [loadingMore, setLoadingMore] = useState<boolean>(true);
  const [isEndOfList, setIsEndOfList] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getInfluencerId = useCallback((item?: User) => {
    const raw = item?._id ?? item?.id ?? item?.userId;
    return raw ? String(raw) : '';
  }, []);

  const getInfluencerKey = useCallback(
    (item: User, index: number) => {
      const stable = getInfluencerId(item) || item?.username || item?.email;
      return `${stable || 'influencer'}-${index}`;
    },
    [getInfluencerId]
  );

  const getInfluencers = useCallback(
    async (pageNumber: number, term: string = searchText) => {
      setLoadingMore(true);
      try {
        const res = await ApiCall({
          route: `user/get-users-to-subscribe/${pageNumber}?term=${term}&itemsPerPage=12`,
          verb: 'get',
          token,
        });

        if (res?.status === 200) {
          const responseData: User[] = Array.isArray(res?.response?.data) ? res.response.data : [];

          if (pageNumber === 1) {
            setInfluencers(responseData);
            setIsEndOfList(false);
          } else {
            if (responseData.length < 1) {
              setIsEndOfList(true);
            }
            setInfluencers((prev) => [...prev, ...responseData]);
          }
        } else if (__DEV__) {
          console.log('error', res?.response);
        }
        setLoadingMore(false);
        setIsRefreshing(false);
      } catch (e: any) {
        if (__DEV__) {
          console.log('saga error -- ', e.toString());
        }
        setLoadingMore(false);
      }
    },
    [searchText, token]
  );

  const addFollowing = async () => {
    try {
      const res = await ApiCall({
        route: 'user/add-following',
        token,
        params: { following: selectedInfluencers },
        verb: 'patch',
      });

      if (res?.status !== 200) {
        // getInfluencers();
        // dispatch(setLoader(false));

        // next();
        // } else {
        dispatch(setLoader(false));
        if (__DEV__) {
          console.log('error', res);
        }
      }
    } catch (e: any) {
      toast.show('There was an error please try again', {
        type: 'danger',
      });
      if (__DEV__) {
        console.log('saga error -- ', e.toString());
      }
    }
  };

  useMountEffect(() => {
    if (token) {
      getInfluencers(1);
    }
  });

  const renderInfluencerItem = useCallback(
    ({ item }: { item: User }) => {
      const influencerId = getInfluencerId(item);
      const isSelected = influencerId ? selectedInfluencers.includes(influencerId) : false;

      return (
        <TouchableOpacity
          activeOpacity={0.6}
          onPress={() => {
            if (!influencerId) return;
            if (selectedInfluencers.includes(influencerId)) {
              setselectedInfluencers(
                selectedInfluencers.filter((organizationId) => {
                  return organizationId !== influencerId;
                })
              );
            } else {
              setselectedInfluencers([...selectedInfluencers, influencerId]);
            }
          }}
          style={{
            width: '33%',
            alignItems: 'center',
          }}
        >
          <Image
            style={
              isSelected
                ? {
                    ...profileImageList,
                    borderWidth: 2.5,
                    borderColor: '#12d2d9',
                  }
                : profileImageList
            }
            resizeMode="contain"
            source={{
              uri:
                item?.profileImage && item?.profileImage !== ''
                  ? item?.profileImage
                  : 'https://cdn.onebodyapp.com/user/no-image.png',
            }}
          />

          <View style={{ marginBottom: spacing.x24 }}>
            <StyledText
              style={{
                textAlign: 'center',
                color: isSelected ? '#12d2d9' : Colors.neutral.brand,
              }}
              numberOfLines={2}
            >
              {item?.name}
            </StyledText>
            <StyledText
              numberOfLines={1}
              style={{
                color: isSelected ? '#12d2d9' : Colors.neutral[300],
                alignSelf: 'center',
                ...fontSize.x1,
              }}
            >
              {item?.profile?.whatIDo?.name ??
                item?.profile?.typeOfOrganization?.organizationType ??
                item?.profile?.typeOfOrganization?.name}
            </StyledText>
          </View>
        </TouchableOpacity>
      );
    },
    [getInfluencerId, selectedInfluencers]
  );

  return (
    <OnboardingStepsLayout
      buttonText={selectedInfluencers.length > 0 ? 'Next' : 'Skip'}
      dontUseScrollView
      onPress={async () => {
        ReactNativeHapticFeedback.trigger('impactMedium', {
          enableVibrateFallback: true,
          ignoreAndroidSystemSettings: false,
        });
        if (selectedInfluencers.length > 0) {
          await addFollowing();
        }

        if (route.params.profileType === AccountType.individual) {
          const data: Record<string, any> = {
            dateOfBirth: route.params.dateOfBirth,
            markProfileCompleted: true,
          };

          if (route.params.longitude && route.params.latitude && route.params.address) {
            data.location = {
              longitude: route.params.longitude,
              latitude: route.params.latitude,
              address: route.params.address,
            };
          }
          dispatch(
            profileUpdate({
              data: serialize(data),
              token,
              accountType: route.params.profileType,
            })
          );
        } else {
          const data: Record<string, any> = {
            typeOfOrganization: route.params.selectedOrganizationType,
            contactEmail: route.params.organizationContactEmail,
            companyName: route.params.organizationName,
            contactName: route.params.organizationContactName,
            contactPhoneNumber: route.params.organizationContactPhoneNumber,
            markProfileCompleted: true,
          };

          if (route.params.longitude && route.params.latitude && route.params.address) {
            data.location = {
              longitude: route.params.longitude,
              latitude: route.params.latitude,
              address: route.params.address,
            };
          }

          dispatch(orgprofileUpdate({ data, token }));
        }
      }}
      onboardingType={route.params.profileType}
      activeStep={route.params.profileType === AccountType.individual ? 4 : 5}
      disabled={isLoading}
      loading={isLoading}
    >
      <View style={{ marginVertical: spacing.x20, flex: 1 }}>
        <View style={{ marginBottom: spacing.x16 }}>
          <StyledText
            style={[
              Typography.header.h1,
              { color: dark ? Colors.primarySapphire[400] : Colors.primary.brand },
            ]}
          >
            Select Ministries and Creators to connect with
          </StyledText>
        </View>

        <View style={{ flex: 6 }}>
          <View>
            <StyledTextInput
              clearButtonMode="always"
              onChangeText={(text) => {
                setSearchText(text);
                setPage(1);
                getInfluencers(1, text);
              }}
              value={searchText}
              leftIcon={
                <View style={{ justifyContent: 'center' }}>
                  <SearchIcon
                    style={{ height: 20, width: 20, marginRight: spacing.x10 }}
                    stroke={Colors.neutral[300]}
                  />
                </View>
                // <MaterialCommunityIcons
                //   name="magnify"
                //   size={20}
                //   style={{ marginRight: 10 }}
                //   color={Colors.neutral[200]}
                // />
              }
              placeholder="Search for Influencers & Organizations"
            />
          </View>
          <View style={{ flex: 10 }}>
            <FlatList
              data={influencers}
              refreshing={isRefreshing}
              refreshControl={
                <RefreshControl
                  enabled
                  refreshing={isRefreshing}
                  onRefresh={() => {
                    setIsRefreshing(true);
                    // setSearchChannelsToFollow([]);
                    // dispatch(getuserAll({ token: token }));
                    getInfluencers(1);
                  }}
                />
              }
              keyExtractor={(item, index) => {
                return getInfluencerKey(item, index);
              }}
              onEndReached={() => {
                if (!loadingMore && !isRefreshing && !isEndOfList) {
                  const nextPage = page + 1;
                  setPage(nextPage);
                  getInfluencers(nextPage);
                }
              }}
              onEndReachedThreshold={0.8}
              contentContainerStyle={{
                marginTop: spacing.x24,
                paddingBottom: spacing.x48,
                // flexDirection: influencers.length < 1 ? 'column' : 'row',
                // flexWrap: influencers.length < 1 ? 'nowrap' : 'wrap',
              }}
              numColumns={3}
              renderItem={renderInfluencerItem}
              ListEmptyComponent={EmptyInfluencersList}
              removeClippedSubviews={STANDARD_SECONDARY_LIST_BATCH_CONFIG.removeClippedSubviews}
              initialNumToRender={STANDARD_SECONDARY_LIST_BATCH_CONFIG.initialNumToRender}
              maxToRenderPerBatch={STANDARD_SECONDARY_LIST_BATCH_CONFIG.maxToRenderPerBatch}
              updateCellsBatchingPeriod={
                STANDARD_SECONDARY_LIST_BATCH_CONFIG.updateCellsBatchingPeriod
              }
              windowSize={STANDARD_SECONDARY_LIST_BATCH_CONFIG.windowSize}
            />
          </View>
        </View>
      </View>
    </OnboardingStepsLayout>
  );
}
export default OnboardingInfluencers;
