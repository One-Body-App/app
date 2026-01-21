import React from 'react';
import { Alert, View, ViewStyle } from 'react-native';

import Button from '../Button';
import G from '@/assets/svg/G.svg';
import Apple from '@/assets/svg/Apple.svg';
import { styles } from './styles';

interface Props {
  errorFromLogin?: string;
  socialLogin: Function;
  navigation?: any;
  route?: any;
  disabled?: boolean;
  wrapperStyles?: ViewStyle;
}

function SignupButtons({ disabled, wrapperStyles }: Props) {
  const handleUnavailable = () => {
    Alert.alert(
      'Coming soon',
      'Social sign-in is temporarily unavailable while we migrate authentication. Please use email/password.'
    );
  };

  return (
    <View style={[styles.buttonList, wrapperStyles]}>
      <Button
        disabled={disabled}
        text="Google"
        leftIcon={<G height={40} />}
        btnStyle={styles.buttonContainer}
        btnTextStyle={styles.btnTitle}
        onPress={handleUnavailable}
        wrapperViewBtnStyle={styles.buttonsWrapper}
      />
      <Button
        disabled={disabled}
        text="Apple"
        leftIcon={<Apple height={40} />}
        btnStyle={styles.buttonContainer}
        btnTextStyle={styles.btnTitle}
        onPress={handleUnavailable}
        wrapperViewBtnStyle={styles.buttonsWrapper}
      />
    </View>
  );
}

export default SignupButtons;
