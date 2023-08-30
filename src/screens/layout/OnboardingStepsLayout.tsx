import Button from '@/src/components/Button';
import { Colors } from '@/src/styles';
import { button } from '@/src/styles/buttons';
import { borderRadius } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import { AccountType } from '@/utils/types';
import { ReactElement } from 'react';
import { SafeAreaView, View, ViewStyle } from 'react-native';

type Props = {
  children: ReactElement;
  onPress: () => void;
  buttonText: string;
  onboardingType: AccountType;
  activeStep: number;
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
                activeStep == 1 ? { opacity: 1 } : null,
              ]}
            ></View>
            <View style={[indicatorStyle, activeStep == 2 ? { opacity: 1 } : null]}></View>
            <View style={[indicatorStyle, activeStep == 3 ? { opacity: 1 } : null]}></View>
            <View style={[indicatorStyle, activeStep == 4 ? { opacity: 1 } : null]}></View>
            <View style={[indicatorStyle, activeStep == 5 ? { opacity: 1 } : null]}></View>
          </View>
        ) : (
          <View style={{ flexDirection: 'row' }}>
            <View style={[indicatorStyle, activeStep == 1 ? { opacity: 1 } : null]}></View>
            <View style={[indicatorStyle, activeStep == 2 ? { opacity: 1 } : null]}></View>
            <View style={[indicatorStyle, activeStep == 3 ? { opacity: 1 } : null]}></View>
            <View style={[indicatorStyle, activeStep == 4 ? { opacity: 1 } : null]}></View>
            <View style={[indicatorStyle, activeStep == 5 ? { opacity: 1 } : null]}></View>
          </View>
        )}
      </View>

      <View style={{ flex: 1 }}>{children}</View>

      <View style={{ justifyContent: 'center' }}>
        <Button
          text={buttonText}
          btnStyle={[
            button.primary,
            {
              flex: 1,
            },
          ]}
          onPress={() => {
            onPress();
          }}
          btnTextStyle={{ color: '#FFF' }}
        />
      </View>
    </SafeAreaView>
  );
};
export default OnboardingStepsLayout;
