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
import { RootStackParamList } from '@/src/Navigation/types';

type Props = StackScreenProps<RootStackParamList, 'Login'>;

const Login = ({ route }: Props) => {
  console.log(route.params);
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
        oauthToken={route.params?.oauth_token}
        oauthVerifier={route.params?.oauth_verifier}
      />

      <GoBackIcon color={'white'} />
    </View>
  );
};

export default Login;
