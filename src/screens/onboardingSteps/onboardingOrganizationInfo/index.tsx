import React, { useRef, useState } from 'react';
import { TextInput, Pressable, View } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useToast } from 'react-native-toast-notifications';
import { useSelector } from 'react-redux';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { ArrowDown2 } from 'iconsax-react-native';
import useMountEffect from '@/src/hooks/useMountEffect';
import { navigateWithinCurrentNavigator } from '@/src/navigator/navigateWithinCurrentNavigator';
import { OnboardingStackParamList } from '@/src/navigator/types';
import { AccountType } from '@/utils/types';
import OnboardingStepsLayout from '../../layout/OnboardingStepsLayout';
import { spacing } from '@/src/styles/spacing';
import StyledText from '@/components/styled/Text';
import { Colors, Typography } from '@/src/styles';
import MapBox from '@/components/MapBox';
import { MapBoxTypes, type MapSuggestion } from '@/components/MapBoxTypes';
import StyledTextInput from '@/components/styled/TextInput';
import Button from '@/components/Button';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { borderRadius } from '@/src/styles/outlines';

type Props = StackScreenProps<OnboardingStackParamList, 'OnboardingOrganizationInfo'>;

function OnboardingOrganizationInfo({ navigation, route }: Props) {
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const toast = useToast();

  // Org info
  const [organizationName, setOrganizationName] = useState<string>(user?.name ?? '');

  // Location
  const [noPhysicalLocation, setNoPhysicalLocation] = useState(false);
  const [locationData, setLocationData] = useState<MapSuggestion | null>(null);
  const [longitude, setLongitude] = useState<number | undefined>();
  const [latitude, setLatitude] = useState<number | undefined>();
  const [countryCode, setCountryCode] = useState<string | undefined>();
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  // Contact
  const [contactName, setContactName] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>(user?.email ?? '');
  const [contactPhoneNumber, setContactPhoneNumber] = useState<string>('');

  const inputRefContactEmail = useRef<TextInput>(null);
  const inputRefContactPhoneNumber = useRef<TextInput>(null);

  useMountEffect(() => {
    const { locale } = Intl.DateTimeFormat().resolvedOptions();
    const match = locale.match(/[-_](\w{2})\b/);
    const region = match?.[1]?.toLowerCase();
    if (region) {
      setCountryCode(region);
    }
  });

  const locationValid = locationData !== null;

  const isDisabled =
    organizationName === '' || !locationValid || contactName === '' || contactEmail === '';

  const submit = () => {
    if (!isDisabled) {
      navigateWithinCurrentNavigator(navigation, 'OnboardingInterests', {
        ...route.params,
        organizationName,
        longitude: longitude ?? 0,
        latitude: latitude ?? 0,
        address: locationData?.place_name ?? '',
        noPhysicalLocation,
        organizationContactName: contactName,
        organizationContactEmail: contactEmail,
        organizationContactPhoneNumber: contactPhoneNumber,
        profileType: AccountType.organization,
      });
    } else {
      let message = '';
      if (!organizationName) {
        message = 'Organization name is required';
      } else if (!locationValid) {
        message = noPhysicalLocation
          ? 'Please select a city and state'
          : 'Organization address is required';
      } else if (!contactName) {
        message = 'Contact name is required';
      } else if (!contactEmail) {
        message = 'Contact email is required';
      }
      toast.show(message, { type: 'danger' });
    }
  };

  return (
    <OnboardingStepsLayout
      buttonText="Next"
      onPress={submit}
      onboardingType={AccountType.organization}
      activeStep={2}
      disabled={isDisabled}
    >
      <View style={{ marginVertical: spacing.x20 }}>
        {/* Header */}
        <View style={{ marginBottom: spacing.x24 }}>
          <StyledText style={[Typography.header.h1, { color: Colors.primary.brand }]}>
            Organization Information
          </StyledText>
          <StyledText
            style={[Typography.subheader.R, { color: Colors.neutral[200], marginTop: spacing.x8 }]}
          >
            Fill in your organization details and primary contact.
          </StyledText>
        </View>

        {/* Organization Name */}
        <View style={{ marginBottom: spacing.x24 }}>
          <StyledTextInput
            label="Organization Name"
            wrapperStyle={{}}
            value={organizationName}
            placeholder="Name"
            onChangeText={(text) => setOrganizationName(text)}
          />
        </View>

        {/* Contact Name */}
        <View style={{ marginBottom: spacing.x24 }}>
          <StyledTextInput
            label="Primary Contact Name"
            wrapperStyle={{}}
            value={contactName}
            placeholder="First and Last Name"
            onChangeText={(text) => setContactName(text)}
            returnKeyType="next"
            onSubmitEditing={() => inputRefContactEmail.current?.focus()}
          />
        </View>

        {/* Email */}
        <View style={{ marginBottom: spacing.x24 }}>
          <StyledTextInput
            label="Email"
            wrapperStyle={{}}
            value={contactEmail}
            placeholder="Enter Email"
            onChangeText={(text) => setContactEmail(text)}
            ref={inputRefContactEmail}
            returnKeyType="next"
            onSubmitEditing={() => inputRefContactPhoneNumber.current?.focus()}
            keyboardType="email-address"
          />
        </View>

        {/* Location */}
        <View style={{ marginBottom: spacing.x8 }}>
          <StyledText style={{ marginBottom: 10 }}>
            {noPhysicalLocation ? 'City & State' : 'Address'}
          </StyledText>
          <Button
            text={
              locationData?.place_name ??
              (noPhysicalLocation ? 'Search city & state' : 'Search address')
            }
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
            onPress={() => setLocationModalVisible(true)}
            rightIcon={
              <ArrowDown2
                onPress={() => setLocationModalVisible(true)}
                style={{ paddingTop: 6 }}
                size={15}
                color={Colors.neutral[300]}
              />
            }
          />
          <MapBox
            location={locationData}
            setLongitude={noPhysicalLocation ? undefined : setLongitude}
            setLatitude={noPhysicalLocation ? undefined : setLatitude}
            setLocation={setLocationData}
            modalVisible={locationModalVisible}
            setModalVisible={setLocationModalVisible}
            types={noPhysicalLocation ? undefined : [MapBoxTypes.address]}
            countries={countryCode ? [countryCode] : undefined}
            modalTitle={
              <StyledText style={{ fontSize: 18, color: Colors.primary.brand }}>
                Search for your{' '}
                <StyledText
                  style={{ fontSize: 18, color: Colors.primary.brand, fontWeight: 'bold' }}
                >
                  {noPhysicalLocation ? 'city' : 'address'}
                </StyledText>
              </StyledText>
            }
          />

          {/* No location checkbox */}
          <Pressable
            style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.x16 }}
            onPress={() => {
              setNoPhysicalLocation((prev) => !prev);
              setLocationData(null);
              setLongitude(undefined);
              setLatitude(undefined);
            }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderWidth: 2,
                borderColor: Colors.primary.brand,
                borderRadius: 4,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: spacing.x8,
                backgroundColor: noPhysicalLocation ? Colors.primary.brand : 'transparent',
              }}
            >
              {noPhysicalLocation && <MaterialCommunityIcons name="check" size={14} color="#FFF" />}
            </View>
            <StyledText style={[Typography.body.x1, { color: Colors.neutral[200] }]}>
              We do not have a physical location
            </StyledText>
          </Pressable>
        </View>

        {/* Phone Number */}
        <View style={{ marginBottom: spacing.x48, marginTop: spacing.x24 }}>
          <StyledTextInput
            label="Phone Number (Optional)"
            wrapperStyle={{}}
            value={contactPhoneNumber}
            placeholder="Enter phone number"
            onChangeText={(text) => setContactPhoneNumber(text)}
            ref={inputRefContactPhoneNumber}
            returnKeyType="done"
            keyboardType="phone-pad"
          />
        </View>
      </View>
    </OnboardingStepsLayout>
  );
}

export default OnboardingOrganizationInfo;
