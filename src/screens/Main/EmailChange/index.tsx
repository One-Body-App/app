import React, { useRef, useState } from 'react';
import { Text, View, TextInput as TextInputNative } from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import { useToast } from 'react-native-toast-notifications';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { StackScreenProps } from '@react-navigation/stack';
import { getHeight, getWidth } from '@/utils/ResponsiveFun';
import Header from '@/src/components/Header';
import Button from '@/src/components/Button';
import { styles } from './styles';
import { ApiCall } from '@/src/services/api';
import { validateFields } from '@/utils/validation/validate-fields';
import { setLoader } from '@/src/redux/actions/GeneralActions';
import validator from '@/utils/validation/validator';

import GeneralStatusBar from '@/src/components/GeneralStatusBar';
import { GeneralStyle } from '../../../constants/GeneralStyle';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { RootStackParamList } from '@/src/_Navigation/types';
import StyledText from '@/src/components/styled/Text';
import { button } from '@/src/styles/buttons';
import { spacing } from '@/src/styles/spacing';
import StyledTextInput from '@/src/components/styled/TextInput';
import { Colors } from '@/src/styles';

type Props = StackScreenProps<RootStackParamList, 'EmailChange'>;

function EmailChange({ navigation, route }: Props) {
  const dispatch = useDispatch();

  const userProfile = useSelector((state: RootState) => state.auth.getProfileData);

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

      if (
        !emailErrorValidation &&
        !emailErrorConfirmationValidation &&
        email == emailConfirmation
      ) {
        dispatch(setLoader(true));

        const res = await ApiCall({
          route: `auth/sendVerificationToChangeEmail`,
          token: userProfile?.token,
          verb: 'post',
          params: {
            newEmail: email,
          },
        });

        if (res?.status == 200) {
          navigation.pop(2);
          toast.show('Email updated successfully. Please check your email for confirmation.', {
            type: 'success',
            placement: 'top',
          });
        } else {
          setEmailConfirmationError(res.response.message);
        }
      } else {
        if (emailErrorValidation) setEmailError(emailErrorValidation);

        if (emailErrorConfirmationValidation)
          setEmailConfirmationError(emailErrorConfirmationValidation);
        else if (email != emailConfirmation)
          setEmailConfirmationError("Email and confirmation don't match");
      }
    } catch (e: any) {
      route.params.setError(e.message.replace('[auth/requires-recent-login] ', ''));

      navigation.goBack();
    }
  };

  return (
    <View style={{ flex: 1, paddingHorizontal: spacing.x24 }}>
      <KeyboardAwareScrollView style={styles.innerContainer}>
        <StyledTextInput
          ref={inputRefs.passwordN}
          value={email}
          label="New email"
          autoComplete="email"
          autoCapitalize="none"
          // right={<TextInput.Icon name="eye" size={20} color="#5B7279" />}

          returnKeyType="next"
          keyboardType="email-address"
          onSubmitEditing={() => inputRefs.passwordC.current?.focus()}
          onChangeText={(email) => setEmail(email)}
          blurOnSubmit={false}
        />
        <Text style={{ ...GeneralStyle.InputError, marginLeft: getWidth(9) }}>{emailError}</Text>

        <StyledTextInput
          ref={inputRefs.passwordC}
          value={emailConfirmation}
          returnKeyType="done"
          label="Confirm new email"
          autoComplete="email"
          autoCapitalize="none"
          keyboardType="email-address"
          // right={<TextInput.Icon name="eye" size={20} color="#5B7279" />}

          onSubmitEditing={() => emailUpdate()}
          onChangeText={(email) => setEmailConfirmation(email)}
          blurOnSubmit={false}
        />
        <Text style={{ ...GeneralStyle.InputError, marginLeft: getWidth(9) }}>
          {emailConfirmationError}
        </Text>

        {error != null ? (
          <View style={{ padding: 5, flexDirection: 'row' }}>
            <StyledText style={{ ...GeneralStyle.InputError }}>{error}</StyledText>
          </View>
        ) : null}

        <Button
          text="Update Email"
          onPress={() => {
            emailUpdate();
          }}
          disabled={!emailConfirmation || !email}
          wrapperViewBtnStyle={{ marginTop: spacing.x32 }}
          disabledBtnStyle={[
            button.primary,
            {
              flex: 1,
              opacity: 0.5,
            },
          ]}
          btnStyle={[
            button.primary,
            {
              flex: 1,
            },
          ]}
          btnTextStyle={{ color: '#FFF' }}
          disabledBtnTextStyle={{ color: '#FFF' }}
        />
      </KeyboardAwareScrollView>
    </View>
  );
}
export default EmailChange;
