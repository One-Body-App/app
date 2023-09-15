import React, { useState } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';

import OnboardingStepsLayout from '../../layout/OnboardingStepsLayout';
import { StackScreenProps } from '@react-navigation/stack';
import { OnboardingStackParamList } from '@/src/navigator/types';
import { AccountType } from '@/utils/types';
import { StyledText } from '@/src/components/styled/Text';
import { Colors, Typography } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import { card } from '@/src/styles/items';
import { GeneralStyle } from '@/src/constants/GeneralStyle';
import { useToast } from 'react-native-toast-notifications';

type Props = StackScreenProps<OnboardingStackParamList, 'OnboardingChurchAttend'>;

const OnboardingChurchAttend = ({ navigation, route }: Props) => {
  const [churchAttend, setChurchAttend] = useState<string>('');
  const toast = useToast();

  return (
    <OnboardingStepsLayout
      buttonText="Next"
      onPress={() => {
        if (churchAttend) {
          navigation.push('OnboardingDateOfBirth', {
            ...route.params,
            selectedChurchAttendence: churchAttend,
          });
        } else {
          toast.show('Frequency of church attendance is required', {
            type: 'danger',
          });
        }
      }}
      onboardingType={AccountType.individual}
      activeStep={2}
      disabled={!churchAttend}
    >
      <View style={{ marginVertical: spacing.x48, flex: 1 }}>
        <View style={{ flex: 1 }}>
          <StyledText style={[Typography.header.h1]}>How often do you attend Church?</StyledText>
          <StyledText
            style={[Typography.subheader.R, { color: Colors.neutral[300], marginTop: spacing.x8 }]}
          >
            Select the frequency at which you go to church
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
                  churchAttend == 'Weekly' ? Colors.primarySapphire.brand : Colors.neutral[800],
              },
            ]}
            onPress={() => {
              setChurchAttend('Weekly');
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ marginLeft: 15 }}>Weekly</Text>
            </View>
            <View
              style={[
                GeneralStyle.radioButton,
                {
                  borderColor:
                    churchAttend == 'Weekly' ? Colors.primarySapphire.brand : Colors.neutral[200],
                },
              ]}
            >
              {churchAttend == 'Weekly' ? <View style={GeneralStyle.radioButtonIcon} /> : null}
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
                  churchAttend == 'Bi-Weekly' ? Colors.primarySapphire.brand : Colors.neutral[800],
              },
            ]}
            onPress={() => {
              setChurchAttend('Bi-Weekly');
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ marginLeft: 15 }}>Bi-Weekly</Text>
            </View>
            <View
              style={[
                GeneralStyle.radioButton,
                {
                  borderColor:
                    churchAttend == 'Bi-Weekly'
                      ? Colors.primarySapphire.brand
                      : Colors.neutral[200],
                },
              ]}
            >
              {churchAttend == 'Bi-Weekly' ? <View style={GeneralStyle.radioButtonIcon} /> : null}
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
                  churchAttend == 'Once a Month'
                    ? Colors.primarySapphire.brand
                    : Colors.neutral[800],
              },
            ]}
            onPress={() => {
              setChurchAttend('Once a Month');
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ marginLeft: 15 }}>Once a Month</Text>
            </View>
            <View
              style={[
                GeneralStyle.radioButton,
                {
                  borderColor:
                    churchAttend == 'Once a Month'
                      ? Colors.primarySapphire.brand
                      : Colors.neutral[200],
                },
              ]}
            >
              {churchAttend == 'Once a Month' ? (
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
                  churchAttend == 'I only Watch at Home'
                    ? Colors.primarySapphire.brand
                    : Colors.neutral[800],
              },
            ]}
            onPress={() => {
              setChurchAttend('I only Watch at Home');
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ marginLeft: 15 }}>I only Watch at Home</Text>
            </View>
            <View
              style={[
                GeneralStyle.radioButton,
                {
                  borderColor:
                    churchAttend == 'I only Watch at Home'
                      ? Colors.primarySapphire.brand
                      : Colors.neutral[200],
                },
              ]}
            >
              {churchAttend == 'I only Watch at Home' ? (
                <View style={GeneralStyle.radioButtonIcon} />
              ) : null}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </OnboardingStepsLayout>
  );
};
export default OnboardingChurchAttend;
