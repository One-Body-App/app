import React, { useRef, useState } from 'react';
import { Text, View, Image, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { validateFields } from '@/utils/validation/validate-fields';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import { getHeight, getWidth } from '@/utils/ResponsiveFun';
import GoBackIcon from '@/components/GoBackIcon';
import { signUpRequest } from '@/redux//actions/AuthActions';
import GradientHeader from '@/components/GradientHeader';
import validator from '@/utils/validation/validator';
import { setLoader } from '@/redux//actions/GeneralActions';
import LinearGradient from 'react-native-linear-gradient';
import { GernalStyle } from '../../../constants/GernalStyle';
import { useDispatch, useSelector } from 'react-redux';
import { TextInput } from 'react-native-paper';
import Button from '@/components/Button';
import { appColor } from '../../../constants';
import { styles } from './styles';
import auth from '@react-native-firebase/auth';

const SignupForm = ({ navigation, route }) => {
  const AccountType = useSelector((state) => state.general.accountType);
  const dispatch = useDispatch();

  const inputRefs = {
    email: useRef(null),
    password: useRef(null),
    cPassword: useRef(null),
    userName: useRef(null),
  };
  const [state, setState] = useState({
    email: '',
    emailError: '',
    password: '',
    passwordError: '',
    cPassword: '',
    cPasswordError: '',
    userName: '',
    userNameError: '',
  });
  const [error, seterror] = React.useState();
  const [hidePass, setHidePass] = useState(true);
  const [chidePass, setcHidePass] = useState(true);

  const signUpUser = async () => {
    const { email, password, userName, cPassword } = state;
    const emailError = await validator('email', email);
    const userNameError = await validator('userName', userName);
    const passwordError = await validator('password', password);
    const cPasswordError = await validator('cPassword', cPassword);

    if (!emailError && !passwordError && !userNameError && !cPasswordError) {
      if (password == cPassword) {
        dispatch(setLoader(true));
        const data = {
          email: email,
          password: password,
          userName: userName,
          role: AccountType,
        };
        auth()
          .createUserWithEmailAndPassword(email, password)
          .then(async (user) => {
            await user.user.sendEmailVerification();
            // user.user.updatePhoneNumber()

            navigation.navigate('PhoneValidateOtp');
          })
          .catch((error) => {
            if (error.code === 'auth/email-already-in-use') {
              seterror('That email address is already in use!');
              console.log('That email address is already in use!');
            }

            if (error.code === 'auth/invalid-email') {
              seterror('That email address is invalid!');
              console.log('That email address is invalid!');
            }

            console.error(error);
          });

        // dispatch(signUpRequest({ data, seterror, go }));
      } else {
        seterror('Both Password not match!');
      }
    } else {
      setState({
        ...state,
        emailError,
        passwordError,
        cPasswordError,
        userNameError,
      });
    }
  };

  const changeHandler = (type, value) => setState({ ...state, [type]: value });

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <GeneralStatusBar
        backgroundColor={appColor.StatusBarColor}
        barStyle="light-content"
        hidden={false}
        translucent={true}
      />

      <GradientHeader />

      <LinearGradient colors={['#fff', '#fff', '#E0EEF3']} style={styles.container}>
        <View style={styles.align}>
          <TextInput
            style={GernalStyle.input}
            theme={{ roundness: 10 }}
            ref={inputRefs.userName}
            value={state.userName}
            returnKeyType={'next'}
            mode="outlined"
            activeOutlineColor={appColor.InstructionColor}
            outlineColor={'#888C93'}
            label={'Username'}
            onFocus={() => setState({ ...state, userNameError: '' })}
            onBlur={() =>
              validateFields(state.userName, 'userName', (error) =>
                setState({ ...state, userNameError: error })
              )
            }
            onSubmitEditing={() => inputRefs.email.current.focus()}
            onChangeText={(userName) => changeHandler('userName', userName.trim())}
            blurOnSubmit={false}
            keyboardType="default"
            autoCapitalize="none"
          />
          <Text style={{ ...GernalStyle.InputError, marginLeft: getWidth(5) }}>
            {state.userNameError}
          </Text>

          <TextInput
            style={GernalStyle.input}
            theme={{ roundness: 10 }}
            ref={inputRefs.email}
            value={state.email}
            returnKeyType={'next'}
            keyboardType="email-address"
            mode="outlined"
            activeOutlineColor={appColor.InstructionColor}
            outlineColor={'#888C93'}
            label={'E-mail'}
            autoCorrect={false}
            onFocus={() => setState({ ...state, emailError: '' })}
            onBlur={() =>
              validateFields(state.email, 'email', (error) =>
                setState({ ...state, emailError: error })
              )
            }
            onSubmitEditing={() => inputRefs.password.current.focus()}
            onChangeText={(email) => changeHandler('email', email.trim())}
            blurOnSubmit={false}
            autoCapitalize="none"
          />
          <Text style={{ ...GernalStyle.InputError, marginLeft: getWidth(5) }}>
            {state.emailError}
          </Text>

          <TextInput
            theme={{ roundness: 10 }}
            activeOutlineColor={appColor.InstructionColor}
            outlineColor={'#888C93'}
            ref={inputRefs.password}
            value={state.password}
            returnKeyType={'next'}
            label={'Password'}
            mode="outlined"
            secureTextEntry={hidePass ? true : false}
            right={
              <TextInput.Icon
                name={() => (
                  <MaterialCommunityIcons
                    name={hidePass ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={'#5B7279'}
                    style={{
                      alignSelf: 'center',

                      marginTop: getHeight(1),
                    }}
                    onPress={() => setHidePass(!hidePass)}
                  />
                )}
              />
            }
            style={GernalStyle.input}
            onFocus={() => setState({ ...state, passwordError: '' })}
            onBlur={() =>
              validateFields(state.password, 'password', (error) =>
                setState({ ...state, passwordError: error })
              )
            }
            onSubmitEditing={() => inputRefs.cPassword.current.focus()}
            onChangeText={(password) => changeHandler('password', password)}
            blurOnSubmit={false}
          />
          <Text style={{ ...GernalStyle.InputError, marginLeft: getWidth(5) }}>
            {state.passwordError}
          </Text>

          <TextInput
            theme={{ roundness: 10 }}
            activeOutlineColor={appColor.InstructionColor}
            outlineColor={'#888C93'}
            ref={inputRefs.cPassword}
            value={state.cPassword}
            returnKeyType={'done'}
            label={'Confirm Password'}
            mode="outlined"
            secureTextEntry={chidePass ? true : false}
            right={
              <TextInput.Icon
                name={() => (
                  <MaterialCommunityIcons
                    name={chidePass ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={'#5B7279'}
                    style={{
                      alignSelf: 'center',

                      marginTop: getHeight(1),
                    }}
                    onPress={() => setcHidePass(!chidePass)}
                  />
                )}
              />
            }
            style={GernalStyle.input}
            onFocus={() => setState({ ...state, cPasswordError: '' })}
            onBlur={() =>
              validateFields(state.cPassword, 'cPassword', (error) =>
                setState({ ...state, cPasswordError: error })
              )
            }
            onSubmitEditing={() => signUpUser()}
            onChangeText={(cPassword) => changeHandler('cPassword', cPassword)}
            blurOnSubmit={false}
          />
          <Text style={{ ...GernalStyle.InputError, marginLeft: getWidth(5) }}>
            {state.cPasswordError}
          </Text>

          <Button
            text={'SIGN UP'}
            onPress={() => signUpUser()}
            btnTextStyle={GernalStyle.btnText}
            btnStyle={GernalStyle.btn}
          />
          {error != null ? (
            <View style={styles.singerrorview1}>
              <Text style={styles.singerrortext}>{error}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.center}>
          <Text style={styles.alreadyAccountContainer}>Already Have an account?</Text>
          <TouchableOpacity
            style={{ marginLeft: 5, marginTop: 20 }}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={{ ...styles.helight, textDecorationLine: 'underline' }}>Login</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <Image
        style={styles.footer}
        resizeMode="stretch"
        source={require('@/assets/images/waveBG.png')}
      />
      <View
        style={{
          ...styles.footer,
          justifyContent: 'center',
          alignItems: 'center',
          height: getHeight(9),
        }}
      >
        <Text style={styles.helight}>Unify the Body</Text>
        <Text style={{ color: 'gray', marginTop: 2 }}>1 Cor. 12:12</Text>
      </View>
      <GoBackIcon color={'white'} />
    </KeyboardAwareScrollView>
  );
};

export default SignupForm;
