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
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { setLoginVerificationBackPage } from '@/src/Redux/actions/GeneralActions';
import auth from '@react-native-firebase/auth';
import { useTheme } from '@react-navigation/native';

type Props = StackScreenProps<RootStackParamList, 'ConfirmLogin'>;

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

  return (
    <View style={styles.container}>
      <GeneralStatusBar
        backgroundColor={appColor.StatusBarColor}
        barStyle="light-content"
        hidden={false}
        translucent={true}
      />

      <GradientHeader
        title="Verify your info"
        left={
          <View style={{ width: '100%', padding: 10 }}>
            <GoBackIcon color={'white'} />
          </View>
        }
      />

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
