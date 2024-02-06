import React, { useState } from 'react';
import { View } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { ArrowDown2 } from 'iconsax-react-native';
import { useToast } from 'react-native-toast-notifications';
import Button from '@/components/Button';
import { OnboardingStackParamList } from '@/src/navigator/types';
import { AccountType } from '@/utils/types';
import OnboardingStepsLayout from '../../layout/OnboardingStepsLayout';
import { spacing } from '@/src/styles/spacing';
import StyledText from '@/components/styled/Text';
import { Colors, Typography } from '@/src/styles';
import MapBox, { MapSuggestion } from '@/components/MapBox';
import { borderRadius } from '@/src/styles/outlines';
import StyledTextInput from '@/components/styled/TextInput';

type Props = StackScreenProps<OnboardingStackParamList, 'OnboardingOrganizationInfo'>;

function OnboardingLocation({ navigation, route }: Props) {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [longitude, setLongitude] = useState<number>();
  const [latitude, setLatitude] = useState<number>();
  const [locationData, setLocationData] = useState<MapSuggestion | null>(null);
  const [organizationName, setOrganizationName] = useState<string>('');
  const toast = useToast();

  return (
    <OnboardingStepsLayout
      buttonText="Next"
      onPress={() => {
        if (longitude && latitude && locationData && organizationName != '') {
          navigation.navigate('OnboardingOrganizationContact', {
            ...route.params,
            organizationName,
            longitude,
            latitude,
            address: locationData?.place_name,
          });
        } else {
          let message = '';

          if (!longitude || !latitude || locationData) {
            message = 'Organization locations is required';
          } else if (!organizationName || organizationName == '') {
            message = 'Organization name is required';
          }

          toast.show(message, {
            type: 'danger',
          });
        }
      }}
      onboardingType={AccountType.organization}
      activeStep={2}
      disabled={!longitude || !latitude || !organizationName}
    >
      <View style={{ marginVertical: spacing.x20, flex: 1 }}>
        <View style={{ flex: 1 }}>
          <StyledText style={[Typography.header.h1, { color: Colors.primary.brand }]}>
            What is your Organizations Name and Location
          </StyledText>
          <StyledText
            style={[Typography.subheader.R, { color: Colors.neutral[200], marginTop: spacing.x8 }]}
          >
            Fill in name and select organization location
          </StyledText>
        </View>

        <View style={{ flex: 4, marginTop: spacing.x32 }}>
          <View style={{ flex: 1, paddingBottom: 30 }}>
            <StyledTextInput
              label="Organization Name"
              wrapperStyle={{ flex: 1 }}
              value={organizationName}
              placeholder="Name"
              onChangeText={(text) => {
                setOrganizationName(text);
              }}
            />
          </View>
          <View style={{ flex: 4.2 }}>
            <StyledText style={{ marginBottom: 10 }}>Organization Location</StyledText>
            <Button
              text={locationData ? locationData?.place_name : 'Select'}
              btnStyle={{
                flex: 1,
                backgroundColor: Colors.neutral[700],
                borderColor: Colors.neutral[800],
                borderRadius: borderRadius.xs,
              }}
              wrapperBtnStyle={{
                justifyContent: 'space-between',
                paddingHorizontal: 14,
                paddingVertical: 16,
              }}
              btnTextStyle={{
                color: locationData ? Colors.neutral[300] : Colors.neutral[400],
              }}
              onPress={() => setModalVisible(true)}
              rightIcon={
                <ArrowDown2
                  onPress={() => setModalVisible(true)}
                  style={{ paddingTop: 6 }}
                  size={15}
                  color={Colors.neutral[300]}
                />
              }
            />

            <MapBox
              location={locationData}
              setLongitude={setLongitude}
              setLatitude={setLatitude}
              modalVisible={modalVisible}
              setModalVisible={setModalVisible}
              setLocation={setLocationData}
              modalTitle={
                <StyledText style={{ fontSize: 18, color: Colors.primary.brand }}>
                  In what{' '}
                  <StyledText
                    style={{ fontSize: 18, color: Colors.primary.brand, fontWeight: 'bold' }}
                  >
                    city
                  </StyledText>{' '}
                  are you located?
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
