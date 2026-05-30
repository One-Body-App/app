import React, { useState } from 'react';
import { View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '@react-navigation/native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { OnboardingStackParamList } from '@/src/navigator/types';
import { AccountType } from '@/utils/types';
import OnboardingStepsLayout from '../../layout/OnboardingStepsLayout';
import { spacing } from '@/src/styles/spacing';
import StyledText from '@/components/styled/Text';
import { Colors, Typography } from '@/src/styles';
import MapBox from '@/components/MapBox';
import type { MapSuggestion } from '@/components/MapBoxTypes';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingLocation'>;

function OnboardingLocation({ navigation, route }: Props) {
  const { dark, colors } = useTheme();
  const [longitude, setLongitude] = useState<number>();
  const [latitude, setLatitude] = useState<number>();
  const [locationData, setLocationData] = useState<MapSuggestion | null>(null);

  return (
    <OnboardingStepsLayout
      buttonText={locationData ? 'Next' : 'Skip'}
      onPress={() => {
        ReactNativeHapticFeedback.trigger('impactMedium', {
          enableVibrateFallback: true,
          ignoreAndroidSystemSettings: false,
        });
        navigation.navigate('OnboardingInterests', {
          ...route.params,
          longitude,
          latitude,
          address: locationData?.place_name,
          profileType: AccountType.individual,
        });
      }}
      onboardingType={AccountType.individual}
      activeStep={2}
      dontUseScrollView
      reasonText={
        <>
          <StyledText style={{ color: dark ? colors.text : Colors.primary.brand }}>
            We use your city to help you find churches, events, and fellowship opportunities nearby
            in the Connect Portal.
          </StyledText>
          <StyledText> </StyledText>
          <StyledText style={{ color: dark ? colors.text : Colors.primary.brand }}>
            Your privacy is our priority. You can choose to make this info Public or Private anytime
            in your Profile settings.
          </StyledText>
        </>
      }
    >
      <View style={{ marginVertical: spacing.x20, flex: 1 }}>
        <View style={{ flex: 1 }}>
          <StyledText
            style={[
              Typography.header.h1,
              { color: dark ? Colors.primarySapphire[400] : Colors.primary.brand },
            ]}
          >
            Where do you call home?
          </StyledText>
          <StyledText
            style={[
              Typography.subheader.R,
              { color: dark ? colors.text : Colors.neutral[300], marginTop: spacing.x8 },
            ]}
          >
            To connect you with your local community, we just need your city. We do not need your
            exact address.
          </StyledText>
        </View>

        <View style={{ flex: 4, marginTop: spacing.x32 }}>
          <StyledText style={{ marginBottom: 10 }}>City & State</StyledText>
          <MapBox
            location={locationData}
            setLongitude={setLongitude}
            setLatitude={setLatitude}
            setLocation={setLocationData}
            inline
            modalTitle={
              <StyledText style={{ fontSize: 18, color: Colors.primary.brand }}>
                Search for your{' '}
                <StyledText
                  style={{ fontSize: 18, color: Colors.primary.brand, fontWeight: 'bold' }}
                >
                  city
                </StyledText>{' '}
                to get connected
              </StyledText>
            }
          />
        </View>
      </View>
    </OnboardingStepsLayout>
  );
}
export default OnboardingLocation;
