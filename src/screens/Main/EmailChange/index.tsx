import React, { useRef, useState } from 'react';
import { Text, View, TouchableOpacity, TextInput as TextInputNative } from 'react-native';
import { TextInput } from 'react-native-paper';

import { getHeight, getWidth } from '@/utils/ResponsiveFun';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Header from '@/components/Header';
import Button from '@/components/Button';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles } from './styles';
import { useDispatch, useSelector } from 'react-redux';
import { ApiCall } from '@/services/api';
import { validateFields } from '@/utils/validation/validate-fields';
import { setLoader } from '@/redux//actions/GeneralActions';
import validator from '@/utils/validation/validator';
import { useToast } from 'react-native-toast-notifications';

import GeneralStatusBar from '@/components/GeneralStatusBar';
import { GeneralStyle } from '../../../constants/GeneralStyle';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '@/src/Navigation/types';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

type Props = StackScreenProps<RootStackParamList, 'EmailChange'>;

const EmailChange = ({ navigation, route }: Props) => {
  const dispatch = useDispatch();

  const userProfile = useSelector((state: RootState) => state.auth.userProfile);
  console.log(userProfile);
  const inputRefs = {
    passwordN: useRef<TextInputNative>(null),
    passwordC: useRef<TextInputNative>(null),
  };

  const [error, seterror] = React.useState();
  const [email, setEmail] = React.useState('');
  const [emailConfirmation, setEmailConfirmation] = React.useState('');
  const [emailError, setEmailError] = React.useState('');
  const [emailConfirmationError, setEmailConfirmationError] = React.useState('');

  const toast = useToast();

  const emailUpdate = async () => {
    try {
      const emailErrorValidation = await validator('email', email);
      const emailErrorConfirmationValidation = await validator(
        'emailConfirmation',
        emailConfirmation
      );

      if (!emailErrorValidation && !emailErrorConfirmationValidation) {
        dispatch(setLoader(true));
        await auth().currentUser?.updateEmail(email);

        const res = await ApiCall({
          route: `${userProfile?.role}/update-profile`,
          token: userProfile?.token,
          verb: 'patch',
          params: {
            email,
          },
        });
        console.log(res);
        if (res?.status == 200) {
          navigation.pop(2);
          toast.show('Email updated successfully', {
            type: 'success',
            placement: 'top',
          });
          await ApiCall({
            route: `auth/sendVerificationEmail`,
            token: userProfile?.token,
            verb: 'post',
          });
          // await auth().currentUser?.sendEmailVerification();
        } else {
          setEmailError(res?.response.error);
        }
      } else {
        setEmailError(emailErrorValidation);
        setEmailConfirmationError(emailErrorConfirmationValidation);
      }
    } catch (e: any) {
      console.log(e);
      route.params.setError(e.message.replace('[auth/requires-recent-login] ', ''));

      navigation.goBack();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <GeneralStatusBar
        backgroundColor="white"
        barStyle="dark-content"
        hidden={false}
        translucent={true}
      />

      <Header
        title={'Change Email'}
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
          value={email}
          returnKeyType={'next'}
          label={'New email'}
          mode="outlined"
          // right={<TextInput.Icon name="eye" size={20} color="#5B7279" />}
          style={GeneralStyle.input}
          onSubmitEditing={() => inputRefs.passwordC.current?.focus()}
          onChangeText={(email) => setEmail(email)}
          blurOnSubmit={false}
        />
        <Text style={{ ...GeneralStyle.InputError, marginLeft: getWidth(9) }}>{emailError}</Text>

        <TextInput
          theme={{ roundness: 10 }}
          activeOutlineColor={'#5B7279'}
          ref={inputRefs.passwordC}
          value={emailConfirmation}
          returnKeyType={'done'}
          label={'Confirm new email'}
          mode="outlined"
          // right={<TextInput.Icon name="eye" size={20} color="#5B7279" />}
          style={GeneralStyle.input}
          onSubmitEditing={() => emailUpdate()}
          onChangeText={(email) => setEmailConfirmation(email)}
          blurOnSubmit={false}
        />
        <Text style={{ ...GeneralStyle.InputError, marginLeft: getWidth(9) }}>
          {emailConfirmationError}
        </Text>

        {error != null ? (
          <View style={{ padding: 5, flexDirection: 'row' }}>
            <Text style={styles.errorview}>{error}</Text>
          </View>
        ) : null}

        <Button
          text={'SAVE'}
          disabled={!emailConfirmation || !email}
          btnStyle={{ ...GeneralStyle.btn, marginTop: getHeight(4) }}
          disabledBtnStyle={{
            ...GeneralStyle.btn,
            marginTop: getHeight(4),
            backgroundColor: '#E6EAEC',
          }}
          disabledBtnTextStyle={GeneralStyle.btnText}
          btnTextStyle={GeneralStyle.btnText}
          onPress={() => {
            emailUpdate();
          }}
        />
      </KeyboardAwareScrollView>
    </View>
  );
};
export default EmailChange;
