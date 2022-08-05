import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Clipboard,
  ImageBackground,
} from 'react-native';
import React, { useState } from 'react';
import OTPInputView from '@twotalltotems/react-native-otp-input';
import { COLORS, THEME } from '../../constants';
import LinearGradient from 'react-native-linear-gradient';

const ConfirmPassword = (props) => {
  const [code, setCode] = useState('');
  return (
    // <View style={styles.container}>
    <ImageBackground
      resizeMode="cover"
      style={styles.container}
      source={require('@/assets/images/gradient.png')}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => props.navigation.goBack()}
          style={{ position: 'absolute', top: 40, left: 20 }}
        >
          <Image source={require('@/assets/icons/backBlack.png')} />
        </TouchableOpacity>
        <View style={styles.topView}>
          <Image style={styles.iconContainer} source={require('@/assets/icons/Bluelogo.png')} />
        </View>
        <View style={styles.options}>
          <Text style={styles.title}>Email has been sent</Text>
          <Text style={styles.subTitle}>We sent a code to your email</Text>
        </View>
        <View style={styles.inputContainer}>
          <OTPInputView
            pinCount={4}
            // autoFocusOnLoad
            code={code}
            // onCodeChanged={(code) => setCode(code)}
            codeInputFieldStyle={styles.underlineStyleBase}
            // placeholderTextColor='black'
            codeInputHighlightStyle={styles.underlineStyleHighLighted}
            // onCodeFilled = {(code => {
            //     console.log(`Code is ${code}, you are good to go!`)
            // })}
          />
        </View>
      </View>
      <View style={styles.buttonListLogin}>
        <View style={styles.buttonContainerLogin}>
          <TouchableOpacity
            onPress={() => props.navigation.navigate('newpassword')}
            style={styles.btnTitleLogin}
          >
            <Text style={styles.confermcodetext}>CONFIRM CODE</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={{ alignSelf: 'center' }}>
          <Text style={styles.resandtext}>Resend</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
    // </View>
  );
};

export default ConfirmPassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightWhite,
  },
  header: {
    flex: 0.6,
    justifyContent: 'center',
    marginTop: 20,
  },
  resandtext: { color: '#126B87', textAlign: 'center', marginTop: 30 },
  topView: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    flex: 0.6,
    marginTop: 30,
  },
  confermcodetext: { color: 'white', fontWeight: '700' },
  iconContainer: {
    // width: 130,
    // height: 120,
    // height:140,
  },
  title: {
    color: COLORS.darkblue,
    fontSize: 24,
    fontWeight: THEME.fontWeight.bold,
    marginTop: 30,
    textAlign: 'justify',
  },
  subTitle: {
    color: COLORS.darkblue,
    fontSize: 15,
    // fontWeight: THEME.fontWeight.bold,
    marginTop: 10,
  },
  options: {
    // justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  optionsText: {
    fontSize: 20,
    color: COLORS.lightWhite,
    fontWeight: '500',
    paddingBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    height: 50,
    borderRadius: 10,
    marginTop: 20,
    borderColor: COLORS.purple,
  },
  btnIcon: {
    width: 24,
    height: 24,
    marginHorizontal: 10,
  },
  btnTitle: {
    fontSize: 18,
    fontWeight: '500',
  },
  buttonList: {
    marginHorizontal: 30,
    justifyContent: 'center',
    flex: 0.5,
  },
  buttonListLogin: {
    marginHorizontal: 30,
    justifyContent: 'center',
    flex: 0.2,
    marginTop: 50,
  },
  footerText: {
    textAlign: 'center',
    color: COLORS.purple,
    fontWeight: '600',
    fontSize: 16,
  },
  footer: {
    height: 120,
  },

  buttonContainerLogin: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    height: 50,
    borderRadius: 10,
    // marginTop: 20,
    borderColor: COLORS.purple,
    backgroundColor: COLORS.btnBackground,
  },

  btnTitleLogin: {
    fontSize: 18,
    fontWeight: '500',
    paddingHorizontal: 80,
    height: 50,
    textAlignVertical: 'center',
    justifyContent: 'center',
    color: COLORS.lightWhite,
  },
  inputContainer: {
    // borderWidth: 1,
    height: 50,
    borderRadius: 10,
    // borderColor: COLORS.grey,
    justifyContent: 'center',
    marginTop: 100,
    marginHorizontal: 30,
  },
  inputContainerPassword: {
    borderWidth: 1,
    height: 50,
    borderRadius: 10,
    marginTop: 20,
    borderColor: COLORS.grey,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  input: {
    height: 30,
    margin: 10,
    width: '90%',
  },
  inputPassword: {
    height: 30,
    margin: 10,
    width: '85%',
  },
  alreadyAccountContainer: {
    alignSelf: 'center',
    marginTop: 30,
    flexDirection: 'row',
  },
  socialContainer: {
    height: 45,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'black',
    shadowOffset: { width: 1, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
    backgroundColor: COLORS.lightWhite,
    borderColor: COLORS.lightWhite,
    borderRadius: 10,
    width: '28%',
  },
  borderStyleBase: {
    width: 85,
    height: 50,
  },

  borderStyleHighLighted: {
    borderColor: 'red',
  },

  underlineStyleBase: {
    width: 75,
    color: 'black',
    height: 50,
    borderRadius: 10,
    borderColor: '#9EA1A2',
    borderWidth: 1,
    borderBottomWidth: 1,
  },

  underlineStyleHighLighted: {
    // borderColor: "green",
  },
});
