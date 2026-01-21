import React, { useEffect } from 'react';
import { Platform, ScrollView, StatusBar, useColorScheme, View } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '@react-navigation/native';

import LoginComponent from '@/components/loginComponent';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { getProfile } from '@/src/redux/actions/AuthActions';
import { MainStackParamList } from '@/src/navigator/types';
import UserStepsLayout from '../layout/UserStepsLayout';
import { Colors } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';

type Props = StackScreenProps<MainStackParamList, 'ConfirmLogin'>;

function ConfirmLogin({ route, navigation }: Props) {
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const profile = useSelector((state: RootState) => state.auth.getProfileData);
  const { dark, colors } = useTheme();
  const colorScheme = useColorScheme();
  const statusBarStyle = colorScheme === 'dark' ? 'light-content' : 'dark-content';

  useEffect(() => {
    if (token) {
      dispatch(getProfile.Request({ token }));
    }
  }, [dispatch, token]);

  useEffect(() => {
    if (profile?.emailVerified) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainRoot' as any }],
      });
    }
  }, [navigation, profile?.emailVerified]);

  return (
    <>
      {Platform.OS === 'ios' && <StatusBar barStyle={statusBarStyle} />}
      <UserStepsLayout
        backgroundColor={dark ? colors.background : Colors.neutral[700]}
        hideBottomText
        showCustomHeaderOnAndroid
      >
        <ScrollView style={{ flexGrow: 1, marginTop: spacing.x24 }}>
          <LoginComponent
            showConfirmationEmailMessage={route?.params?.showConfirmationEmailMessage ?? true}
            currentUserEmail={profile?.email ?? ''}
          />
          <View style={{ height: spacing.x24 }} />
        </ScrollView>
      </UserStepsLayout>
    </>
  );
}

export default ConfirmLogin;
