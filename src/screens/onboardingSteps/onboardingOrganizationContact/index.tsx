import React, { useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useToast } from 'react-native-toast-notifications';
import { useSelector } from 'react-redux';
import { navigateWithinCurrentNavigator } from '@/src/navigator/navigateWithinCurrentNavigator';
import { OnboardingStackParamList } from '@/src/navigator/types';
import { AccountType } from '@/utils/types';
import OnboardingStepsLayout from '../../layout/OnboardingStepsLayout';
import { spacing } from '@/src/styles/spacing';
import StyledText from '@/components/styled/Text';
import { Colors, Typography } from '@/src/styles';
import StyledTextInput from '@/components/styled/TextInput';
import { RootState } from '@/src/redux/reducers/rootReducer';

type Props = StackScreenProps<OnboardingStackParamList, 'OnboardingOrganizationContact'>;

function OnboardingLocation({ navigation, route }: Props) {
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const [contactName, setContactName] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [contactPhoneNumber, setContactPhoneNumber] = useState<string>('');
  const toast = useToast();

  const inputRefContactName = useRef<TextInput>(null);
  const inputRefContactEmail = useRef<TextInput>(null);
  const inputRefContactPhoneNumber = useRef<TextInput>(null);
  const submit = () => {
    if (contactName !== '' && contactEmail !== '') {
      navigateWithinCurrentNavigator(navigation, 'OnboardingInterests', {
        ...route.params,

        organizationContactName: contactName,
        organizationContactEmail: contactEmail,
        organizationContactPhoneNumber: contactPhoneNumber,

        profileType: AccountType.organization,
      });
    } else {
      let message = '';

      if (!contactName || contactName === '') {
        message = 'Organization contact name is required';
      } else if (!contactEmail || contactEmail === '') {
        message = 'Organization contact email is required';
      }

      toast.show(message, {
        type: 'danger',
      });
    }
  };
  return (
    <OnboardingStepsLayout
      buttonText="Next"
      onPress={submit}
      onboardingType={AccountType.organization}
      activeStep={3}
      disabled={contactName === '' || contactEmail === ''}
    >
      <View style={{ marginVertical: spacing.x20, flex: 1 }}>
        <View style={{ flex: 1, paddingBottom: 40 }}>
          <StyledText style={[Typography.header.h1, { color: Colors.primary.brand }]}>
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
              returnKeyType="next"
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
              returnKeyType="next"
              onSubmitEditing={() => inputRefContactPhoneNumber.current?.focus()}
              keyboardType="email-address"
            />
          </View>

          <View style={{ flex: 1, paddingBottom: 30 }}>
            <StyledTextInput
              label="Phone Number (Optional)"
              wrapperStyle={{ flex: 1 }}
              value={contactPhoneNumber}
              placeholder="Enter phone number"
              onChangeText={(text) => {
                setContactPhoneNumber(text);
              }}
              ref={inputRefContactPhoneNumber}
              returnKeyType="done"
              keyboardType="phone-pad"
            />
          </View>
        </View>
      </View>
    </OnboardingStepsLayout>
  );
}
export default OnboardingLocation;
