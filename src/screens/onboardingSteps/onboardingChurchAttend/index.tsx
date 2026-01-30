import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';

import { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '@react-navigation/native';
import OnboardingStepsLayout from '../../layout/OnboardingStepsLayout';
import { OnboardingStackParamList } from '@/src/navigator/types';
import { AccountType } from '@/utils/types';
import StyledText from '@/components/styled/Text';
import { Colors, Typography } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import { card } from '@/src/styles/items';
import GeneralStyle from '@/src/constants/GeneralStyle';

type Props = StackScreenProps<OnboardingStackParamList, 'OnboardingChurchAttend'>;

function OnboardingChurchAttend({ navigation, route }: Props) {
  const { dark } = useTheme();
  const [churchAttend, setChurchAttend] = useState<string>('');

  return (
    <OnboardingStepsLayout
      buttonText={churchAttend ? 'Next' : 'Skip'}
      onPress={() => {
        navigation.push('OnboardingDateOfBirth', {
          ...route.params,
          selectedChurchAttendence: churchAttend,
        });
      }}
      onboardingType={AccountType.individual}
      activeStep={2}
      reasonText={
        <StyledText style={{ color: dark ? Colors.main.black : Colors.primary.brand }}>
          Your frequency of church attendance helps us to understand the type of content you would
          be most interested in seeing to enhance your One Body experience.{' '}
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
            How often do you attend Church?
          </StyledText>
          <StyledText
            style={[
              Typography.subheader.R,
              { color: dark ? Colors.main.black : Colors.neutral[300], marginTop: spacing.x8 },
            ]}
          >
            Select the rate at which you go to church
          </StyledText>
        </View>

        <View style={{ flex: 4, marginTop: spacing.x32 }}>
          <StyledText>Church Attendance</StyledText>
          <TouchableOpacity
            style={[
              card,
              {
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderColor:
                  churchAttend === 'Weekly' ? Colors.primarySapphire.brand : Colors.neutral[800],
              },
            ]}
            onPress={() => {
              setChurchAttend('Weekly');
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <StyledText style={{ marginLeft: 15 }}>Weekly</StyledText>
            </View>
            <View
              style={[
                GeneralStyle.radioButton,
                {
                  borderColor:
                    churchAttend === 'Weekly' ? Colors.primarySapphire.brand : Colors.neutral[200],
                },
              ]}
            >
              {churchAttend === 'Weekly' ? <View style={GeneralStyle.radioButtonIcon} /> : null}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              card,
              {
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderColor:
                  churchAttend === 'Bi-Weekly' ? Colors.primarySapphire.brand : Colors.neutral[800],
              },
            ]}
            onPress={() => {
              setChurchAttend('Bi-Weekly');
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <StyledText style={{ marginLeft: 15 }}>Bi-Weekly</StyledText>
            </View>
            <View
              style={[
                GeneralStyle.radioButton,
                {
                  borderColor:
                    churchAttend === 'Bi-Weekly'
                      ? Colors.primarySapphire.brand
                      : Colors.neutral[200],
                },
              ]}
            >
              {churchAttend === 'Bi-Weekly' ? <View style={GeneralStyle.radioButtonIcon} /> : null}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              card,
              {
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderColor:
                  churchAttend === 'Once a Month'
                    ? Colors.primarySapphire.brand
                    : Colors.neutral[800],
              },
            ]}
            onPress={() => {
              setChurchAttend('Once a Month');
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <StyledText style={{ marginLeft: 15 }}>Once a Month</StyledText>
            </View>
            <View
              style={[
                GeneralStyle.radioButton,
                {
                  borderColor:
                    churchAttend === 'Once a Month'
                      ? Colors.primarySapphire.brand
                      : Colors.neutral[200],
                },
              ]}
            >
              {churchAttend === 'Once a Month' ? (
                <View style={GeneralStyle.radioButtonIcon} />
              ) : null}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              card,
              {
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderColor:
                  churchAttend === 'I only Watch at Home'
                    ? Colors.primarySapphire.brand
                    : Colors.neutral[800],
              },
            ]}
            onPress={() => {
              setChurchAttend('I only Watch at Home');
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <StyledText style={{ marginLeft: 15 }}>I only Watch at Home</StyledText>
            </View>
            <View
              style={[
                GeneralStyle.radioButton,
                {
                  borderColor:
                    churchAttend === 'I only Watch at Home'
                      ? Colors.primarySapphire.brand
                      : Colors.neutral[200],
                },
              ]}
            >
              {churchAttend === 'I only Watch at Home' ? (
                <View style={GeneralStyle.radioButtonIcon} />
              ) : null}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </OnboardingStepsLayout>
  );
}
export default OnboardingChurchAttend;
