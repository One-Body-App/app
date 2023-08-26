import React, { useRef, useState } from 'react';
import { Text, View, TouchableOpacity, TextInput as TextInputNative } from 'react-native';
import { TextInput } from 'react-native-paper';

import { getHeight, getWidth } from '@/utils/ResponsiveFun';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Header from '@/src/components/Header';
import Button from '@/src/components/Button';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles } from './styles';
import { useDispatch, useSelector } from 'react-redux';
import { ApiCall } from '@/services/api';
import { validateFields } from '@/utils/validation/validate-fields';
import { setLoader } from '@/redux//actions/GeneralActions';
import validator from '@/utils/validation/validator';
import { useToast } from 'react-native-toast-notifications';

import GeneralStatusBar from '@/src/components/GeneralStatusBar';
import { GeneralStyle } from '../../../constants/GeneralStyle';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '@/src/Navigation/types';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

type Props = StackScreenProps<RootStackParamList, 'PasswordChange'>;

const PasswordChange = ({ navigation, route }: Props) => {
  const dispatch = useDispatch();
  const inputRefs = {
    passwordN: useRef<TextInputNative>(null),
    passwordC: useRef<TextInputNative>(null),
  };
  const [state, setState] = useState({
    passwordError: '',
    passwordN: '',
    passwordErrorN: '',
    passwordC: '',
    passwordErrorC: '',
  });

  const [error, seterror] = React.useState();
  const [hidePassN, setHidePassN] = useState(true);
  const [hidePassC, setHidePassC] = useState(true);
  const toast = useToast();

  const PasswordUpdate = async () => {
    try {
      const { passwordC, passwordN } = state;
      const passwordErrorC = await validator('passwordC', passwordC);
      const passwordErrorN = await validator('passwordN', passwordN);

      if (!passwordErrorC && !passwordErrorN) {
        dispatch(setLoader(true));
        await auth().currentUser?.updatePassword(passwordN);
        navigation.pop(2);
        toast.show('Password updated successfully', {
          type: 'success',
          placement: 'top',
        });
      } else {
        setState({ ...state, passwordErrorN, passwordErrorC });
      }
    } catch (e: any) {
      route.params.setError(e.message.replace('[auth/requires-recent-login] ', ''));

      navigation.goBack();
    }
  };

  const changeHandler = (type: string, value: string) => setState({ ...state, [type]: value });
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
      <KeyboardAwareScrollView style={styles.innerContainer}>
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
          onFocus={() => setState({ ...state, passwordErrorN: '' })}
          onBlur={() =>
            validateFields(state.passwordN, 'passwordN', (error) =>
              setState({ ...state, passwordErrorN: error })
            )
          }
          onSubmitEditing={() => inputRefs.passwordC.current?.focus()}
          onChangeText={(passwordN) => changeHandler('passwordN', passwordN.trim())}
          blurOnSubmit={false}
        />
        <Text style={{ ...GeneralStyle.InputError, marginLeft: getWidth(9) }}>
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
        <Text style={{ ...GeneralStyle.InputError, marginLeft: getWidth(9) }}>
          {state.passwordErrorC}
        </Text>

        {error != null ? (
          <View style={{ padding: 5, flexDirection: 'row' }}>
            <Text style={styles.errorview}>{error}</Text>
          </View>
        ) : null}

        <Button
          text={'SAVE'}
          disabled={!state.passwordC || !state.passwordN}
          btnStyle={{ ...GeneralStyle.btn, marginTop: getHeight(4) }}
          disabledBtnStyle={{
            ...GeneralStyle.btn,
            marginTop: getHeight(4),
            backgroundColor: '#E6EAEC',
          }}
          disabledBtnTextStyle={GeneralStyle.btnText}
          btnTextStyle={GeneralStyle.btnText}
          onPress={() => {
            PasswordUpdate();
          }}
        />
      </KeyboardAwareScrollView>
    </View>
  );
};
export default PasswordChange;
