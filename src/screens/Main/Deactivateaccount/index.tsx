import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Header from '@/components/Header';
import Button from '@/components/Button';
import { styles } from './styles';
import { useDispatch, useSelector } from 'react-redux';
import { setLoader } from '@/redux//actions/GeneralActions';
import { ApiCall } from '@/services/api';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import { GeneralStyle } from '../../../constants/GeneralStyle';

const Deactivateaccount = ({ navigation }) => {
  const [reason, setReason] = useState(null);
  const token = useSelector((state) => state.auth.userToken);
  const dispatch = useDispatch();

  const sendOtp = async () => {
    dispatch(setLoader(true));
    try {
      const res = await ApiCall({
        route: 'user/send-otp',
        token: token,
        params: { mode: 'deactivate' },
        verb: 'patch',
      });
      if (res.status == '200') {
        dispatch(setLoader(false));
        navigation.navigate('Deactivateaccountotp', { reason: reason });
      } else {
        dispatch(setLoader(false));
      }
    } catch (e) {
      console.log('saga error -- ', e.toString());
    }
  };
  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <GeneralStatusBar
        backgroundColor="white"
        barStyle="dark-content"
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
          stored about you and there is
          <Text style={{ color: '#E90202' }}> no recovery.</Text> Please spare a moment to let us
          know why you are leaving,
        </Text>
        <View style={{ margin: getHeight(5) }}>
          <Button
            text={'I could not find what I was in search of.'}
            onPress={() => setReason('I could not find what I was in search of.')}
            btnStyle={[
              styles.btn,
              reason == 'I could not find what I was in search of.'
                ? { backgroundColor: '#032F3C' }
                : {
                    backgroundColor: 'white',
                    borderWidth: 0.5,
                    borderColor: 'gray',
                  },
            ]}
            btnTextStyle={[
              styles.btnText,
              reason == 'I could not find what I was in search of.'
                ? { color: 'white', fontSize: getFontSize(2) }
                : { color: '#757575', fontSize: getFontSize(2) },
            ]}
          />
          <Button
            text={'I do not use OneBody enough'}
            onPress={() => setReason('I do not use OneBody enough')}
            btnStyle={[
              styles.btn,
              reason == 'I do not use OneBody enough'
                ? { backgroundColor: '#032F3C' }
                : {
                    backgroundColor: 'white',
                    borderWidth: 0.5,
                    borderColor: 'gray',
                  },
            ]}
            btnTextStyle={[
              styles.btnText,
              reason == 'I do not use OneBody enough'
                ? { color: 'white', fontSize: getFontSize(2) }
                : { color: '#757575', fontSize: getFontSize(2) },
            ]}
          />
          <Button
            text={'I have found too many bugs in app'}
            onPress={() => setReason('I have found too many bugs in app')}
            btnStyle={[
              styles.btn,
              reason == 'I have found too many bugs in app'
                ? { backgroundColor: '#032F3C' }
                : {
                    backgroundColor: 'white',
                    borderWidth: 0.5,
                    borderColor: 'gray',
                  },
            ]}
            btnTextStyle={[
              styles.btnText,
              reason == 'I have found too many bugs in app'
                ? { color: 'white', fontSize: getFontSize(2) }
                : { color: '#757575', fontSize: getFontSize(2) },
            ]}
          />
          <Button
            text={'App consume a lot of battery'}
            onPress={() => setReason('App consume a lot of battery')}
            btnStyle={[
              styles.btn,
              reason == 'App consume a lot of battery'
                ? { backgroundColor: '#032F3C' }
                : {
                    backgroundColor: 'white',
                    borderWidth: 0.5,
                    borderColor: 'gray',
                  },
            ]}
            btnTextStyle={[
              styles.btnText,
              reason == 'App consume a lot of battery'
                ? { color: 'white', fontSize: getFontSize(2) }
                : { color: '#757575', fontSize: getFontSize(2) },
            ]}
          />
        </View>
        <View>
          <Button
            text={'DEACTIVATE ACCOUNT'}
            btnStyle={{
              ...GeneralStyle.btn,
              width: getWidth(85),
              backgroundColor: 'red',
            }}
            btnTextStyle={GeneralStyle.btnText}
            onPress={() => sendOtp()}
          />
          <Button
            text={'Cancel'}
            onPress={() => navigation.goBack()}
            btnStyle={{ ...styles.btn, backgroundColor: 'white' }}
            btnTextStyle={{ ...styles.btnText, color: '#126B87', fontSize: 14 }}
          />
        </View>
      </View>
    </View>
  );
};
export default Deactivateaccount;
