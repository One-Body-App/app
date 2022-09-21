import React, { useEffect, useState } from 'react';
import { Text, View, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Button from '../Button';
import { setLoader, setPrayers } from '@/redux/actions/GeneralActions';
import { styles } from './styles';
import { ApiCall } from '@/services/api';
import Toast from 'react-native-simple-toast';
import { getAllPrayer, getMyPrayer, getTestimonies } from '@/redux/actions/PrayerAction';

const PrayerInputType = ({ color }) => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.userToken);
  const user = useSelector((state) => state.auth.userProfile);
  const prayers = useSelector((state) => state.general.prayers);
  const [prayerTypeShow, setPrayerTypeShow] = useState(false);
  const [payerType, setPrayerType] = useState(null);
  const [prayer, setPrayer] = useState('');
  const [error, seterror] = React.useState();

  const ValidatePrayer = () => {
    if (prayer != null && payerType != null) {
      if (prayer.length <= 150 && prayer != '') {
        seterror(null);
        createPrayer();
      } else {
        seterror('prayer text must be within 1 to 150.');
      }
    } else {
      if (prayer == null && prayer == '') {
        seterror('prayer required!');
      }
      if (payerType == null) {
        setPrayerTypeShow(true);
        seterror('prayer type is required!');
      }
    }
  };

  const createPrayer = async () => {
    dispatch(setLoader(true));
    if (payerType == 'answer') {
      dispatch(setLoader(true));
      try {
        const res = await ApiCall({
          params: { answer: prayer },
          token: token,
          route: 'prayers/answer-prayer',
          verb: 'patch',
        });

        if (res?.status == '200') {
          dispatch(setLoader(false));
          setPrayerTypeShow(false);
          setPrayerType(null);
          setPrayer('');
          dispatch(
            getMyPrayer({
              pageno: 1,
              token: token,
            })
          );
          dispatch(
            getTestimonies({
              pageno: 1,
              token: token,
            })
          );

          dispatch(
            getAllPrayer({
              pageno: 1,
              token: token,
            })
          );
          //  Toast.show('Answer submit Sucessfuly')
        } else {
          console.log('error', res?.response);
          dispatch(setLoader(false));
        }
      } catch (e) {
        console.log('saga change pasword err --- ', e);
      }
    } else {
      try {
        const res = await ApiCall({
          params: { prayer: prayer, prayerType: payerType },
          token: token,
          route: 'prayers/new-prayer',
          verb: 'post',
        });

        if (res?.status == '200') {
          dispatch(setLoader(false));
          setPrayerTypeShow(false);
          setPrayerType(null);
          setPrayer('');
          Toast.show(res?.response?.message);

          dispatch(
            getMyPrayer({
              pageno: 1,
              token: token,
            })
          );
          dispatch(
            getAllPrayer({
              pageno: 1,
              token: token,
            })
          );
        } else {
          console.log('error', res?.response);
        }
      } catch (e) {
        console.log('saga change pasword err --- ', e);
      }
    }
  };

  return (
    <View>
      {prayerTypeShow ? (
        <ScrollView showsHorizontalScrollIndicator={false} horizontal={true}>
          <View style={styles.prayerTypeView}>
            <Button
              btnStyle={payerType == 'anonymous' ? styles.btnSelected : styles.btn}
              btnTextStyle={payerType == 'anonymous' ? { color: 'white' } : { color: '#5B7279' }}
              text={'Anonymous'}
              onPress={() => setPrayerType('anonymous')}
            />
            <Button
              btnStyle={payerType == 'prayer-request' ? styles.btnSelected : styles.btn}
              btnTextStyle={
                payerType == 'prayer-request' ? { color: 'white' } : { color: '#5B7279' }
              }
              text={'Prayer Request'}
              onPress={() => setPrayerType('prayer-request')}
            />
            <Button
              btnStyle={payerType == 'exhortation' ? styles.btnSelected : styles.btn}
              btnTextStyle={payerType == 'exhortation' ? { color: 'white' } : { color: '#5B7279' }}
              text={'Exhortation'}
              onPress={() => setPrayerType('exhortation')}
            />
            <Button
              btnStyle={payerType == 'answer' ? styles.btnSelected : styles.btn}
              btnTextStyle={payerType == 'answer' ? { color: 'white' } : { color: '#5B7279' }}
              text={'Testimonies'}
              onPress={() => setPrayerType('answer')}
            />
          </View>
        </ScrollView>
      ) : null}
      <View style={styles.ModelInputView}>
        <TextInput
          placeholderTextColor={color}
          value={prayer}
          placeholder="  Share what God is doing in your life"
          // onPressIn={() => setPrayerTypeShow(true)}
          onFocus={() => setPrayerTypeShow(true)}
          onChangeText={(e) => {
            prayer.length < 150 ? setPrayer(e) : null;
            seterror(null);
          }}
          multiline={true}
          style={{
            ...styles.TextInput,
            color: color,
            backgroundColor: '#f6f6f6',
            borderWidth: 0,
          }}
        />

        <TouchableOpacity
          onPress={() => {
            ValidatePrayer();
          }}
          style={styles.Button}
        >
          <Ionicons name="send" size={20} color="#032F3C" />
        </TouchableOpacity>
      </View>
      {prayer != '' && error == null ? (
        <Text
          style={{
            color: color,
            paddingLeft: getWidth(5),
            marginBottom: getHeight(1),
          }}
        >
          {prayer != '' ? prayer.length : null}/150 Characters left
        </Text>
      ) : (
        <View
          style={{
            color: color,
            paddingLeft: getWidth(5),
            marginBottom: getHeight(1),
          }}
        />
      )}
      {error != null ? (
        <View style={styles.nulview}>
          <Text style={styles.errortect}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
};
export default PrayerInputType;
