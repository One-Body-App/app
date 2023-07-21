import { StyleSheet, Text, View, Image, TouchableOpacity, ImageBackground } from 'react-native';
import React, { useRef, useState } from 'react';
import { appColor, COLORS, THEME } from '../../constants';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import Logo from '@/assets/svg/LogoBlue.svg';
import { GeneralStyle } from '../../constants/GeneralStyle';
import Icon from 'react-native-vector-icons/Ionicons';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Button from '../../Components/Button';
import { TextInput } from 'react-native-paper';
import { validateFields } from '@/utils/validation/validate-fields';
import LinearGradient from 'react-native-linear-gradient';
import { ApiCall } from '@/services/api';
import validator from '@/utils/validation/validator';
import { useDispatch } from 'react-redux';
import { setLoader } from '@/redux/actions/GeneralActions';
import Toast from 'react-native-simple-toast';
import GoBackIcon from '@/src/Components/GoBackIcon';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

const NewPassword = ({ navigation, route }) => {
  const { email } = route.params;
  const dispatch = useDispatch();
  const inputRefs = {
    passwordN: useRef(null),
    passwordC: useRef(null),
  };
  const [state, setState] = useState({
    passwordN: '',
    passwordErrorN: '',
    passwordC: '',
    passwordErrorC: '',
  });

  const [error, seterror] = React.useState<string>();
  const [hidePassN, setHidePassN] = useState(true);
  const [hidePassC, setHidePassC] = useState(true);
  const changeHandler = (type, value) => setState({ ...state, [type]: value });

  const PasswordUpdate = async () => {
    const { passwordC, passwordN } = state;

    const passwordErrorC = await validator('passwordC', passwordC);
    const passwordErrorN = await validator('passwordN', passwordN);

    if (!passwordErrorC && !passwordErrorN) {
      dispatch(setLoader(true));
      console.log(route.params.oobCode);

      if (passwordC == passwordN) {
        try {
          const result = await auth().checkActionCode(route.params.oobCode);

          if (result.operation == 'PASSWORD_RESET') {
            await auth().confirmPasswordReset(route.params.oobCode, passwordN);

            const res = await ApiCall({
              route: 'auth/sendPasswordChangeConfirmation',
              params: { email: result.data.email },
              verb: 'post',
            });

            navigation.navigate('Login');
            Toast.show('Password Reset Sucessfuly');
            dispatch(setLoader(false));
          }
        } catch (e) {
          seterror('Expired code, please try again.');
          console.log('saga error -- ', e.toString());
        }
      } else {
        seterror('Both passwords MUST match!');
      }
    } else {
      setState({ ...state, passwordErrorN, passwordErrorC });
    }
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <GeneralStatusBar
        backgroundColor="white"
        barStyle="dark-content"
        hidden={false}
        translucent={true}
      />

      <LinearGradient style={{ flex: 1 }} colors={['#fff', '#fff', '#E0EEF3']}>
        <Logo
          height={getHeight(17)}
          width={getWidth(50)}
          style={{ marginTop: 20, alignSelf: 'center' }}
        />
        <View style={styles.options}>
          <Text style={styles.title}>New Password</Text>
          <Text style={styles.subTitle}>Create your new passsword</Text>
        </View>

        <View style={{ margin: getHeight(5) }}>
          <TextInput
            theme={{ roundness: 10 }}
            activeOutlineColor={'#5B7279'}
            ref={inputRefs.passwordN}
            value={state.passwordN}
            returnKeyType={'next'}
            label={'New Password'}
            mode="outlined"
            secureTextEntry={hidePassN ? true : false}
            right={
              <TextInput.Icon
                icon={() => (
                  <MaterialCommunityIcons
                    name={hidePassN ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={'#5B7279'}
                    style={{
                      alignSelf: 'center',

                      marginTop: getHeight(1),
                    }}
                    onPress={() => setHidePassN(!hidePassN)}
                  />
                )}
              />
            }
            // right={<TextInput.Icon name="eye" size={20} color="#5B7279" />}
            style={GeneralStyle.input}
            placeholder="New Password"
            onFocus={() => setState({ ...state, passwordErrorN: '' })}
            onBlur={() =>
              validateFields(state.passwordN, 'passwordN', (error) =>
                setState({ ...state, passwordErrorN: error })
              )
            }
            onSubmitEditing={() => inputRefs.passwordC.current.focus()}
            onChangeText={(passwordN) => changeHandler('passwordN', passwordN.trim())}
            blurOnSubmit={false}
          />
          <Text style={{ ...GeneralStyle.InputError, marginLeft: 0 }}>{state.passwordErrorN}</Text>

          <TextInput
            theme={{ roundness: 10 }}
            activeOutlineColor={'#5B7279'}
            ref={inputRefs.passwordC}
            value={state.passwordC}
            returnKeyType={'done'}
            label={'Confirm Password'}
            mode="outlined"
            secureTextEntry={hidePassC ? true : false}
            right={
              <TextInput.Icon
                icon={() => (
                  <MaterialCommunityIcons
                    name={hidePassC ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={'#5B7279'}
                    style={styles.hidepicc}
                    onPress={() => setHidePassC(!hidePassC)}
                  />
                )}
              />
            }
            // right={<TextInput.Icon name="eye" size={20} color="#5B7279" />}
            style={GeneralStyle.input}
            placeholder="Confirm Password"
            onFocus={() => setState({ ...state, passwordErrorC: '' })}
            onBlur={() =>
              validateFields(state.passwordC, 'passwordC', (error) =>
                setState({ ...state, passwordErrorC: error })
              )
            }
            onSubmitEditing={() => PasswordUpdate()}
            onChangeText={(passwordC) => changeHandler('passwordC', passwordC.trim())}
            blurOnSubmit={false}
          />
          <Text style={{ ...GeneralStyle.InputError, marginLeft: 0 }}>{state.passwordErrorC}</Text>
        </View>
        <Button
          text={'CHANGE PASSWORD'}
          onPress={() => {
            PasswordUpdate();
          }}
          mode="contained"
          paper
          btnStyle={{ marginHorizontal: 30 }}
        />
        <Button
          text={'Cancel'}
          onPress={() => {
            navigation.goBack();
          }}
          paper
          mode="text"
          btnStyle={{ marginHorizontal: 30, marginTop: 10 }}
        />

        <GoBackIcon color={'white'} />
      </LinearGradient>
    </KeyboardAwareScrollView>
  );
};
const styles = StyleSheet.create({
  container: {},
  options: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: getHeight(8),
  },
  title: {
    color: appColor.PrimaryColor,
    fontSize: getFontSize(3.2),
    fontFamily: 'Rubik-Medium',
    textAlign: 'justify',
  },
  subTitle: {
    color: appColor.InstructionColor,
    fontSize: 16,
    marginTop: 10,
    marginHorizontal: 40,
    lineHeight: 19,
    textAlign: 'center',
  },
  borderStyleHighLighted: {
    borderColor: '#03DAC6',
    color: appColor.PrimaryColor,
  },
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  underlineStyleBase: {
    borderWidth: 1,
    width: 70,
    height: 50,
    borderRadius: 10,
    borderColor: '#032F3C',
  },

  underlineStyleHighLighted: {
    borderColor: 'red',
    // borderColor: '#03DAC6',
  },
});

export default NewPassword;
