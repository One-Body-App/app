import React, { useRef, useState } from 'react';
import { Text, View, Image, TouchableOpacity, Linking, Alert } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { validateFields } from '@/utils/validation/validate-fields';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import { getHeight, getWidth } from '@/utils/ResponsiveFun';
import GoBackIcon from '@/components/GoBackIcon';
import { setLoginData, signUpRequest } from '@/redux//actions/AuthActions';
import GradientHeader from '@/components/GradientHeader';
import validator from '@/utils/validation/validator';
import { setLoader } from '@/redux//actions/GeneralActions';
import LinearGradient from 'react-native-linear-gradient';
import { GeneralStyle } from '../../../constants/GeneralStyle';
import { useDispatch, useSelector } from 'react-redux';
import { TextInput } from 'react-native-paper';
import Button from '@/components/Button';
import { appColor } from '../../../constants';
import { styles } from './styles';
import auth from '@react-native-firebase/auth';
import CheckBox from '@react-native-community/checkbox';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { StackScreenProps } from '@react-navigation/stack';
import { ParamListBase } from '@react-navigation/native';
import { OpenURLButton, PRIVACY_POLICY_URL, TERMS_CONDITIONS_URL } from '@/src/Services/constants';

type Props = StackScreenProps<ParamListBase, 'SignupForm'>;

const SignupForm = ({ navigation }: Props) => {
  const AccountType = useSelector((state) => state.general.accountType);
  const dispatch = useDispatch();

  const inputRefs = {
    email: useRef(null),
    password: useRef(null),
    cPassword: useRef(null),
    name: useRef(null),
  };
  const [state, setState] = useState({
    email: '',
    emailError: '',
    password: '',
    passwordError: '',
    cPassword: '',
    cPasswordError: '',
    name: '',
    nameError: '',
  });
  const [error, seterror] = React.useState();
  const [hidePass, setHidePass] = useState(true);
  const [chidePass, setcHidePass] = useState(true);

  const signUpUser = async () => {
    const { email, password, name, cPassword } = state;
    const emailError = await validator('email', email);
    const nameError = await validator('name', name);
    const passwordError = await validator('password', password);
    const cPasswordError = await validator('cPassword', cPassword);

    if (!emailError && !passwordError && !nameError && !cPasswordError) {
      if (password == cPassword) {
        const data = {
          email: email,
          name: name,
          role: AccountType,
          userId: '',
        };
        auth()
          .createUserWithEmailAndPassword(email, password)
          .then(async (user) => {
            // await user.user.sendEmailVerification();
            // const token = await user.user.getIdToken();
            // user.user.updatePhoneNumber()
            data.userId = user.user.uid;

            dispatch(setLoginData({ token: await user.user.getIdToken() }));
            dispatch(
              signUpRequest({
                data,
                seterror,
                go: () =>
                  navigation.reset({
                    index: 0,
                    routes: [
                      { name: 'SignUp' },
                      { name: 'Login', params: { showConfirmationEmailMessage: true } },
                    ],
                  }),
              })
            );
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

        //
      } else {
        seterror('Both Password not match!');
      }
    } else {
      setState({
        ...state,
        emailError,
        passwordError,
        cPasswordError,
        nameError,
      });
    }
  };

  const changeHandler = (type, value) => setState({ ...state, [type]: value });

  return (
    <View style={styles.container}>
      <GeneralStatusBar
        backgroundColor={appColor.StatusBarColor}
        barStyle="light-content"
        hidden={false}
        translucent={true}
      />

      <GradientHeader />
      <KeyboardAwareScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#fff', '#fff', '#E0EEF3']}
          style={{ flex: 1, paddingBottom: 110 }}
        >
          <View style={{ paddingHorizontal: 25, paddingVertical: 15, flex: 1 }}>
            <TextInput
              style={GeneralStyle.input}
              theme={{ roundness: 10 }}
              ref={inputRefs.name}
              value={state.name}
              returnKeyType={'next'}
              mode="outlined"
              activeOutlineColor={appColor.InstructionColor}
              outlineColor={'#888C93'}
              label={'Your Name'}
              onFocus={() => setState({ ...state, nameError: '' })}
              onBlur={() =>
                validateFields(state.name, 'name', (error) =>
                  setState({ ...state, nameError: error })
                )
              }
              onSubmitEditing={() => inputRefs.name.current.focus()}
              onChangeText={(name) => changeHandler('name', name)}
              blurOnSubmit={false}
              keyboardType="default"
              autoCapitalize="words"
            />
            <Text style={{ ...GeneralStyle.InputError, marginLeft: getWidth(5) }}>
              {state.nameError}
            </Text>

            <TextInput
              style={GeneralStyle.input}
              theme={{ roundness: 10 }}
              ref={inputRefs.email}
              value={state.email}
              returnKeyType={'next'}
              keyboardType="email-address"
              mode="outlined"
              activeOutlineColor={appColor.InstructionColor}
              outlineColor={'#888C93'}
              label={'Your e-mail'}
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
            <Text style={{ ...GeneralStyle.InputError, marginLeft: getWidth(5) }}>
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
              style={GeneralStyle.input}
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
            <Text style={{ ...GeneralStyle.InputError, marginLeft: getWidth(5) }}>
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
              style={GeneralStyle.input}
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
            <Text style={{ ...GeneralStyle.InputError, marginLeft: getWidth(5) }}>
              {state.cPasswordError}
            </Text>

            <View style={{ ...styles.center, paddingBottom: 20 }}>
              <Text style={{ color: '#032F3C' }}>By signing up, you agree to our</Text>
              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity onPress={() => OpenURLButton(PRIVACY_POLICY_URL)}>
                  <Text style={styles.text}>User Agreements</Text>
                </TouchableOpacity>
                <Text style={styles.simpleText}> & </Text>
                <TouchableOpacity onPress={() => OpenURLButton(TERMS_CONDITIONS_URL)}>
                  <Text style={styles.text}>Privacy Policy</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Button
              text={'SIGN UP'}
              onPress={() => signUpUser()}
              btnTextStyle={GeneralStyle.btnText}
              btnStyle={GeneralStyle.btn}
            />
            {error != null ? (
              <View style={styles.singerrorview1}>
                <Text style={styles.singerrortext}>{error}</Text>
              </View>
            ) : null}
          </View>
        </LinearGradient>

        <View>
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
        </View>
      </KeyboardAwareScrollView>

      <GoBackIcon color={'white'} />
    </View>
  );
};

export default SignupForm;
