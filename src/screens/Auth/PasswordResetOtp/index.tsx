import React, { useState } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import OTPInputView from '@twotalltotems/react-native-otp-input';
import { styles } from './styles';
import Header from '@/src/components/Header';
import { useDispatch, useSelector } from 'react-redux';
import { ApiCall } from '@/src/Services/api';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import { setLoader } from '@/redux/actions/GeneralActions';
import Button from '@/src/components/Button';
import GeneralStatusBar from '@/src/components/GeneralStatusBar';
import Logo from '@/src/assets/svg/LogoBlue.svg';
import { GeneralStyle } from '@/src/constants/GeneralStyle';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import GoBackIcon from '@/src/components/GoBackIcon';

const PasswordResetOtp = ({ navigation, route }) => {
  const [error, seterror] = React.useState();
  const [code, setCode] = useState('');
  const dispatch = useDispatch();
  const checkOtp = async (code) => {
    seterror(null);
    dispatch(setLoader(true));
    try {
      const res = await ApiCall({
        route: 'auth/verify-otp',
        params: { mode: 'reset', otp: code, email: route.params.email },
        verb: 'patch',
      });
      if (res.status == '200') {
        dispatch(setLoader(false));
        navigation.navigate('newpassword', { email: route.params.email });
      } else {
        seterror(res.data?.message);
        dispatch(setLoader(false));
      }
    } catch (e) {
      dispatch(setLoader(false));

      console.log('saga error -- ', e.toString());
    }
  };
  return (
    <View style={styles.container}>
      <GeneralStatusBar
        backgroundColor="white"
        barStyle="dark-content"
        hidden={false}
        translucent={true}
      />

      <LinearGradient colors={['#fff', '#fff', '#E0EEF3']} style={styles.inerContainer}>
        <Logo height={getHeight(17)} width={getWidth(50)} style={{ marginTop: getHeight(2) }} />
        <View style={styles.options}>
          <Text style={styles.title}>Email has been sent!</Text>
          <Text style={styles.subTitle}>
            Enter the verification code we just sent to your email.
          </Text>
        </View>
        <OTPInputView
          style={{ width: '85%', height: 200 }}
          pinCount={4}
          autoFocusOnLoad={false}
          codeInputFieldStyle={styles.underlineStyleBase}
          codeInputHighlightStyle={styles.underlineStyleHighLighted}
          onCodeFilled={(code) => {
            code != null ? setCode(code) : console.log('error');
          }}
        />
        <Button
          text={'SEND CODE'}
          btnStyle={GeneralStyle.btn}
          btnTextStyle={GeneralStyle.btnText}
          onPress={() => {
            checkOtp(code);
          }}
        />
        <Button
          text={'Resend Code?'}
          btnStyle={{ marginTop: 25 }}
          btnTextStyle={{ color: '#126B87' }}
          onPress={() => console.log('resend code')}
        />
      </LinearGradient>
      <GoBackIcon color={'#4F6D77'} />
    </View>
  );
};
export default PasswordResetOtp;
