import React, { useEffect, useState } from 'react';
import { Text, View, TextInput, TouchableOpacity, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Button from '../Button';
import { setLoader, setPrayers, setUserPrayers } from '@/src/redux/actions/GeneralActions';
import { styles } from './styles';
import { ApiCall } from '@/src/services/api';
import Toast from 'react-native-simple-toast';
import { getAllPrayer, getTestimonies } from '@/src/redux/actions/PrayerAction';

const AnswerPrayers = ({ color }) => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.userToken);
  const [prayer, setPrayer] = useState('');
  const [error, seterror] = React.useState();

  const ValidatePrayer = () => {
    if (prayer == null) {
      seterror('prayer Answer is required!');
    } else {
      PrayerAnswer();
    }
  };
  const PrayerAnswer = async () => {
    dispatch(setLoader(true));
    try {
      const res = await ApiCall({
        params: { answer: prayer },
        token: token,
        route: 'prayers/answer-prayer',
        verb: 'patch',
      });

      if (res?.status == 200) {
        dispatch(setLoader(false));
        setPrayer('');
        dispatch(
          getTestimonies({
            page: 1,
            token: token,
          })
        );
        dispatch(
          getAllPrayer({
            page: 1,
            token: token,
          })
        );
        //  Toast.show('Answer submit Sucessfuly')
      } else {
        dispatch(setLoader(false));
      }
    } catch (e) {
      console.log('saga change pasword err --- ', e);
    }
  };

  return (
    <View style={{ marginTop: 5 }}>
      <View style={styles.ModelInputView}>
        <TextInput
          placeholderTextColor={color}
          value={prayer}
          placeholder=" Share a prayer request, exhortation, or testimony"
          onChangeText={(e) => {
            setPrayer(e), seterror(null);
          }}
          multiline={true}
          style={{ ...styles.TextInput, color: color }}
        />

        <TouchableOpacity
          onPress={() => {
            ValidatePrayer();
          }}
          style={styles.Button}
        >
          <Ionicons name="send" size={20} color="#126B87" />
        </TouchableOpacity>
      </View>
      {prayer != '' && error == null ? (
        <Text style={{ color: color, paddingLeft: getWidth(5) }}>
          {prayer != '' ? prayer.length : null}/150 Characters left
        </Text>
      ) : null}
      {error != null ? (
        <View style={styles.fiview}>
          <View style={styles.errorview} />
          <Text style={styles.errortext}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
};
export default AnswerPrayers;
