import React from 'react';
import { SafeAreaView, Text, useColorScheme, View } from 'react-native';
import { getHeight, getWidth } from '@/utils/ResponsiveFun';
import GoBackIcon from '@/components/GoBackIcon';
import { setLoader } from '@/redux//actions/GeneralActions';
import { GeneralStyle } from '../../../constants/GeneralStyle';
import LinearGradient from 'react-native-linear-gradient';
import Logo from '@/assets/svg/LogoBlue.svg';
import { ApiCall } from '@/services/api';
import Button from '@/components/Button';
import { TextInput } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { styles } from './styles';
import { useTheme } from '@react-navigation/native';
import GeneralStatusBar from '@/src/Components/GeneralStatusBar';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { RootStackParamList } from '@/src/Navigation/types';
import { StackScreenProps } from '@react-navigation/stack';

type Props = StackScreenProps<RootStackParamList, 'forget'>;

const ForgotPassword = ({ navigation }: Props) => {
  const [email, setEmail] = React.useState<string>('');
  const [emailError, setEmailError] = React.useState<boolean>();
  const [error, seterror] = React.useState<string>('');
  const [showSuccess, setShowSuccess] = React.useState<boolean>(false);
  const scheme = useColorScheme();
  const { colors } = useTheme();

  const emailvalidate = (text: string) => {
    let reg = /^\w+([\.\-\+]?\w+)*@\w+([\.-]?\w+)*(\.\w\w+)+$/;
    console.log(reg);
    if (reg.test(text) === false) {
      return true;
    } else {
      return false;
    }
  };
  const dispatch = useDispatch();
  const forget = async () => {
    if (!emailvalidate(email) && email != null) {
      setEmailError(false);
      seterror('');
      dispatch(setLoader(true));
      try {
        const res = await ApiCall({
          route: 'auth/forgot-password',
          params: { email: email },
          verb: 'patch',
        });
        if (res?.status == 200) {
          dispatch(setLoader(false));
          setShowSuccess(true);
        } else {
          dispatch(setLoader(false));
          seterror(res.response?.message);
        }
      } catch (e: any) {
        dispatch(setLoader(false));

        console.log('saga error -- ', e.toString());
      }
    } else {
      setEmailError(true);
      seterror('Email not valid!!');
    }
  };
  return (
    <LinearGradient
      colors={[colors.background, colors.background, '#E0EEF3']}
      style={styles.container}
    >
      <GeneralStatusBar backgroundColor={colors.background} hidden={false} translucent={true} />
      <SafeAreaView>
        <KeyboardAwareScrollView>
          <View style={styles.headview}>
            <GoBackIcon color={colors.text} />
          </View>

          <View style={styles.topView}>
            <Logo height={getHeight(17)} width={getWidth(50)} />
          </View>
          <View style={styles.options}>
            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.subTitle}>
              Enter your email and we will email you a link to reset your password
            </Text>
          </View>

          {showSuccess ? (
            <View style={styles.emailsuccessview}>
              <Text style={styles.emailSuccesssText}>
                If you have an account with us you will get an email with the instructions to reset
                your password.
              </Text>
            </View>
          ) : (
            <>
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
                activeOutlineColor={'#5B7279'}
                label={'E-mail'}
                autoComplete="email"
              />
              {error != null ? (
                <View style={styles.emailerrorview}>
                  <Text style={styles.emailerrortext}>{error}</Text>
                </View>
              ) : null}
            </>
          )}

          {!showSuccess ? (
            <Button
              text={'SEND RESET LINK'}
              btnStyle={{
                ...GeneralStyle.btn,
                marginTop: getHeight(5),
                backgroundColor: scheme == 'dark' ? '#fff' : '#0C5C75',
              }}
              btnTextStyle={GeneralStyle.btnText}
              onPress={() => forget()}
            />
          ) : (
            <Button
              text={'GO BACK'}
              btnStyle={{
                ...GeneralStyle.btn,
                marginTop: getHeight(5),
                backgroundColor: scheme == 'dark' ? '#fff' : '#0C5C75',
              }}
              btnTextStyle={GeneralStyle.btnText}
              onPress={() => navigation.goBack()}
            />
          )}
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default ForgotPassword;
