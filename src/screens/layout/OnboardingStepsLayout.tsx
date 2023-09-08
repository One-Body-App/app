import Button from '@/src/components/Button';
import { Colors } from '@/src/styles';
import { button } from '@/src/styles/buttons';
import { borderRadius } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import { AccountType } from '@/utils/types';
import { ReactElement } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  View,
  ViewStyle,
} from 'react-native';

type Props = {
  children: ReactElement;
  onPress: () => void;
  buttonText: string;
  onboardingType: AccountType;
  activeStep: number;
  disabled?: boolean;
};

const indicatorStyle: ViewStyle = {
  backgroundColor: Colors.secondary.brand,
  height: 8,
  flex: 1,
  marginHorizontal: 5,
  borderRadius: borderRadius.base,
  opacity: 0.2,
};

const OnboardingStepsLayout = ({
  children,
  onPress,
  buttonText,
  onboardingType,
  activeStep,
  disabled,
}: Props) => {
  return (
    <SafeAreaView style={{ flex: 1, marginHorizontal: spacing.x24 }}>
      <View style={{ marginTop: spacing.x10 }}>
        {onboardingType == AccountType.individual ? (
          <View style={{ flexDirection: 'row' }}>
            <View
              style={[
                indicatorStyle,
                { marginHorizontal: 0 },
                activeStep >= 1 ? { opacity: 1 } : null,
              ]}
            ></View>
            <View style={[indicatorStyle, activeStep >= 2 ? { opacity: 1 } : null]}></View>
            <View style={[indicatorStyle, activeStep >= 3 ? { opacity: 1 } : null]}></View>
            <View style={[indicatorStyle, activeStep >= 4 ? { opacity: 1 } : null]}></View>
            <View style={[indicatorStyle, activeStep >= 5 ? { opacity: 1 } : null]}></View>
            <View style={[indicatorStyle, activeStep >= 6 ? { opacity: 1 } : null]}></View>
          </View>
        ) : (
          <View style={{ flexDirection: 'row' }}>
            <View style={[indicatorStyle, activeStep >= 1 ? { opacity: 1 } : null]}></View>
            <View style={[indicatorStyle, activeStep >= 2 ? { opacity: 1 } : null]}></View>
            <View style={[indicatorStyle, activeStep >= 3 ? { opacity: 1 } : null]}></View>
            <View style={[indicatorStyle, activeStep >= 4 ? { opacity: 1 } : null]}></View>
            <View style={[indicatorStyle, activeStep >= 5 ? { opacity: 1 } : null]}></View>
          </View>
        )}
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={{ flex: 1 }}>{children}</ScrollView>
      </KeyboardAvoidingView>
      <View style={{ justifyContent: 'center' }}>
        <Button
          text={buttonText}
          disabled={disabled}
          btnStyle={[
            button.primary,
            {
              flex: 1,
            },
          ]}
          disabledBtnStyle={[
            button.primary,
            {
              flex: 1,
              opacity: 0.4,
            },
          ]}
          onPress={() => {
            onPress();
          }}
          btnTextStyle={{ color: '#FFF' }}
          disabledBtnTextStyle={{ color: '#FFF' }}
        />
      </View>
    </SafeAreaView>
  );
};
export default OnboardingStepsLayout;
