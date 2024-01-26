import React, { useRef, useState } from 'react';
import { View, Platform } from 'react-native';

import { StackScreenProps } from '@react-navigation/stack';
import DatePicker from 'react-native-date-picker';
import { format, parse } from 'date-fns';
import { Calendar } from 'iconsax-react-native';
import { useToast } from 'react-native-toast-notifications';
import { useTheme } from '@react-navigation/native';
import OnboardingStepsLayout from '../../layout/OnboardingStepsLayout';
import { OnboardingStackParamList } from '@/src/navigator/types';
import { AccountType } from '@/utils/types';
import StyledText from '@/components/styled/Text';
import { spacing } from '@/src/styles/spacing';
import { Colors, Typography } from '@/src/styles';
import Button from '@/components/Button';
import { borderRadius } from '@/src/styles/outlines';
import { header } from '@/src/styles/typography';

type Props = StackScreenProps<OnboardingStackParamList, 'OnboardingDateOfBirth'>;

function OnboardingDateOfBirth({ navigation, route }: Props) {
  const { dark, colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<string>();
  const toast = useToast();

  return (
    <OnboardingStepsLayout
      buttonText="Next"
      onPress={() => {
        if (date) {
          navigation.navigate('OnboardingLocation', {
            ...route.params,
            dateOfBirth: date,
          });
        } else {
          toast.show('Date of birth is required', {
            type: 'danger',
          });
        }
      }}
      onboardingType={AccountType.individual}
      activeStep={3}
      disabled={!date}
      reasonText={
        <StyledText style={{ color: dark ? colors.text : Colors.primary.brand }}>
          Your date of birth helps us to understand the type of content you would be most interested
          in seeing so that we may enhance your One Body experience.{' '}
          <StyledText style={{ fontWeight: 'bold', color: Colors.primary.brand }}>
            We do NOT publicly display this information.
          </StyledText>
        </StyledText>
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
            What is your date of birth?
          </StyledText>
          <StyledText
            style={[
              Typography.subheader.R,
              { color: dark ? Colors.main.black : Colors.neutral[300], marginTop: spacing.x8 },
            ]}
          >
            Select your date of birth
          </StyledText>
        </View>

        <View style={{ flex: 4, marginTop: spacing.x32 }}>
          <StyledText style={{ marginBottom: 10 }}>Date of birth</StyledText>
          <Button
            text={date || 'Select'}
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
              color: date ? Colors.neutral[300] : Colors.neutral[400],
            }}
            onPress={() => setOpen(true)}
            rightIcon={
              <Calendar
                onPress={() => setOpen(true)}
                style={{ paddingTop: 6 }}
                size={20}
                color={Colors.neutral[300]}
              />
            }
          />

          <DatePicker
            modal
            minimumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 90))}
            maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 16))}
            mode="date"
            androidVariant="nativeAndroid"
            open={open}
            date={
              date ? parse(date, 'MM/dd/yyyy', new Date()) : new Date(new Date().setFullYear(2000))
            }
            onConfirm={(date) => {
              setOpen(false);
              setDate(format(date, 'MM/dd/yyyy'));
            }}
            onCancel={() => {
              setOpen(false);
            }}
            textColor={Platform.OS === 'android' ? 'black' : ''}
          />
        </View>
      </View>
    </OnboardingStepsLayout>
  );
}
export default OnboardingDateOfBirth;
