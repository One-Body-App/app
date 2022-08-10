import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Animated,
  Image,
  ImageBackground,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Avatar, Provider, TextInput } from 'react-native-paper';
import DropDown from 'react-native-paper-dropdown';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Header from '@/components/Header';
import Button from '@/components/Button';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles } from './styles';
import { useDispatch, useSelector } from 'react-redux';
import { ApiCall } from '@/services/api';
import { validateFields } from '@/utils/validation/validate-fields';
import { setLoader } from '@/redux//actions/GeneralActions';
import validator from '@/utils/validation/validator';
import Toast from 'react-native-simple-toast';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import { GernalStyle } from '../../../constants/GernalStyle';

const PasswordChange = ({ navigation }) => {
  const dispatch = useDispatch();
  const inputRefs = {
    password: useRef(null),
    passwordN: useRef(null),
    passwordC: useRef(null),
  };
  const [state, setState] = useState({
    password: '',
    passwordError: '',
    passwordN: '',
    passwordErrorN: '',
    passwordC: '',
    passwordErrorC: '',
  });

  const [error, seterror] = React.useState();
  const [hidePass, setHidePass] = useState(true);
  const [hidePassN, setHidePassN] = useState(true);
  const [hidePassC, setHidePassC] = useState(true);
  const token = useSelector((state) => state.auth.userToken);

  const PasswordUpdate = async () => {
    const { passwordC, passwordN, password } = state;
    const passwordError = await validator('password', password);
    const passwordErrorC = await validator('passwordC', passwordC);
    const passwordErrorN = await validator('passwordN', passwordN);

    if (!passwordErrorC && !passwordError && !passwordErrorN) {
      dispatch(setLoader(true));
      const data = { oldPassword: password, newPassword: passwordN };
      update(data);
    } else {
      setState({ ...state, passwordErrorN, passwordErrorC, passwordError });
    }
  };
  const update = async (param) => {
    try {
      const res = await ApiCall({
        route: 'user/change-password',
        token: token,
        params: param,
        verb: 'patch',
      });
      if (res?.status == '200') {
        navigation.goBack();
        Toast.show('Password Update Sucessfuly');
        dispatch(setLoader(false));
      } else {
        seterror(res?.data?.message);
        dispatch(setLoader(false));
      }
    } catch (e) {
      console.log('saga error -- ', e.toString());
    }
  };
  const changeHandler = (type, value) => setState({ ...state, [type]: value });
  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <GeneralStatusBar
        backgroundColor="white"
        barStyle="dark-content"
        hidden={false}
        translucent={true}
      />

      <Header
        title={'Change Password'}
        leftView={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back-outline" size={20} />
          </TouchableOpacity>
        }
        RightView={<View style={{ width: getWidth(5) }} />}
      />
      <View style={styles.innerContainer}>
        <TextInput
          theme={{ roundness: 10 }}
          activeOutlineColor={'#5B7279'}
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
          // right={<TextInput.Icon name="eye" size={20} color="#5B7279" />}
          style={GernalStyle.input}
          onFocus={() => setState({ ...state, passwordError: '' })}
          onBlur={() =>
            validateFields(state.password, 'password', (error) =>
              setState({ ...state, passwordError: error })
            )
          }
          onSubmitEditing={() => inputRefs.passwordN.current.focus()}
          onChangeText={(password) => changeHandler('password', password.trim())}
          blurOnSubmit={false}
        />
        <Text style={{ ...GernalStyle.InputError, marginLeft: getWidth(9) }}>
          {state.passwordError}
        </Text>

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
              name={() => (
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
          style={GernalStyle.input}
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
        <Text style={{ ...GernalStyle.InputError, marginLeft: getWidth(9) }}>
          {state.passwordErrorN}
        </Text>

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
              name={() => (
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
          style={GernalStyle.input}
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
        <Text style={{ ...GernalStyle.InputError, marginLeft: getWidth(9) }}>
          {state.passwordErrorC}
        </Text>

        {error != null ? (
          <View style={{ padding: 5, flexDirection: 'row' }}>
            <Text style={styles.errorview}>{error}</Text>
          </View>
        ) : null}

        <Button
          text={'SAVE'}
          btnStyle={{ ...GernalStyle.btn, marginTop: getHeight(4) }}
          btnTextStyle={GernalStyle.btnText}
          onPress={() => {
            PasswordUpdate();
          }}
        />
      </View>
    </View>
  );
};
export default PasswordChange;
