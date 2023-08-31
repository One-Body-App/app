import React, { useEffect } from 'react';
import { View, SafeAreaView, Platform, PermissionsAndroid } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { StackScreenProps } from '@react-navigation/stack';
import { OnboardingStackParamList } from '@/src/navigator/types';
import messaging from '@react-native-firebase/messaging';
import Geolocation from '@react-native-community/geolocation';
import FastImage from 'react-native-fast-image';
import { StyledText } from '@/src/components/styled/Text';
import { Colors, Typography } from '@/src/styles';
import Button from '@/src/components/Button';
import { button } from '@/src/styles/buttons';
import { spacing } from '@/src/styles/spacing';

type Props = StackScreenProps<OnboardingStackParamList, 'OnboardingIntro'>;

const OnboardingIntro = ({ navigation }: Props) => {
  const authState = useSelector((state: RootState) => state.auth);

  const requestNotificationPermission = async () => {
    await messaging().requestPermission();
  };

  const requestlocationPermison = async () => {
    try {
      if (Platform.OS === 'ios') {
        Geolocation.requestAuthorization();

        // if (permissions == 'granted') {
        //   Geolocation.getCurrentPosition((info) => {
        //     getcurrentLocation(info.coords?.longitude, info.coords?.latitude);
        //   });
        // }
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );

        // if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        //   //To Check, If Permission is granted
        //   Geolocation.getCurrentPosition((info) => {
        //     getcurrentLocation(info.coords?.longitude, info.coords?.latitude);
        //   });
        // }
      }
    } catch (err) {
      console.warn(err);
    }
  };

  useEffect(() => {
    requestNotificationPermission();
    requestlocationPermison();
  }, []);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        marginHorizontal: spacing.x24,
      }}
    >
      <View
        style={{
          flex: 4,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <FastImage
          resizeMode="contain"
          style={{ width: '60%', height: 'auto', aspectRatio: 1, marginBottom: spacing.x32 }}
          source={require('@/assets/images/onboarding_intro.png')}
        />
        <StyledText style={[Typography.header.h1, { marginVertical: spacing.x8 }]}>
          Let’s Get to Know You
        </StyledText>
        <StyledText style={{ marginHorizontal: spacing.x16, textAlign: 'center' }}>
          This should only take about 2-3 minutes to complete.
        </StyledText>
      </View>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Button
          text="Get Started"
          btnStyle={[
            button.primary,
            {
              flex: 1,
            },
          ]}
          onPress={() => {
            if (authState.getProfileData?.accountType == 'individual') {
              navigation.push('OnboardingChurchType');
            } else {
              navigation.push('OnboardingOrganizationType');
            }
          }}
          btnTextStyle={{ color: '#FFF' }}
        />
      </View>
    </SafeAreaView>
  );
};
export default OnboardingIntro;
