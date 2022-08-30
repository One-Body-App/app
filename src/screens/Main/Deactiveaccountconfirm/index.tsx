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

const Deactivateaccountconfirm = ({ navigation, route }) => {
  const { reason } = route.params;
  const token = useSelector((state) => state.auth.userToken);
  const dispatch = useDispatch();
  const accountDeactivate = async () => {
    dispatch(setLoader(true));
    try {
      const res = await ApiCall({
        params: { reason: reason },
        token: token,
        route: 'user/deactivate-account',
        verb: 'patch',
      });

      if (res?.status == '200') {
        Alert.alert('Deactivate Account', res.data?.message);
        dispatch(setLoader(false));
        LoginManager.logOut();
        dispatch(logout());
      } else {
        dispatch(setLoader(false));
        console.log('error:', res);
      }
    } catch (e) {
      console.log('saga change pasword err --- ', e);
    }
  };
  return (
    <View style={{ flex: 1 }}>
      <GeneralStatusBar
        backgroundColor="white"
        barStyle="light-content"
        hidden={false}
        translucent={true}
      />
      <Header
        title={'Deactivate account'}
        leftView={
          <Ionicons onPress={() => navigation.goBack()} name="chevron-back-outline" size={20} />
        }
        RightView={<View style={{ width: getWidth(5) }} />}
      />
      <View style={styles.innerContainer}>
        <Text style={styles.heading}>You will be missed</Text>
        <Text style={styles.text}>
          We are sorry to see you go. Deactivating your account will erase all of the data we have
          stored about you and there is <Text style={{ color: '#E90202' }}>no recovery.</Text>{' '}
          Please spare a moment to let us know why you are leaving,
        </Text>
        <View style={{ marginTop: getHeight(7) }}>
          <Button
            text={'DEACTIVATE ACCOUNT'}
            btnStyle={{ ...GeneralStyle.btn, backgroundColor: 'red' }}
            btnTextStyle={GeneralStyle.btnText}
            onPress={() => accountDeactivate()}
          />
          <Text
            style={{
              color: '#126B87',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: 14,
              alignSelf: 'center',
              paddingTop: 20,
            }}
          >
            Cancel
          </Text>
        </View>
      </View>
    </View>
  );
};
export default Deactivateaccountconfirm;
