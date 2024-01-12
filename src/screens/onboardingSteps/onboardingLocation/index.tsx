import React, { useState } from 'react';
import { View } from 'react-native';
import Button from '@/src/components/Button';
import { OnboardingStackParamList } from '@/src/navigator/types';
import { StackScreenProps } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { AccountType } from '@/utils/types';
import OnboardingStepsLayout from '../../layout/OnboardingStepsLayout';
import { spacing } from '@/src/styles/spacing';
import { StyledText } from '@/src/components/styled/Text';
import { Colors, Typography } from '@/src/styles';
import MapBox, { MapSuggestion } from '@/src/components/MapBox';
import { ArrowDown2 } from 'iconsax-react-native';
import { borderRadius } from '@/src/styles/outlines';
import { header } from '@/src/styles/typography';
import { useTheme } from '@react-navigation/native';

type Props = StackScreenProps<OnboardingStackParamList, 'OnboardingLocation'>;

const OnboardingLocation = ({ navigation, route }: Props) => {
  const { dark, colors } = useTheme();
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
      reasonText={
        <>
          <StyledText style={{ color: dark ? colors.text : Colors.primary.brand }}>
            Your location info helps us to understand the type of content you would be most
            interested in seeing so that we may enhance your One Body experience.
          </StyledText>
          <StyledText> </StyledText>
          <StyledText style={{ color: dark ? colors.text : Colors.primary.brand }}>
            You can decide if you want this info to be Public or Private in your Profile settings.
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
            Where are you Located?
          </StyledText>
          <StyledText
            style={[
              Typography.subheader.R,
              { color: dark ? colors.text : Colors.neutral[300], marginTop: spacing.x8 },
            ]}
          >
            Enter your present City
          </StyledText>
        </View>

        <View style={{ flex: 4, marginTop: spacing.x32 }}>
          <StyledText style={{ marginBottom: 10 }}>Location</StyledText>
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
    </OnboardingStepsLayout>
  );
};
export default OnboardingLocation;
