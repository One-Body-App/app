import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import LoginComponent from '@/src/components/LoginComponent';
import GeneralStatusBar from '@/src/components/GeneralStatusBar';
import GradientHeader from '@/src/components/GradientHeader';
import { appColor } from '../../constants';
import { styles } from './styles';
import { StackScreenProps } from '@react-navigation/stack';
import GoBackIcon from '@/src/components/GoBackIcon';
import { RootStackParamList } from '@/src/Navigation/types';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { setLoginVerificationBackPage } from '@/src/Redux/actions/GeneralActions';
import auth from '@react-native-firebase/auth';
import { useTheme } from '@react-navigation/native';
import NewPassword from '../newPassword/NewPassword';
import { SettingsStackParamsList } from '@/src/navigator/types';

type Props = StackScreenProps<SettingsStackParamsList, 'ConfirmLogin'>;

const ConfirmLogin = ({ route, navigation }: Props) => {
  const [enabledLoginProviders, setEnabledLoginProviders] = useState<string[]>();

  const authReducer = useSelector((state: RootState) => state.auth);
  const userData = useSelector((state: RootState) => state.auth.userData);
  const dispatch = useDispatch();
  const { colors } = useTheme();

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: false });
    dispatch(
      setLoginVerificationBackPage(route.params?.toScreen, route.params?.toScreenRouteParams)
    );
    if (authReducer.userData?.email) {
      const getSignInMethods = async () => {
        const providers = await auth().fetchSignInMethodsForEmail(
          authReducer.userData?.email ?? ''
        );

        setEnabledLoginProviders(providers);
      };
      getSignInMethods();
    }
  }, []);

  if (route?.params?.mode == 'resetPassword') {
    return <NewPassword navigation={navigation} route={route} {...route.params} />;
  }

  return (
    <View style={styles.container}>
      <LoginComponent
        showConfirmationEmailMessage={false}
        navigation={navigation}
        route={route}
        verifyAccount={true}
        currentUserEmail={userData?.email ?? ''}
        enabledLoginProviders={enabledLoginProviders}
        {...route.params}
      />
    </View>
  );
};

export default ConfirmLogin;
