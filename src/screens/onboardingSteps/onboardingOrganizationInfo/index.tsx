import React, { useState } from 'react';
import { View } from 'react-native';
import Button from '@/src/components/Button';
import { OnboardingStackParamList } from '@/src/navigator/types';
import { StackScreenProps } from '@react-navigation/stack';
import { AccountType } from '@/utils/types';
import OnboardingStepsLayout from '../../layout/OnboardingStepsLayout';
import { spacing } from '@/src/styles/spacing';
import { StyledText } from '@/src/components/styled/Text';
import { Colors, Typography } from '@/src/styles';
import MapBox, { MapSuggestion } from '@/src/components/MapBox';
import { ArrowDown2 } from 'iconsax-react-native';
import { borderRadius } from '@/src/styles/outlines';
import { StyledTextInput } from '@/src/components/styled/TextInput';
import { useToast } from 'react-native-toast-notifications';

type Props = StackScreenProps<OnboardingStackParamList, 'OnboardingOrganizationInfo'>;

const OnboardingLocation = ({ navigation, route }: Props) => {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [longitude, setLongitude] = useState<number>();
  const [latitude, setLatitude] = useState<number>();
  const [locationData, setLocationData] = useState<MapSuggestion | null>(null);
  const [organizationName, setOrganizationName] = useState<string>('');
  const toast = useToast();

  return (
    <OnboardingStepsLayout
      buttonText={'Next'}
      onPress={() => {
        if (longitude && latitude && locationData && organizationName != '') {
          navigation.navigate('OnboardingOrganizationContact', {
            ...route.params,
            organizationName: organizationName,
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
      <View style={{ marginVertical: spacing.x48, flex: 1 }}>
        <View style={{ flex: 1 }}>
          <StyledText style={[Typography.header.h1]}>
            What is your Organizations Name and Location
          </StyledText>
          <StyledText
            style={[Typography.subheader.R, { color: Colors.neutral[200], marginTop: spacing.x8 }]}
          >
            Fill in name and select organization location
          </StyledText>
        </View>

        <View style={{ flex: 4 }}>
          <View style={{ flex: 1, paddingBottom: 30 }}>
            <StyledTextInput
              label="Organization Name"
              autoFocus
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
                backgroundColor: Colors.neutral[600],
                borderColor: Colors.neutral[700],
                borderRadius: borderRadius.small,
              }}
              wrapperBtnStyle={{
                justifyContent: 'space-between',
                paddingHorizontal: 14,
                paddingVertical: 16,
              }}
              btnTextStyle={{
                color: locationData ? Colors.neutral.brand : Colors.neutral[300],
              }}
              onPress={() => setModalVisible(true)}
              RightIcon={
                <ArrowDown2
                  onPress={() => setModalVisible(true)}
                  style={{ paddingTop: 6 }}
                  size={15}
                  color={Colors.neutral[200]}
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
              modalTitle="Find Location"
            />
          </View>
        </View>
      </View>
    </OnboardingStepsLayout>
  );
};
export default OnboardingLocation;
