import React from 'react';
import { Text, View, Alert } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Header from '@/components/Header';
import Button from '@/components/Button';
import { styles } from './styles';
import { useDispatch, useSelector } from 'react-redux';
import { setLoader } from '@/redux//actions/GeneralActions';
import { ApiCall } from '@/services/api';
import { logout } from '@/redux//actions/AuthActions';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import { GeneralStyle } from '../../../constants/GeneralStyle';
import { LoginManager } from 'react-native-fbsdk-next';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/src/Navigation/types';
import auth from '@react-native-firebase/auth';
import { useToast } from 'react-native-toast-notifications';
import { useTheme } from 'react-native-paper';

type Props = NativeStackScreenProps<RootStackParamList, 'DeactivateAccountConfirm'>;

const DeactivateAccountConfirm = ({ navigation, route }: Props) => {
  const { reason } = route.params;

  const token = useSelector((state: RootState) => state.auth.userToken);
  const userProfile = useSelector((state: RootState) => state.auth.userProfile);
  const dispatch = useDispatch();
  const toast = useToast();
  const { colors } = useTheme();
  const accountDeactivate = async () => {
    dispatch(setLoader(true));
    try {
      const res = await ApiCall({
        params: { reason },
        token: token,
        route: 'user/remove-account',
        verb: 'patch',
      });

      if (res?.status == 200) {
        toast.show('Account Removed Successfully', {
          placement: 'top',
          type: 'success',
        });

        dispatch(setLoader(false));
        LoginManager.logOut();
        dispatch(logout());

        auth().currentUser?.delete();
        auth().signOut();
      } else {
        dispatch(setLoader(false));
      }
    } catch (e) {
      console.log('saga change pasword err --- ', e);
    }
  };
  console.log(userProfile);
  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <GeneralStatusBar
        backgroundColor="white"
        barStyle="dark-content"
        hidden={false}
        translucent={true}
      />
      <Header
        title={'Remove account'}
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
            text={'REMOVE ACCOUNT'}
            btnStyle={{
              ...GeneralStyle.btn,

              backgroundColor: 'red',
            }}
            btnTextStyle={GeneralStyle.btnText}
            disabledBtnTextStyle={{ ...GeneralStyle.btnText, color: '#81979E' }}
            onPress={() => accountDeactivate()}
          />

          <Button
            text={'Cancel'}
            onPress={() => navigation.goBack()}
            btnStyle={{ ...GeneralStyle.btn, backgroundColor: colors.background, marginTop: 20 }}
            btnTextStyle={{ ...styles.btnText, color: '#126B87', fontSize: 14 }}
          />
        </View>
      </View>
    </View>
  );
};
export default DeactivateAccountConfirm;
