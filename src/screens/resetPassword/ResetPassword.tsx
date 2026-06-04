import React from 'react';
import { ScrollView, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '@react-navigation/native';

import Button from '@/components/Button';
import StyledText from '@/components/styled/Text';
import GeneralStyle from '@/src/constants/GeneralStyle';
import { MainStackParamList } from '@/src/navigator/types';
import { Colors, Typography } from '@/src/styles';
import { button } from '@/src/styles/buttons';
import { borderRadius } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import UserStepsLayout from '../layout/UserStepsLayout';

type Props = NativeStackScreenProps<MainStackParamList, 'ResetPassword'>;

function ResetPassword({ navigation }: Props) {
  const { colors } = useTheme();

  const goToForgotPassword = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'ForgotPassword' }],
    });
  };

  const goToLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login', params: { resetPassword: true } }],
    });
  };

  return (
    <UserStepsLayout backgroundColor={colors.background} showCustomHeaderOnAndroid>
      <ScrollView style={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ marginHorizontal: spacing.x16 }}>
          <View style={{ marginVertical: spacing.x16 }}>
            <StyledText style={Typography.header.h1}>Reset password</StyledText>
            <StyledText
              style={[
                Typography.subheader.R,
                { color: Colors.neutral[200], marginTop: spacing.x8 },
              ]}
            >
              Password reset links have been replaced with email verification codes.
            </StyledText>
          </View>

          <View
            style={{
              paddingHorizontal: spacing.x16,
              paddingVertical: spacing.x24,
              backgroundColor: colors.background,
              borderRadius: borderRadius.base,
              marginBottom: spacing.x64,
              marginTop: spacing.x32,
            }}
          >
            <View
              style={[GeneralStyle.MessageView, { backgroundColor: Colors.primarySapphire[900] }]}
            >
              <StyledText style={{ color: Colors.primarySapphire[700], flex: 1 }}>
                Request a reset code to update your password and start a fresh Clerk session.
              </StyledText>
            </View>

            <Button
              text="Request reset code"
              btnStyle={[button.primary, { flex: 1, marginTop: spacing.x24 }]}
              onPress={goToForgotPassword}
              btnTextStyle={{ color: '#FFF' }}
            />

            <Button
              text="Back to sign in"
              onPress={goToLogin}
              wrapperViewBtnStyle={{ marginTop: spacing.x16 }}
              btnTextStyle={[Typography.subheader.R, { color: Colors.primarySapphire.brand }]}
            />
          </View>
        </View>
      </ScrollView>
    </UserStepsLayout>
  );
}

export default ResetPassword;
