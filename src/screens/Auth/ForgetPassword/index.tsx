import React from 'react';
import { Text, View } from 'react-native';
import { getHeight, getWidth } from '@/utils/ResponsiveFun';
import GoBackIcon from '@/components/GoBackIcon';
import { setLoader } from '@/redux//actions/GeneralActions';
import { GernalStyle } from '../../../constants/GernalStyle';
import LinearGradient from 'react-native-linear-gradient';
import Logo from '@/assets/svg/LogoBlue.svg';
import { ApiCall } from '@/services/api';
import Button from '@/components/Button';
import { TextInput } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { styles } from './styles';

const ForgotPassword = ({ navigation }) => {
  const [email, setEmail] = React.useState();
  const [emailError, setEmailError] = React.useState();
  const [error, seterror] = React.useState();
  const emailvalidate = (text) => {
    let reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w\w+)+$/;
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
      seterror(null);
      dispatch(setLoader(true));
      try {
        const res = await ApiCall({
          route: 'auth/forgot-password',
          params: { email: email },
          verb: 'patch',
        });
        if (res?.status == '200') {
          dispatch(setLoader(false));
          navigation.navigate('PasswordResetOtp', { email: email });
        } else {
          dispatch(setLoader(false));
          seterror(res.data?.message);
        }
      } catch (e) {
        console.log('saga error -- ', e.toString());
      }
    } else {
      setEmailError(true);
      seterror('Email not valid!!');
    }
  };
  return (
    <LinearGradient colors={['#fff', '#fff', '#E0EEF3']} style={styles.container}>
      <View style={styles.container}>
        <View style={styles.topView}>
          <Logo height={getHeight(17)} width={getWidth(50)} />
        </View>
        <View style={styles.options}>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subTitle}>
            You can receive the verification code by your phone number or your email to reset your
            password
          </Text>
        </View>

        <TextInput
          style={{ ...GernalStyle.input, marginTop: getHeight(3) }}
          theme={{ roundness: 10 }}
          value={email}
          error={emailError}
          onChangeText={(e) => {
            setEmail(e), setEmailError(false);
          }}
          keyboardType="email-address"
          mode="outlined"
          activeOutlineColor={'#5B7279'}
          label={'E-mail or Phone Number'}
        />
        {error != null ? (
          <View style={styles.emailerrorview}>
            <Text style={styles.emailerrortext}>{error}</Text>
          </View>
        ) : null}
        <Button
          text={'SEND CODE'}
          btnStyle={{ ...GernalStyle.btn, marginTop: getHeight(5) }}
          btnTextStyle={GernalStyle.btnText}
          onPress={() => forget()}
        />
        <GoBackIcon color={'#4F6D77'} />
      </View>
    </LinearGradient>
  );
};

export default ForgotPassword;
