import React from 'react';
import { Text, View, Image, ImageBackground, TouchableOpacity, SafeAreaView } from 'react-native';
import { Checkbox } from 'react-native-paper';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { styles } from './styles';
import OnboardingStepsLayout from '../../layout/OnboardingStepsLayout';
import { spacing } from '@/src/styles/spacing';
import { StyledText } from '@/src/components/styled/Text';
import { Colors, Typography } from '@/src/styles';
import { AccountType } from '@/utils/types';

const OnboardingChurchAttend = () => {
  return (
    <OnboardingStepsLayout
      buttonText="Continue"
      onPress={() => {}}
      onboardingType={AccountType.individual}
      activeStep={1}
    >
      <View style={{ marginVertical: spacing.x48 }}>
        <StyledText style={[Typography.header.h1]}>What type of Church do you attend?</StyledText>
        <StyledText
          style={[Typography.subheader.R, { color: Colors.neutral[200], marginTop: spacing.x8 }]}
        >
          Identify your church type
        </StyledText>
      </View>
    </OnboardingStepsLayout>
  );
};
export default OnboardingChurchAttend;
