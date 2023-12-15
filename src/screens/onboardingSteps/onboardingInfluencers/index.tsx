import React, { useEffect, useState } from 'react';
import { View, Image, TouchableOpacity, ScrollView, FlatList, RefreshControl } from 'react-native';
import { styles } from './styles';
import OnboardingStepsLayout from '../../layout/OnboardingStepsLayout';
import { StackScreenProps } from '@react-navigation/stack';
import { OnboardingStackParamList } from '@/src/navigator/types';
import { AccountType, User } from '@/utils/types';
import { StyledText } from '@/src/components/styled/Text';
import { Colors, Typography } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { ApiCall } from '@/src/Services/api';
import { useToast } from 'react-native-toast-notifications';
import { setLoader } from '@/src/Redux/actions/GeneralActions';
import { StyledTextInput } from '@/src/components/styled/TextInput';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { fontSize } from '@/src/styles/typography';
import { orgprofileUpdate, profileUpdate } from '@/src/Redux/actions/AuthActions';
import SearchIcon from '@/assets/icons/search.svg';
import { profileImageList } from '@/src/styles/items';
import { serialize } from 'object-to-formdata';

type Props = StackScreenProps<OnboardingStackParamList, 'OnboardingInfluencers'>;

const OnboardingInfluencers = ({ route }: Props) => {
  const token = useSelector((state: RootState) => state.auth.userToken);

  const [influencers, setInfluencers] = useState<User[]>([]);
  const [selectedInfluencers, setselectedInfluencers] = useState<string[]>([]);

  const toast = useToast();
  const dispatch = useDispatch();
  const [searchText, setSearchText] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [loadingMore, setLoadingMore] = useState<boolean>(true);
  const [isEndOfList, setIsEndOfList] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (token) {
      getInfluencers(page);
      setLoadingMore(true);
    }
  }, [token, searchText, page]);

  const getInfluencers = async (pageNumber: number) => {
    try {
      const res = await ApiCall({
        route: `user/get-users-to-subscribe/${pageNumber}?term=${searchText}&itemsPerPage=12`,
        verb: 'get',
        token: token,
      });

      if (res?.status == 200) {
        let userData = [];

        if (pageNumber == 1) {
          userData = res?.response.data ?? [];
          setIsEndOfList(false);
        } else {
          userData = [...influencers, ...(res?.response.data ?? [])];
          if (res?.response.data.length < 1) {
            setIsEndOfList(true);
          }
        }

        setInfluencers(userData);
      } else {
        console.log('error', res?.response);
      }
      setLoadingMore(false);
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
      setLoadingMore(false);
    }
  };

  const addFollowing = async () => {
    try {
      const res = await ApiCall({
        route: 'user/add-following',
        token: token,
        params: { following: selectedInfluencers },
        verb: 'patch',
      });

      if (res?.status != 200) {
        // getInfluencers();
        // dispatch(setLoader(false));

        // next();
        // } else {
        dispatch(setLoader(false));
        console.log('error', res);
      }
    } catch (e: any) {
      toast.show('There was an error please try again', {
        type: 'danger',
      });
      console.log('saga error -- ', e.toString());
    }
  };

  return (
    <OnboardingStepsLayout
      buttonText={'Done'}
      dontUseScrollView
      onPress={async () => {
        if (selectedInfluencers.length > 0) {
          await addFollowing();

          if (route.params.profileType == AccountType.individual) {
            const data = {
              churchType: route.params.selectedChurchType,
              churchSubType: route.params.selectedChurchSubType,
              oftenChurch: route.params.selectedChurchAttendence,
              dateOfBirth: route.params.dateOfBirth,

              location:
                route.params.longitude && route.params.latitude && route.params.address
                  ? {
                      longitude: route.params.longitude,
                      latitude: route.params.latitude,
                      address: route.params.address,
                    }
                  : null,
            };
            dispatch(
              profileUpdate({ data: serialize(data), token, accountType: route.params.profileType })
            );
          } else {
            const data = {
              typeOfOrganization: route.params.selectedOrganizationType,
              contactEmail: route.params.organizationContactEmail,
              companyName: route.params.organizationName,
              contactName: route.params.organizationContactName,
              contactPhoneNumber: route.params.organizationContactPhoneNumber,
              location: {
                longitude: route.params.longitude,
                latitude: route.params.latitude,
                address: route.params.address,
              },
            };

            dispatch(orgprofileUpdate({ data, token }));
          }
        }
      }}
      onboardingType={route.params.profileType}
      activeStep={route.params.profileType == AccountType.individual ? 6 : 5}
      disabled={selectedInfluencers.length == 0}
    >
      <View style={{ marginVertical: spacing.x48, flex: 1 }}>
        <View style={{ marginBottom: spacing.x16 }}>
          <StyledText style={[Typography.header.h1, { color: Colors.primary.brand }]}>
            Select Influencers & Organizations to connect to
          </StyledText>
        </View>

        <View style={{ flex: 6 }}>
          <View>
            <StyledTextInput
              clearButtonMode="always"
              onChangeText={(text) => {
                setSearchText(text);
                setPage(1);
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
                  enabled={true}
                  refreshing={isRefreshing}
                  onRefresh={() => {
                    setIsRefreshing(true);
                    // setSearchChannelsToFollow([]);
                    // dispatch(getuserAll({ token: token }));
                    getInfluencers(1);
                  }}
                />
              }
              onEndReached={() => {
                if (!loadingMore && !isRefreshing && !isEndOfList) setPage(page + 1);
              }}
              onEndReachedThreshold={0.8}
              contentContainerStyle={{
                marginTop: spacing.x24,
                paddingBottom: spacing.x48,
                // flexDirection: influencers.length < 1 ? 'column' : 'row',
                // flexWrap: influencers.length < 1 ? 'nowrap' : 'wrap',
              }}
              numColumns={3}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.6}
                  onPress={() => {
                    if (item.id) {
                      if (selectedInfluencers.includes(item.id)) {
                        setselectedInfluencers(
                          selectedInfluencers.filter((organizationId) => {
                            return organizationId !== item.id;
                          })
                        );
                      } else {
                        setselectedInfluencers([...selectedInfluencers, item.id]);
                      }
                    }
                  }}
                  style={{
                    width: '33%',

                    alignItems: 'center',
                  }}
                >
                  <Image
                    style={
                      item.id && selectedInfluencers.includes(item.id)
                        ? {
                            ...profileImageList,
                            borderWidth: 2.5,
                            borderColor: Colors.infoFeedback[200],
                          }
                        : profileImageList
                    }
                    resizeMode="contain"
                    source={{
                      uri:
                        item?.profileImage && item?.profileImage != ''
                          ? item?.profileImage
                          : 'https://cdn.onebodyapp.com/user/no-image.png',
                    }}
                  />

                  <View style={{ marginBottom: spacing.x24 }}>
                    <StyledText
                      style={{
                        textAlign: 'center',
                        color:
                          item.id && selectedInfluencers.includes(item.id)
                            ? Colors.infoFeedback[200]
                            : Colors.neutral.brand,
                      }}
                      numberOfLines={2}
                    >
                      {item?.name}
                    </StyledText>
                    <StyledText
                      numberOfLines={1}
                      style={{
                        color:
                          item.id && selectedInfluencers.includes(item.id)
                            ? Colors.infoFeedback[400]
                            : Colors.neutral[300],
                        alignSelf: 'center',
                        ...fontSize.x1,
                      }}
                    >
                      {item?.profile?.whatIDo?.name ?? item?.profile?.typeOfOrganization?.name}
                    </StyledText>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <StyledText
                  style={[Typography.body.x2M, { padding: spacing.x16, textAlign: 'center' }]}
                >
                  No Search Results
                </StyledText>
              )}
            />
          </View>
        </View>
      </View>
    </OnboardingStepsLayout>
  );
};
export default OnboardingInfluencers;
