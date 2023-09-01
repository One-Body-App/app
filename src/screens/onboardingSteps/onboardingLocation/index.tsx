import React, { useState } from 'react';
import { View } from 'react-native';
import Button from '@/src/components/Button';
import { OnboardingStackParamList } from '@/src/navigator/types';
import { StackScreenProps } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { AccountType } from '@/utils/types';
import OnboardingStepsLayout from '../../layout/OnboardingStepsLayout';
import { spacing } from '@/src/styles/spacing';
import { StyledText } from '@/src/components/styled/Text';
import { Colors, Typography } from '@/src/styles';
import MapBox, { MapSuggestion } from '@/src/components/MapBox';
import { ArrowDown2 } from 'iconsax-react-native';
import { borderRadius } from '@/src/styles/outlines';

type Props = StackScreenProps<OnboardingStackParamList, 'OnboardingLocation'>;

const OnboardingLocation = ({ navigation, route }: Props) => {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [longitude, setLongitude] = useState<number>();
  const [latitude, setLatitude] = useState<number>();
  const [locationData, setLocationData] = useState<MapSuggestion | null>(null);

  return (
    <OnboardingStepsLayout
      buttonText={locationData ? 'Next' : 'Skip'}
      onPress={() => {
        navigation.navigate('OnboardingInterests', {
          ...route.params,
          longitude,
          latitude,
          address: locationData?.place_name,
          profileType: AccountType.individual,
        });
      }}
      onboardingType={AccountType.individual}
      activeStep={4}
    >
      <View style={{ marginVertical: spacing.x48, flex: 1 }}>
        <View style={{ flex: 1 }}>
          <StyledText style={[Typography.header.h1]}>Where are you Located?</StyledText>
          <StyledText
            style={[Typography.subheader.R, { color: Colors.neutral[200], marginTop: spacing.x8 }]}
          >
            Enter your present location
          </StyledText>
        </View>

        <View style={{ flex: 4 }}>
          <StyledText style={{ marginBottom: 10 }}>Location</StyledText>
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
    </OnboardingStepsLayout>
  );
};
export default OnboardingLocation;
