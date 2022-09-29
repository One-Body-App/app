import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import LoginComponent from '@/components/LoginComponent';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import GradientHeader from '@/components/GradientHeader';
import { appColor } from '../../../constants';
import { styles } from './styles';
import { StackScreenProps } from '@react-navigation/stack';
import GoBackIcon from '@/src/Components/GoBackIcon';
import { RootStackParamList } from '@/src/Navigation/types';
import axios from 'axios';
import { processLogin } from '@/src/Services/login';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { setAccountType, setLoader } from '@/src/Redux/actions/GeneralActions';
import { requestUserPermission } from '@/src/Services/Notification/notificationServices';

type Props = StackScreenProps<RootStackParamList, 'Login'>;

const Login = ({ route, navigation }: Props) => {
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
        navigation={navigation}
        route={route}
        {...route.params}
      />

      <GoBackIcon color={'white'} />
    </View>
  );
};

export default Login;
