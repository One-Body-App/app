import React, { useEffect, useState } from 'react';
import { View, Image, TouchableOpacity, ScrollView } from 'react-native';
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

type Props = StackScreenProps<OnboardingStackParamList, 'OnboardingInfluencers'>;

const OnboardingInfluencers = ({ route }: Props) => {
  const token = useSelector((state: RootState) => state.auth.userToken);

  const [influencer, setInfluencer] = useState<User[]>([]);
  const [searchInfluencer, setSearchInfluencer] = useState<User[]>([]);
  const [selectedInfluencers, setselectedInfluencers] = useState<string[]>([]);

  const toast = useToast();
  const dispatch = useDispatch();

  useEffect(() => {
    if (token) {
      getInfluencers();
    }
  }, [token]);

  const getInfluencers = async () => {
    try {
      const res = await ApiCall({
        route: 'user/get-users-to-subscribe',
        verb: 'get',
        token: token,
      });

      if (res?.status == 200) {
        setInfluencer(res.response?.data);

        setSearchInfluencer(res.response?.data);
      } else {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
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
      buttonText={'Next'}
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
            dispatch(profileUpdate({ data, token, accountType: route.params.profileType }));
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
        <View style={{ flex: 1 }}>
          <StyledText style={[Typography.header.h1]}>
            Select Influencers & Organizations to connect to
          </StyledText>
        </View>

        <View style={{ flex: 6 }}>
          <View style={{ flex: 1 }}>
            <StyledTextInput
              autoFocus
              wrapperStyle={{ flex: 1 }}
              clearButtonMode="always"
              onChangeText={(text) => {
                const newSearchInfluencer = [];
                for (let i = 0; i < influencer.length; i++) {
                  if (influencer[i].name.toLowerCase().indexOf(text.toLowerCase()) > -1) {
                    newSearchInfluencer.push(influencer[i]);
                  }
                  setSearchInfluencer(newSearchInfluencer);
                }
              }}
              leftIcon={
                <View>
                  <SearchIcon
                    style={{ height: 20, width: 20, marginRight: 10 }}
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
            <ScrollView
              contentContainerStyle={{
                marginTop: 25,
                paddingBottom: 45,
                flexDirection: searchInfluencer.length < 1 ? 'column' : 'row',
                flexWrap: searchInfluencer.length < 1 ? 'nowrap' : 'wrap',
              }}
            >
              {searchInfluencer.length < 1 ? (
                <StyledText style={[Typography.body.x2M, { padding: 18, textAlign: 'center' }]}>
                  No Search Results
                </StyledText>
              ) : null}
              {searchInfluencer?.map((item, index) => {
                return (
                  <TouchableOpacity
                    activeOpacity={0.6}
                    onPress={() => {
                      if (selectedInfluencers.includes(item._id)) {
                        setselectedInfluencers(
                          selectedInfluencers.filter((organizationId) => {
                            return organizationId !== item._id;
                          })
                        );
                      } else {
                        setselectedInfluencers([...selectedInfluencers, item._id]);
                      }
                    }}
                    style={{
                      width: '33%',

                      alignItems: 'center',
                    }}
                    key={index}
                  >
                    <Image
                      style={
                        selectedInfluencers.includes(item._id)
                          ? {
                              ...styles.img,
                              borderWidth: 2.5,
                              borderColor: Colors.infoFeedback[200],
                            }
                          : styles.img
                      }
                      resizeMode="contain"
                      source={{
                        uri:
                          item?.profileImage && item?.profileImage != ''
                            ? item?.profileImage
                            : 'https://cdn.onebodyapp.com/user/no-image.png',
                      }}
                    />

                    <View style={{ marginBottom: 20 }}>
                      <StyledText
                        style={{
                          textAlign: 'center',
                          color: selectedInfluencers.includes(item._id)
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
                          color: selectedInfluencers.includes(item._id)
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
                );
              })}
            </ScrollView>
          </View>
        </View>
      </View>
    </OnboardingStepsLayout>
  );
};
export default OnboardingInfluencers;
