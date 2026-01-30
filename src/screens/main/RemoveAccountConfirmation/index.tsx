import React from 'react';
import { Text, View, Alert } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { LoginManager } from 'react-native-fbsdk-next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useToast } from 'react-native-toast-notifications';
import { useTheme } from '@react-navigation/native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Header from '@/components/Header';
import Button from '@/components/Button';
import { styles } from './styles';
import { setLoader } from '@/src/redux/actions/GeneralActions';
import { ApiCall } from '@/src/services/api';
import { logout } from '@/src/redux/actions/AuthActions';
import { clearAuthTokens } from '@/services/authTokens';
import GeneralStyle from '../../../constants/GeneralStyle';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { RootStackParamList } from '@/src/_Navigation/types';

import { SettingsStackParamsList } from '@/src/navigator/types';

type Props = NativeStackScreenProps<SettingsStackParamsList, 'RemoveAccountConfirmation'>;

function DeactivateAccountConfirm({ navigation, route }: Props) {
  const { reason } = route.params;

  const token = useSelector((state: RootState) => state.auth.userToken);
  const userProfile = useSelector((state: RootState) => state.auth.getProfileData);
  const dispatch = useDispatch();
  const toast = useToast();
  const { colors } = useTheme();
  const accountDeactivate = async () => {
    dispatch(setLoader(true));
    try {
      const res = await ApiCall({
        params: { reason },
        token,
        route: 'user/remove-account',
        verb: 'delete',
      });

      if (res?.status == 200) {
        toast.show('Account Removed Successfully', {
          placement: 'top',
          type: 'success',
        });

        dispatch(setLoader(false));
        LoginManager.logOut();
        await clearAuthTokens();
        dispatch(logout());
      } else {
        dispatch(setLoader(false));
      }
    } catch (e) {
      console.log('saga change pasword err --- ', e);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Header
        title="Remove account"
        leftView={
          <Ionicons onPress={() => navigation.goBack()} name="chevron-back-outline" size={20} />
        }
        RightView={<View style={{ width: getWidth(5) }} />}
      />
      <View style={styles.innerContainer}>
        <Text style={{ ...styles.heading, color: colors.text }}>You will be missed</Text>
        <Text style={styles.text}>
          We are sorry to see you go. Removing your account will erase all of the data we have
          stored about you and there is <Text style={{ color: '#E90202' }}>no recovery.</Text>
        </Text>
        <View style={{ marginTop: getHeight(7), width: '100%' }}>
          <Button
            text="REMOVE ACCOUNT"
            btnStyle={{
              ...GeneralStyle.btn,
              marginHorizontal: 20,
              backgroundColor: 'red',
            }}
            btnTextStyle={GeneralStyle.btnText}
            disabledBtnTextStyle={{
              ...GeneralStyle.btnText,
              marginHorizontal: 20,
              color: '#81979E',
            }}
            onPress={() => accountDeactivate()}
          />

          <Button
            text="Cancel"
            onPress={() => navigation.goBack()}
            btnStyle={{
              ...GeneralStyle.btn,
              marginHorizontal: 20,
              backgroundColor: colors.background,
              marginTop: 20,
            }}
            btnTextStyle={{
              ...styles.btnText,
              marginHorizontal: 20,
              color: '#126B87',
              fontSize: 14,
            }}
          />
        </View>
      </View>
    </View>
  );
}
export default DeactivateAccountConfirm;
