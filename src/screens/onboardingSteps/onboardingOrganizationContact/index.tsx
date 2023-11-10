import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, TextInput, View } from 'react-native';
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
import { useSelector } from 'react-redux';
import { RootState } from '@/src/Redux/reducers/rootReducer';

type Props = StackScreenProps<OnboardingStackParamList, 'OnboardingOrganizationContact'>;

const OnboardingLocation = ({ navigation, route }: Props) => {
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const [contactName, setContactName] = useState<string>(user?.name ?? '');
  const [contactEmail, setContactEmail] = useState<string>(user?.email ?? '');
  const [contactPhoneNumber, setContactPhoneNumber] = useState<string>('');
  const toast = useToast();

  const inputRefContactName = useRef<TextInput>(null);
  const inputRefContactEmail = useRef<TextInput>(null);
  const inputRefContactPhoneNumber = useRef<TextInput>(null);
  const submit = () => {
    if (contactName != '' && contactEmail != '' && contactPhoneNumber != '') {
      navigation.navigate('OnboardingInterests', {
        ...route.params,

        organizationContactName: contactName,
        organizationContactEmail: contactEmail,
        organizationContactPhoneNumber: contactPhoneNumber,

        profileType: AccountType.organization,
      });
    } else {
      let message = '';

      if (!contactName || contactName == '') {
        message = 'Organization contact name is required';
      } else if (!contactEmail || contactEmail == '') {
        message = 'Organization contact email is required';
      } else if (!contactPhoneNumber || contactPhoneNumber == '') {
        message = 'Organization contact phone number is required';
      }

      toast.show(message, {
        type: 'danger',
      });
    }
  };
  return (
    <OnboardingStepsLayout
      buttonText={'Next'}
      onPress={submit}
      onboardingType={AccountType.organization}
      activeStep={3}
      disabled={contactName == '' || contactEmail == '' || contactPhoneNumber == ''}
    >
      <View style={{ marginVertical: spacing.x48, flex: 1 }}>
        <View style={{ flex: 1, paddingBottom: 40 }}>
          <StyledText style={[Typography.header.h1]}>
            Set your Organization primary Contact
          </StyledText>
          <StyledText
            style={[Typography.subheader.R, { color: Colors.neutral[200], marginTop: spacing.x8 }]}
          >
            Note: This person will serve as the representative for your account and will be
            responsible for all account related communications.
          </StyledText>
        </View>

        <View style={{ flex: 3, paddingBottom: 70 }}>
          <View style={{ flex: 1, paddingBottom: 30 }}>
            <StyledTextInput
              label="Full Name"
              wrapperStyle={{ flex: 1 }}
              value={contactName}
              placeholder="Enter Name"
              onChangeText={(text) => {
                setContactName(text);
              }}
              ref={inputRefContactName}
              returnKeyType={'next'}
              onSubmitEditing={() => inputRefContactEmail.current?.focus()}
            />
          </View>

          <View style={{ flex: 1, paddingBottom: 30 }}>
            <StyledTextInput
              label="Email"
              wrapperStyle={{ flex: 1 }}
              value={contactEmail}
              placeholder="Enter Email"
              onChangeText={(text) => {
                setContactEmail(text);
              }}
              ref={inputRefContactEmail}
              returnKeyType={'next'}
              onSubmitEditing={() => inputRefContactPhoneNumber.current?.focus()}
              keyboardType="email-address"
            />
          </View>

          <View style={{ flex: 1, paddingBottom: 30 }}>
            <StyledTextInput
              label="Phone Number"
              wrapperStyle={{ flex: 1 }}
              value={contactPhoneNumber}
              placeholder="Enter phone number"
              onChangeText={(text) => {
                setContactPhoneNumber(text);
              }}
              ref={inputRefContactPhoneNumber}
              returnKeyType={'done'}
              keyboardType="phone-pad"
            />
          </View>
        </View>
      </View>
    </OnboardingStepsLayout>
  );
};
export default OnboardingLocation;
