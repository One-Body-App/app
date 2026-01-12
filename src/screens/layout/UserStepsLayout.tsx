import { ReactElement } from 'react';
import { Platform, SafeAreaView, View, ViewStyle } from 'react-native';
import { useTheme } from '@react-navigation/native';

import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import StyledText from '@/components/styled/Text';
import { Colors, Typography } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import CustomHeader from '@/src/components/CustomHeader';

type Props = {
  children: ReactElement | ReactElement[];
  backgroundColor?: string;
  bottomOffset?: number;
  hideBottomText?: boolean;
  refreshControl?: React.ReactElement;
  showCustomHeaderOnAndroid?: boolean;
};

export function BottomStepsText() {
  const { dark } = useTheme();
  const primaryTextColor = dark ? '#f6f6f6' : Colors.primary.brand;

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: Platform.OS === 'android' ? spacing.x10 : 0,
      }}
    >
      <StyledText style={[Typography.subheader.M, { color: primaryTextColor }]}>
        Build the Body{' '}
      </StyledText>
      <StyledText style={[Typography.subheader.M, { color: '#12d2d9' }]}>1 Cor. 12:12</StyledText>
    </View>
  );
}

function UserStepsLayout({
  children,
  backgroundColor,
  bottomOffset,
  hideBottomText,
  refreshControl,
  showCustomHeaderOnAndroid = false,
}: Props) {
  const { colors } = useTheme();
  const resolvedBackground = backgroundColor ?? colors.background;

  return (
    <SafeAreaView style={{ flexGrow: 1, backgroundColor: resolvedBackground }}>
      {showCustomHeaderOnAndroid && Platform.OS === 'android' && <CustomHeader showBackButton />}
      <KeyboardAwareScrollView
        bottomOffset={bottomOffset ?? 50}
        contentContainerStyle={{ paddingBottom: bottomOffset ?? 50 }}
        refreshControl={refreshControl}
      >
        {children}

        {hideBottomText ? null : <BottomStepsText />}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
export default UserStepsLayout;
