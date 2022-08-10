import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import OTPInputView from '@twotalltotems/react-native-otp-input';
import { styles } from './styles';
import Header from '@/components/Header';
import Button from '@/components/Button';
import { ApiCall } from '@/services/api';
import { useDispatch, useSelector } from 'react-redux';
import { getHeight, getWidth } from '@/utils/ResponsiveFun';
import { setLoader } from '@/redux//actions/GeneralActions';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import { GernalStyle } from '../../../constants/GernalStyle';

const Deactivateaccountotp = ({ navigation, route }) => {
  const { reason } = route.params;

  const user = useSelector((state) => state.auth.userData);
  const token = useSelector((state) => state.auth.userToken);
  const [error, seterror] = React.useState();
  const [code, setCode] = React.useState();

  const dispatch = useDispatch();
  const checkOtp = async () => {
    seterror(null);
    dispatch(setLoader(true));

    try {
      const res = await ApiCall({
        route: 'auth/verify-otp',
        params: { mode: 'deactivate', otp: code, email: user?.email },
        verb: 'patch',
      });
      if (res.status == '200') {
        dispatch(setLoader(false));
        navigation.navigate('Deactivateaccountconfirm', { reason: reason });
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
        title={'Deactivate account'}
        leftView={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back-outline" size={20} />
          </TouchableOpacity>
        }
        RightView={<View style={{ width: getWidth(5) }} />}
      />
      <View style={styles.innerContainer}>
        {/* <Image
          style={{marginBottom: getHeight(5)}}
          source={require('@/assets/images/LogoMain.png')}></Image> */}

        <Text style={styles.headingFonts}>Check your Email or Phone</Text>
        <Text style={styles.text}>We sent a code on your email and phone number.</Text>

        <OTPInputView
          style={{
            width: '85%',
            height: 180,
          }}
          pinCount={4}
          autoFocusOnLoad={false}
          placeholderTextColor={styles.newcolor}
          codeInputFieldStyle={styles.underlineStyleBase}
          codeInputHighlightStyle={styles.underlineStyleHighLighted}
          onCodeFilled={(code) => {
            code != null ? setCode(code) : console.log('error');
          }}
        />
        {error != null ? (
          <View style={styles.otperrorvoew}>
            <View style={styles.otpsimpleview} />
            <Text style={styles.otptext}>{error}</Text>
          </View>
        ) : null}
        <Button
          text={'CONFIRM CODE'}
          btnStyle={GernalStyle.btn}
          btnTextStyle={GernalStyle.btnText}
          onPress={() => checkOtp(code)}
        />
        <Text
          style={{
            color: '#126B87',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: getHeight(2),
          }}
        >
          Resend Code?
        </Text>
      </View>
    </View>
  );
};
export default Deactivateaccountotp;
