import React, { useEffect, useState } from 'react';
import { Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { styles } from './styles';
import OnboardingStepsLayout from '../../layout/OnboardingStepsLayout';
import { StackScreenProps } from '@react-navigation/stack';
import { OnboardingStackParamList } from '@/src/navigator/types';
import { AccountType, Interest } from '@/utils/types';
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

type Props = StackScreenProps<OnboardingStackParamList, 'OnboardingInterests'>;

const OnboardingInterests = ({ navigation, route }: Props) => {
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [interest, setInterest] = useState<Interest[]>([]);
  const [searchInterest, setSearchInterest] = useState<Interest[]>([]);
  const [selectedInterest, setSelectedInterest] = useState<string[]>([]);
  const toast = useToast();
  const dispatch = useDispatch();

  useEffect(() => {
    if (token) {
      getInterest();
    }
  }, [token]);

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
  const addInterests = async () => {
    dispatch(setLoader(true));

    try {
      const res = await ApiCall({
        route: 'user/add-interests',
        token: token,
        params: { interests: selectedInterest },
        verb: 'patch',
      });

      if (res?.status == 200) {
        navigation.navigate('OnboardingInfluencers', {
          ...route.params,
        });
      } else {
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
      onPress={() => {
        if (selectedInterest.length > 0) {
          addInterests();
        }
      }}
      onboardingType={route.params.profileType}
      activeStep={route.params.profileType == AccountType.individual ? 5 : 4}
      disabled={selectedInterest.length == 0}
    >
      <View style={{ marginVertical: spacing.x48, flex: 1 }}>
        <View style={{ flex: 1 }}>
          <StyledText style={[Typography.header.h1]}>
            Select a minimum of 3 interests to personalize your feeds
          </StyledText>
        </View>

        <View style={{ flex: 6 }}>
          <View style={{ flex: 1 }}>
            <StyledTextInput
              // style={{ ...GeneralStyle.input, width: getWidth(80) }}
              // mode="outlined"
              autoFocus
              wrapperStyle={{ flex: 1 }}
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
                <MaterialCommunityIcons
                  name="magnify"
                  size={20}
                  style={{ marginRight: 10 }}
                  color={Colors.neutral.brand}
                />
              }
              placeholder="Search for interest"
            />
          </View>
          <View style={{ flex: 10 }}>
            <ScrollView
              contentContainerStyle={{
                marginTop: 25,
                paddingBottom: 45,
                flexDirection: searchInterest.length < 1 ? 'column' : 'row',
                flexWrap: searchInterest.length < 1 ? 'nowrap' : 'wrap',
              }}
            >
              {searchInterest.length < 1 ? (
                <StyledText style={[Typography.body.x2M, { padding: 18, textAlign: 'center' }]}>
                  No Search Results
                </StyledText>
              ) : null}
              {searchInterest.map((item, index) => {
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() =>
                      selectedInterest.includes(item?._id)
                        ? setSelectedInterest(
                            selectedInterest.filter(function (item2) {
                              return item2 !== item?._id;
                            })
                          )
                        : setSelectedInterest([...selectedInterest, item?._id])
                    }
                    style={
                      selectedInterest.includes(item?._id)
                        ? [styles.listItem, { backgroundColor: '#032F3C', borderColor: '#032f3c' }]
                        : styles.listItem
                    }
                  >
                    <Text
                      numberOfLines={1}
                      style={
                        selectedInterest.includes(item?._id)
                          ? { color: 'white' }
                          : { color: '#757575' }
                      }
                    >
                      {item?.name}
                    </Text>
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
export default OnboardingInterests;
