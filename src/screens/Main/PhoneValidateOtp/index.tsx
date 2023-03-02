import React, { useState } from 'react';
import { Text, View, Touchable, StatusBar, Image, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import OTPInputView from '@twotalltotems/react-native-otp-input';
import { styles } from './styles';
import Header from '@/components/Header';
import Button from '@/components/Button';
import { ApiCall } from '@/services/api';
import { useDispatch, useSelector } from 'react-redux';
import { getProfile } from '@/redux//actions/AuthActions';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import { setLoader } from '@/redux//actions/GeneralActions';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import LinearGradient from 'react-native-linear-gradient';
import Logo from '@/assets/svg/LogoBlue.svg';
import { GeneralStyle } from '../../../constants/GeneralStyle';
import Icon from 'react-native-vector-icons/Ionicons';

const PhoneValidateOtp = ({ navigation }) => {
  const user = useSelector((state) => state.auth.userProfile);
  const token = useSelector((state) => state.auth.userToken);
  const [error, seterror] = React.useState();
  const [code, setCode] = useState(1234);

  const dispatch = useDispatch();
  const checkOtp = async (code) => {
    seterror(null);
    dispatch(setLoader(true));
    // dispatch(setLoader(false));

    // dispatch(getProfile({ token, role: user?.role }));
    try {
      const res = await ApiCall({
        route: 'auth/verify-otp',
        params: { mode: 'signup', otp: code, email: user?.email },
        verb: 'patch',
      });
      if (res.status == '200') {
        dispatch(setLoader(false));
        // dispatch(getProfile({ token, role: user?.role }));
      } else {
        seterror(res.data?.message);
        dispatch(setLoader(false));
      }
    } catch (e) {
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

      <LinearGradient
        colors={['#fff', '#fff', '#E0EEF3']}
        style={{ alignItems: 'center', flex: 1 }}
      >
        <Logo height={getHeight(17)} width={getWidth(50)} style={{ marginTop: 20 }} />
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
          placeholderTextColor={styles.newcolor}
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
        <TouchableOpacity style={styles.header} onPress={() => navigation.goBack()}>
          <Icon
            name="chevron-back"
            style={{ margin: getFontSize(3) }}
            size={20}
            color={'#4F6D77'}
          />
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};
export default PhoneValidateOtp;
