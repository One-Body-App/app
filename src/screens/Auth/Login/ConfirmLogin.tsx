import React from 'react';
import { View } from 'react-native';

import LoginComponent from '@/components/LoginComponent';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import GradientHeader from '@/components/GradientHeader';
import { appColor } from '../../../constants';
import { styles } from './styles';
import { StackScreenProps } from '@react-navigation/stack';
import GoBackIcon from '@/src/Components/GoBackIcon';
import { RootStackParamList } from '@/src/Navigation/types';
import { useSelector } from 'react-redux';
import { RootState } from '@/src/Redux/reducers/rootReducer';

type Props = StackScreenProps<RootStackParamList, 'ConfirmLogin'>;

const ConfirmLogin = ({ route, navigation }: Props) => {
  const userProfile = useSelector((state: RootState) => state.auth.userData);

  return (
    <View style={styles.container}>
      <GeneralStatusBar
        backgroundColor={appColor.StatusBarColor}
        barStyle="light-content"
        hidden={false}
        translucent={true}
      />
      <GradientHeader title="Verify your info" />

      <LoginComponent
        showConfirmationEmailMessage={false}
        navigation={navigation}
        route={route}
        emailLoginOnly={true}
        currentUserEmail={userProfile?.email ?? ''}
        {...route.params}
      />

      <GoBackIcon color={'white'} />
    </View>
  );
};

export default ConfirmLogin;
