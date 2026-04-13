import React, { useEffect, useState } from 'react';
import { Text, View, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Ionicons from '@react-native-vector-icons/ionicons';
import Toast from 'react-native-simple-toast';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Button from '../Button';
import { setLoader, setPrayers } from '@/src/redux/actions/GeneralActions';
import styles from './styles';
import { ApiCall } from '@/src/services/api';
import { getAllPrayer, getMyPrayer, getTestimonies } from '@/src/redux/actions/PrayerAction';
import Send from '@/assets/svg/Send.svg';
import StyledText from '../styled/Text';

function PrayerInputHome({ color }: { color: string }) {
  const dispatch = useDispatch();
  const token = useSelector((state: any) => state.auth.userToken);
  const user = useSelector((state: any) => state.auth.getProfileData);
  const prayers = useSelector((state: any) => state.general.prayers);
  const [prayerTypeShow, setPrayerTypeShow] = useState(false);
  const [payerType, setPrayerType] = useState<string | null>(null);
  const [prayer, setPrayer] = useState('');
  const [error, seterror] = React.useState<string | null>();

  const ValidatePrayer = () => {
    if (prayer != null && payerType != null) {
      if (prayer.length <= 150 && prayer !== '') {
        seterror(null);
        createPrayer();
      } else {
        seterror('prayer text must be within 1 to 150.');
      }
    } else {
      if (prayer == null && prayer === '') {
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
    if (payerType === 'answer') {
      dispatch(setLoader(true));
      try {
        const res: any = await ApiCall({
          params: { answer: prayer },
          token,
          route: `prayers/answer-prayer`,
          verb: 'patch',
        });

        if (res?.status === '200') {
          dispatch(setLoader(false));
          setPrayerTypeShow(false);
          setPrayerType(null);
          setPrayer('');
          dispatch(
            getMyPrayer({
              page: 1,
              token,
            })
          );

          dispatch(
            getAllPrayer({
              page: 1,
              token,
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
        const res: any = await ApiCall({
          params: { prayer, prayerType: payerType },
          token,
          route: 'prayers/new-prayer',
          verb: 'post',
        });

        if (res?.status === '200') {
          dispatch(setLoader(false));
          setPrayerTypeShow(false);
          setPrayerType(null);
          setPrayer('');
          Toast.show(res?.response?.message, Toast.LONG);

          dispatch(
            getMyPrayer({
              page: 1,
              token,
            })
          );
          dispatch(
            getAllPrayer({
              page: 1,
              token,
            })
          );
        } else {
          console.log('error', res?.response);
          dispatch(setLoader(false));
        }
      } catch (e) {
        console.log('saga change pasword err --- ', e);
      }
    }
  };

  return (
    <View>
      {prayerTypeShow ? (
        <ScrollView showsHorizontalScrollIndicator={false} horizontal>
          <View style={styles.prayerTypeView}>
            <Button
              btnStyle={payerType === 'anonymous' ? styles.btnSelected : styles.btn}
              btnTextStyle={payerType === 'anonymous' ? { color: 'white' } : { color: '#5B7279' }}
              text="Anonymous"
              onPress={() => setPrayerType('anonymous')}
            />
            <Button
              btnStyle={payerType === 'prayer-request' ? styles.btnSelected : styles.btn}
              btnTextStyle={
                payerType === 'prayer-request' ? { color: 'white' } : { color: '#5B7279' }
              }
              text="Prayer Request"
              onPress={() => setPrayerType('prayer-request')}
            />
            <Button
              btnStyle={payerType === 'exhortation' ? styles.btnSelected : styles.btn}
              btnTextStyle={payerType === 'exhortation' ? { color: 'white' } : { color: '#5B7279' }}
              text="Exhortation"
              onPress={() => setPrayerType('exhortation')}
            />
            <Button
              btnStyle={payerType === 'answer' ? styles.btnSelected : styles.btn}
              btnTextStyle={payerType === 'answer' ? { color: 'white' } : { color: '#5B7279' }}
              text="Testimonies"
              onPress={() => setPrayerType('answer')}
            />
          </View>
        </ScrollView>
      ) : null}
      <View style={styles.ModelInputView}>
        <TextInput
          placeholderTextColor="#f6f6f6"
          value={prayer}
          placeholder="  Share what God is doing in your life"
          // onPressIn={() => setPrayerTypeShow(true)}
          onFocus={() => setPrayerTypeShow(true)}
          onChangeText={(e) => {
            if (prayer.length < 150) {
              setPrayer(e);
            }
            seterror(null);
          }}
          multiline
          style={{
            ...styles.TextInput,
            color,
            backgroundColor: '#4F6D77',
            borderWidth: 0,
          }}
        />

        <TouchableOpacity
          onPress={() => {
            ValidatePrayer();
          }}
          style={styles.Button}
        >
          <Send height={getHeight(2)} width={getWidth(10)} />
          {/* <Ionicons name="send" size={20} color="#032F3C" /> */}
        </TouchableOpacity>
      </View>
      {prayer !== '' && error == null ? (
        <StyledText
          style={{
            color,
            paddingLeft: getWidth(5),
            marginBottom: getHeight(1),
          }}
        >
          {prayer !== '' ? prayer.length : null}/150 Characters left
        </StyledText>
      ) : (
        <View
          style={{
            paddingLeft: getWidth(5),
            marginBottom: getHeight(1),
          }}
        />
      )}
      {error != null ? (
        <View style={styles.nulview}>
          <StyledText style={styles.errortect}>{error}</StyledText>
        </View>
      ) : null}
    </View>
  );
}
export default PrayerInputHome;
