import React, { useState } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import OTPInputView from '@twotalltotems/react-native-otp-input';
import { styles } from './styles';
import Header from '@/components/Header';
import Button from '@/components/Button';
import { ApiCall } from '@/services/api';
import { useDispatch, useSelector } from 'react-redux';
import { getProfile } from '@/redux//actions/AuthActions';
import Toast from 'react-native-simple-toast';
import { getWidth } from '@/utils/ResponsiveFun';
import { setLoader } from '@/redux//actions/GeneralActions';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import { GeneralStyle } from '../../../constants/GeneralStyle';

const PhoneValidate = ({ navigation }) => {
  const user = useSelector((state) => state.auth.getProfileData);
  const token = useSelector((state) => state.auth.userToken);
  const [error, seterror] = React.useState();
  const [code, setCode] = useState(1234);

  const dispatch = useDispatch();
  const checkOtp = async (code) => {
    seterror(null);
    dispatch(setLoader(true));

    try {
      const res = await ApiCall({
        route: 'auth/verify-otp',
        params: { mode: 'phoneNumber', otp: code, email: user?.email },
        verb: 'patch',
      });
      if (res.status == '200') {
        dispatch(setLoader(false));
        Toast.show('Phone number Verified Sucessfuly', Toast.LONG);
        // dispatch(getProfile({ token, role: user?.role }));
        navigation.navigate('Bootombar');
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
      <Header
        title={'Verification'}
        leftView={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} />
          </TouchableOpacity>
        }
        RightView={<View style={{ width: getWidth(5) }} />}
      />

      <View style={{ alignItems: 'center', flex: 1 }}>
        <View style={styles.options}>
          <Text style={styles.title}>OTP has been sent!</Text>
          <Text style={styles.subTitle}>
            Enter the verification code we just sent to your Phone Number.
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
          text={'CONFIRM CODE'}
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
      </View>
    </View>
  );
};
export default PhoneValidate;
