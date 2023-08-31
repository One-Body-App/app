import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Animated,
  Image,
  ImageBackground,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
} from 'react-native';
import { Avatar, Checkbox, Provider } from 'react-native-paper';
import SelectDropdown from 'react-native-select-dropdown';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Header from '@/src/components/Header';
import Button from '@/src/components/Button';

import OnboardingStepsLayout from '../../layout/OnboardingStepsLayout';
import { StackScreenProps } from '@react-navigation/stack';
import { OnboardingStackParamList } from '@/src/navigator/types';
import { AccountType } from '@/utils/types';
import { StyledText } from '@/src/components/styled/Text';
import { Colors, Typography } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import { card } from '@/src/styles/items';
import { borderRadius } from '@/src/styles/outlines';
import { GeneralStyle } from '@/src/constants/GeneralStyle';

type Props = StackScreenProps<OnboardingStackParamList, 'OnboardingChurchAttend'>;

const OnboardingChurchAttend = ({ navigation, route }: Props) => {
  const [churchAttend, setChurchAttend] = useState<string>('');

  return (
    <OnboardingStepsLayout
      buttonText="Continue"
      onPress={() => {
        navigation.push('OnboardingDateOfBirth', {
          ...route.params,
          selectedChurchAttendence: churchAttend,
        });
      }}
      onboardingType={AccountType.individual}
      activeStep={2}
      disabled={false}
    >
      <View style={{ marginVertical: spacing.x48, flex: 1 }}>
        <View style={{ flex: 1 }}>
          <StyledText style={[Typography.header.h1]}>How often do you attend Church?</StyledText>
          <StyledText
            style={[Typography.subheader.R, { color: Colors.neutral[200], marginTop: spacing.x8 }]}
          >
            Select the rate at which you go to church
          </StyledText>
        </View>

        <View style={{ flex: 4 }}>
          <TouchableOpacity
            style={[
              card,
              {
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderColor:
                  churchAttend == 'Weekly' ? Colors.primarySapphire.brand : Colors.neutral[700],
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
                    churchAttend == 'Weekly' ? Colors.primarySapphire.brand : Colors.neutral.brand,
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
                  churchAttend == 'Bi-Weekly' ? Colors.primarySapphire.brand : Colors.neutral[700],
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
                      : Colors.neutral.brand,
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
                    : Colors.neutral[700],
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
                      : Colors.neutral.brand,
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
                    : Colors.neutral[700],
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
                      : Colors.neutral.brand,
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
