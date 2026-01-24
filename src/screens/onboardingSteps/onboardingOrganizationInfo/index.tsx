import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useToast } from 'react-native-toast-notifications';
import { OnboardingStackParamList } from '@/src/navigator/types';
import { AccountType } from '@/utils/types';
import OnboardingStepsLayout from '../../layout/OnboardingStepsLayout';
import { spacing } from '@/src/styles/spacing';
import StyledText from '@/components/styled/Text';
import { Colors, Typography } from '@/src/styles';
import MapBox, { MapSuggestion } from '@/components/MapBox';
import StyledTextInput from '@/components/styled/TextInput';

type Props = StackScreenProps<OnboardingStackParamList, 'OnboardingOrganizationInfo'>;

function OnboardingLocation({ navigation, route }: Props) {
  const [longitude, setLongitude] = useState<number>();
  const [latitude, setLatitude] = useState<number>();
  const [locationData, setLocationData] = useState<MapSuggestion | null>(null);
  const [organizationName, setOrganizationName] = useState<string>('');
  const [countryCode, setCountryCode] = useState<string | undefined>();
  const toast = useToast();

  useEffect(() => {
    const { locale } = Intl.DateTimeFormat().resolvedOptions();
    const match = locale.match(/[-_](\w{2})\b/);
    const region = match?.[1]?.toLowerCase();

    if (region) {
      setCountryCode(region);
    }
  }, []);

  return (
    <OnboardingStepsLayout
      buttonText="Next"
      onPress={() => {
        if (longitude && latitude && locationData && organizationName !== '') {
          navigation.navigate('OnboardingOrganizationContact', {
            ...route.params,
            organizationName,
            longitude,
            latitude,
            address: locationData?.place_name,
          });
        } else {
          let message = '';

          if (!longitude || !latitude || !locationData) {
            message = 'Organization locations is required';
          } else if (!organizationName || organizationName === '') {
            message = 'Organization name is required';
          }

          toast.show(message, {
            type: 'danger',
          });
        }
      }}
      onboardingType={AccountType.organization}
      activeStep={2}
      disabled={!longitude || !latitude || !locationData || !organizationName}
      dontUseScrollView
      showCustomHeaderOnAndroid
    >
      <View style={{ marginVertical: spacing.x20, flex: 1 }}>
        <View style={{ flex: 1 }}>
          <StyledText style={[Typography.header.h1, { color: Colors.primary.brand }]}>
            What is your Organizations Name and Location
          </StyledText>
          <StyledText
            style={[Typography.subheader.R, { color: Colors.neutral[200], marginTop: spacing.x8 }]}
          >
            Fill in the trade name of your Org and location
          </StyledText>
        </View>

        <View style={{ flex: 4, marginTop: spacing.x8 }}>
          <View style={{ marginBottom: spacing.x32 }}>
            <StyledTextInput
              label="Organization Name"
              wrapperStyle={{}}
              value={organizationName}
              placeholder="Name"
              onChangeText={(text) => {
                setOrganizationName(text);
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <StyledText style={{ marginBottom: 10 }}>City & State</StyledText>
            <MapBox
              location={locationData}
              setLongitude={setLongitude}
              setLatitude={setLatitude}
              setLocation={setLocationData}
              countries={countryCode ? [countryCode] : undefined}
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
      </View>
    </OnboardingStepsLayout>
  );
}
export default OnboardingLocation;
