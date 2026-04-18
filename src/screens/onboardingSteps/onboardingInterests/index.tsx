import React, { useCallback, useState } from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';

import { StackScreenProps } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { useToast } from 'react-native-toast-notifications';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '@react-navigation/native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import useMountEffect from '@/src/hooks/useMountEffect';
import OnboardingStepsLayout from '../../layout/OnboardingStepsLayout';
import { OnboardingStackParamList } from '@/src/navigator/types';
import { AccountType, Interest } from '@/utils/types';
import StyledText from '@/components/styled/Text';
import { Colors, Typography } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { ApiCall } from '@/services/api';
import { setLoader } from '@/src/redux/actions/GeneralActions';
import StyledTextInput from '@/components/styled/TextInput';
import SearchIcon from '@/assets/icons/search.svg';
import { iterestListItem } from '@/src/styles/items';

type Props = StackScreenProps<OnboardingStackParamList, 'OnboardingInterests'>;

function OnboardingInterests({ navigation, route }: Props) {
  const { dark, colors } = useTheme();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [interest, setInterest] = useState<Interest[]>([]);
  const [searchInterest, setSearchInterest] = useState<Interest[]>([]);
  const [selectedInterest, setSelectedInterest] = useState<string[]>([]);
  const toast = useToast();
  const dispatch = useDispatch();

  const getInterest = useCallback(async () => {
    try {
      const res = await ApiCall({
        route: 'tags/interest',
        verb: 'get',
        token,
      });

      if (res?.status === 200) {
        setInterest(res?.response as Interest[]);
        setSearchInterest(res?.response as Interest[]);
      } else if (__DEV__) {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      if (__DEV__) {
        console.log('saga error -- ', e.toString());
      }
    }
  }, [token]);

  const addInterests = useCallback(async () => {
    dispatch(setLoader(true));

    try {
      const res = await ApiCall({
        route: 'user/add-interests',
        token,
        params: { interests: selectedInterest },
        verb: 'patch',
      });

      if (res?.status === 200) {
        dispatch(setLoader(false));
        navigation.navigate('OnboardingInfluencers', {
          ...route.params,
        });
      } else {
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
  }, [dispatch, navigation, route.params, selectedInterest, toast, token]);

  useMountEffect(() => {
    if (token) {
      getInterest();
    }
  });

  return (
    <OnboardingStepsLayout
      buttonText="Next"
      onPress={() => {
        ReactNativeHapticFeedback.trigger('impactMedium', {
          enableVibrateFallback: true,
          ignoreAndroidSystemSettings: false,
        });
        if (selectedInterest.length >= 3) {
          addInterests();
        } else {
          toast.show('Select at least 3 topics to continue', {
            type: 'danger',
          });
        }
      }}
      onboardingType={route.params.profileType}
      activeStep={3}
      disabled={selectedInterest.length < 3}
    >
      <View style={{ marginVertical: spacing.x20, flex: 1 }}>
        <View style={{ marginBottom: spacing.x16 }}>
          <StyledText
            style={[
              Typography.header.h1,
              {
                color: dark ? Colors.primarySapphire[400] : Colors.primary.brand,
              },
            ]}
          >
            Select a minimum of 3 interests to personalize your feeds
          </StyledText>
        </View>

        <View style={{ flex: 6 }}>
          <View>
            <StyledTextInput
              // style={{ ...GeneralStyle.input, width: getWidth(80) }}
              // mode="outlined"

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
              placeholder="Search for interest"
            />
          </View>
          <View style={{ flex: 10 }}>
            <ScrollView
              contentContainerStyle={{
                marginTop: spacing.x24,
                paddingBottom: spacing.x48,
                flexDirection: searchInterest.length < 1 ? 'column' : 'row',
                flexWrap: searchInterest.length < 1 ? 'nowrap' : 'wrap',
              }}
            >
              {searchInterest.length < 1 ? (
                <StyledText
                  style={[Typography.body.x2M, { padding: spacing.x16, textAlign: 'center' }]}
                >
                  No Search Results
                </StyledText>
              ) : null}
              {searchInterest.map((item) => {
                return (
                  <TouchableOpacity
                    key={item?._id}
                    onPress={() =>
                      selectedInterest.includes(item?._id)
                        ? setSelectedInterest(
                            selectedInterest.filter((item2) => item2 !== item?._id)
                          )
                        : setSelectedInterest([...selectedInterest, item?._id])
                    }
                    style={
                      selectedInterest.includes(item?._id)
                        ? [
                            iterestListItem,
                            {
                              backgroundColor: Colors.primary.brand,
                              borderColor: Colors.primary.brand,
                            },
                          ]
                        : [
                            iterestListItem,
                            {
                              backgroundColor: Colors.neutral[800],
                              borderColor: Colors.neutral[700],
                            },
                          ]
                    }
                  >
                    <StyledText
                      numberOfLines={1}
                      style={
                        selectedInterest.includes(item?._id)
                          ? { color: 'white' }
                          : { color: Colors.neutral[200] }
                      }
                    >
                      {item?.name}
                    </StyledText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </View>
    </OnboardingStepsLayout>
  );
}
export default OnboardingInterests;
