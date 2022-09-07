import React from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import LoginComponent from '@/components/LoginComponent';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import GradientHeader from '@/components/GradientHeader';
import { appColor } from '../../../constants';
import { styles } from './styles';
import { StackScreenProps } from '@react-navigation/stack';
import { ParamListBase } from '@react-navigation/native';
import GoBackIcon from '@/src/Components/GoBackIcon';

type params = {
  Login: {
    showConfirmationEmailMessage?: boolean;
  };
};

type Props = StackScreenProps<params, 'Login'>;

const Login = ({ route }: Props) => {
  return (
    <View style={styles.container}>
      <GeneralStatusBar
        backgroundColor={appColor.StatusBarColor}
        barStyle="light-content"
        hidden={false}
        translucent={true}
      />
      <GradientHeader title="Log In" />

      <LoginComponent
        showConfirmationEmailMessage={route.params?.showConfirmationEmailMessage ?? false}
      />

      <GoBackIcon color={'white'} />
    </View>
  );
};

export default Login;
