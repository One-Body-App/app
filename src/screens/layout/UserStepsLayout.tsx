import { ReactElement, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  View,
  ViewStyle,
} from 'react-native';
import StyledText from '@/components/styled/Text';
import { Colors, Typography } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';

type Props = {
  children: ReactElement;
  backgroundColor?: string;
  keyboardVerticalOffset?: number;
  hideBottomText?: boolean;
  keyboardAvoidingViewStyle?: ViewStyle;
};

export function BottomStepsText() {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: Platform.OS == 'android' ? spacing.x10 : 0,
      }}
    >
      <StyledText style={[Typography.subheader.M, { color: Colors.primary[300] }]}>
        Unify the Body{' '}
      </StyledText>
      <StyledText style={[Typography.subheader.M, { color: Colors.primarySapphire.brand }]}>
        1 Cor. 12:12
      </StyledText>
    </View>
  );
}

function UserStepsLayout({
  children,
  backgroundColor,
  keyboardVerticalOffset,
  hideBottomText,
  keyboardAvoidingViewStyle,
}: Props) {
  return (
    <SafeAreaView style={{ flexGrow: 1, backgroundColor: backgroundColor ?? undefined }}>
      {/* <SafeAreaView style={{ flexGrow: 1, backgroundColor: backgroundColor ?? undefined }}> */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'position' : 'height'}
        // keyboardVerticalOffset={headerHeight}

        // style={{ backgroundColor: 'green' }}
        keyboardVerticalOffset={keyboardVerticalOffset}
        // contentContainerStyle={{
        //   flexGrow: 1,
        //   // backgroundColor: 'green',
        // }}
        style={keyboardAvoidingViewStyle ?? { flexGrow: 1 }}
      >
        <ScrollView style={{ flexGrow: 1 }}>{children}</ScrollView>
      </KeyboardAvoidingView>

      {hideBottomText ? null : <BottomStepsText />}

      {/* </SafeAreaView> */}
    </SafeAreaView>
  );
}
export default UserStepsLayout;
