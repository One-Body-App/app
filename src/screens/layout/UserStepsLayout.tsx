import { ReactElement } from 'react';
import { Platform, SafeAreaView, View, ViewStyle } from 'react-native';

import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import StyledText from '@/components/styled/Text';
import { Colors, Typography } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';

type Props = {
  children: ReactElement | ReactElement[];
  backgroundColor?: string;
  bottomOffset?: number;
  hideBottomText?: boolean;
};

export function BottomStepsText() {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: Platform.OS === 'android' ? spacing.x10 : 0,
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

function UserStepsLayout({ children, backgroundColor, bottomOffset, hideBottomText }: Props) {
  return (
    <SafeAreaView style={{ flexGrow: 1, backgroundColor: backgroundColor ?? undefined }}>
      <KeyboardAwareScrollView bottomOffset={bottomOffset ?? 50}>
        {children}

        {hideBottomText ? null : <BottomStepsText />}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
export default UserStepsLayout;
