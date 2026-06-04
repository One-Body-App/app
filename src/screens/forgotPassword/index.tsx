import React from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { useTheme } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { setLoader } from '@/src/redux/actions/GeneralActions';
import { ApiCall } from '@/src/services/api';
import GeneralStyle from '../../constants/GeneralStyle';
import Button from '@/components/Button';

import { MainStackParamList } from '@/src/navigator/types';
import UserStepsLayout from '../layout/UserStepsLayout';
import { Colors, Typography } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import StyledText from '@/components/styled/Text';
import { borderRadius } from '@/src/styles/outlines';
import StyledTextInput from '@/components/styled/TextInput';
import { button } from '@/src/styles/buttons';

type Props = NativeStackScreenProps<MainStackParamList, 'ForgotPassword'>;

const emailvalidate = (text: string) => {
  const reg = /^\w+([.\-+]?\w+)*@\w+([.-]?\w+)*(\.\w\w+)+$/;

  if (reg.test(text) === false) {
    return true;
  }
  return false;
};

function ForgotPassword({ route }: Props) {
  const [email, setEmail] = React.useState<string>(route?.params?.email ?? '');
  const [error, seterror] = React.useState<string>('');
  const [showSuccess, setShowSuccess] = React.useState<boolean>(false);

  const { colors } = useTheme();

  const dispatch = useDispatch();

  const forget = async () => {
    if (!emailvalidate(email) && email != null) {
      seterror('');
      dispatch(setLoader(true));
      try {
        const result = await ApiCall<{ message?: string }>({
          route: 'auth/forgot-password',
          verb: 'patch',
          params: { email: email.trim().toLowerCase(), delivery: 'mobile' },
        });

        if (result.status >= 400) {
          const requestError = new Error(
            result.response?.message ?? 'Unable to send reset instructions.'
          ) as Error & { response?: typeof result.response };
          requestError.response = result.response;
          throw requestError;
        }

        setEmail('');
        dispatch(setLoader(false));
        setShowSuccess(true);
      } catch (e: any) {
        dispatch(setLoader(false));
        const message =
          e?.errors?.[0]?.longMessage ??
          e?.errors?.[0]?.message ??
          e?.message ??
          'Unable to send reset instructions.';
        seterror(message);
      }
    } else {
      seterror('Email not valid!!');
    }
  };
  return (
    <UserStepsLayout backgroundColor={colors.background} showCustomHeaderOnAndroid>
      <ScrollView style={{ flexGrow: 1 }}>
        <View style={{ marginHorizontal: spacing.x16 }}>
          <View style={{ marginVertical: spacing.x16 }}>
            <StyledText style={Typography.header.h1}>Forgot your password?</StyledText>

            <StyledText
              style={[
                Typography.subheader.R,
                { color: Colors.neutral[200], marginTop: spacing.x8 },
              ]}
            >
              No problem! Enter the email address that you signed up with to reset it.
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
            <View style={{ flex: 1 }}>
              {showSuccess ? (
                <View
                  style={[
                    GeneralStyle.MessageView,
                    { backgroundColor: Colors.successFeedback.background },
                  ]}
                >
                  <StyledText style={GeneralStyle.successtext}>
                    If an account exists for that email, open the reset link on this device to
                    create a new password inside One Body.
                  </StyledText>
                </View>
              ) : null}
              <StyledTextInput
                wrapperStyle={{ flex: 1 }}
                value={email}
                keyboardType="email-address"
                label="Email"
                placeholder="Email address"
                autoComplete="email"
                autoCapitalize="none"
                onChangeText={(e) => {
                  setEmail(e);
                }}
              />
              {error != null ? (
                <StyledText style={{ ...GeneralStyle.InputError }}>{error}</StyledText>
              ) : null}
            </View>
            <Button
              text="Send Reset Link"
              btnStyle={[
                button.primary,
                {
                  flex: 1,
                },
              ]}
              disabled={!email}
              disabledBtnStyle={[
                button.primary,
                {
                  backgroundColor: Colors.primarySapphire[200],
                  flex: 1,
                  opacity: 0.4,
                },
              ]}
              onPress={() => forget()}
              btnTextStyle={{ color: '#FFF' }}
              disabledBtnTextStyle={{ color: Colors.primarySapphire[600] }}
            />
          </View>

          <View style={{ alignItems: 'center' }}>
            <Button
              onPress={() => {
                Linking.openURL('mailto:support@onebodyapp.com');
              }}
              text="Still having issues? "
              wrapperViewBtnStyle={{ marginTop: spacing.x32 }}
              btnTextStyle={[Typography.subheader.R, { color: Colors.neutral[200] }]}
              rightIcon={
                <StyledText style={{ color: Colors.primarySapphire.brand }}>Contact us</StyledText>
              }
            />
          </View>
        </View>

        {/* <>
              <TextInput
                style={{ ...GeneralStyle.input, marginTop: getHeight(3) }}
                theme={{ roundness: 10 }}
                value={email}
                error={emailError}
                onChangeText={(e) => {
                  setEmail(e), setEmailError(false);
                }}
                keyboardType="email-address"
                mode="outlined"
                activeOutlinecolor={Colors.primarySapphire[500]}
                label={'E-mail'}
                autoComplete="email"
              />
              {error != null ? (
                <View style={styles.emailerrorview}>
                  <Text style={styles.emailerrortext}>{error}</Text>
                </View>
              ) : null}
            </>


          {!showSuccess ? (
            <Button
              text={'SEND RESET LINK'}
              btnStyle={{ marginHorizontal: 24 }}
              // btnStyle={{
              //   ...GeneralStyle.btn,
              //   marginTop: getHeight(5),
              //   backgroundColor: scheme == 'dark' ? '#fff' : '#0C5C75',
              // }}
              // btnTextStyle={GeneralStyle.btnText}
              onPress={() => forget()}
            />
          ) : (
            <View style={{ marginTop: 10 }}>
              <Button text={'GO BACK'} onPress={() => navigation.goBack()} />
            </View>
          )} */}
      </ScrollView>
    </UserStepsLayout>
  );
}

export default ForgotPassword;
