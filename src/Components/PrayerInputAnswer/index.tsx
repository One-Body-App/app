import React, { useEffect, useState } from 'react';
import { Text, View, TextInput, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Button from '../Button';
import { setLoader, setPrayers, setUserPrayers } from '@/redux/actions/GeneralActions';
import { styles } from './styles';
import { ApiCall } from '@/services/api';
import Toast from 'react-native-simple-toast';
import { getAllPrayer, getMyPrayer, getTestimonies } from '@/redux/actions/PrayerAction';

const PrayerInputAnswer = ({ color, id, setIsAnswerd, setCurrentIndex }) => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.userToken);
  const userPrayers = useSelector((state) => state.general.userPrayers);

  const [prayer, setPrayer] = useState(null);
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
        params: { answer: prayer, id: id },
        token: token,
        route: 'prayers/answer-prayer',
        verb: 'patch',
      });

      if (res?.status == '200') {
        dispatch(setLoader(false));
        setIsAnswerd(false);
        setCurrentIndex(null);

        dispatch(getMyPrayer({ pageno: 1, token: token }));
        dispatch(getAllPrayer({ pageno: 1, token: token }));
        dispatch(getTestimonies({ pageno: 1, token: token }));
      } else {
        console.log('error', res?.response);
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
          placeholder="Send prayer request"
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
          <Ionicons name="send" size={20} color="#032f3c" />
        </TouchableOpacity>
      </View>
      {prayer != null && error == null ? (
        <Text style={{ color: color, paddingLeft: getWidth(5) }}>
          {prayer.length}/150 Characters left
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
export default PrayerInputAnswer;
