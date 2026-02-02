import React, { useState } from 'react';
import { Text, View, TextInput, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Ionicons from '@react-native-vector-icons/ionicons';
import PropTypes from 'prop-types';
import { getWidth } from '@/utils/ResponsiveFun';
import Button from '../Button';
import { setLoader, setUserPrayers } from '@/src/redux/actions/GeneralActions';
import styles from './styles';
import { ApiCall } from '@/src/services/api';
import { RootState } from '@/src/redux/reducers/rootReducer';

interface PrayerInputTypeEditProps {
  color?: string;
  id?: string;
  pray?: string;
  praytype?: string;
  setCurrentIndex: (value: number | null) => void;
  setIsediting: (value: boolean) => void;
}

function PrayerInputTypeEdit({
  color,
  id,
  pray,
  praytype,
  setCurrentIndex,
  setIsediting,
}: PrayerInputTypeEditProps) {
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const userPrayers = useSelector((state: RootState) => state.prayer.userPrayers);
  const [prayerTypeShow, setPrayerTypeShow] = useState(true);
  const [payerType, setPrayerType] = useState(praytype);
  const [prayer, setPrayer] = useState(pray);
  const [error, setError] = React.useState<string | null>(null);

  const ValidatePrayer = () => {
    if (prayer != null && payerType != null) {
      if (prayer.length <= 150) {
        setError(null);
        updatePrayer();
      } else {
        setError('prayer text must be within 1 to 150.');
      }
    } else {
      if (prayer == null) {
        setError('prayer required!');
      }
      if (payerType == null) {
        setPrayerTypeShow(true);
        setError('prayer type is required!');
      }
    }
  };
  const updatePrayer = async () => {
    dispatch(setLoader(true));
    try {
      const res = await ApiCall({
        params: { prayer, prayerType: payerType },
        token,
        route: `prayers/update-prayer/${id}`,
        verb: 'patch',
      });

      if (res?.status === 200) {
        console.log('res ', res?.response);
        dispatch(setLoader(false));
        setCurrentIndex(null);
        setIsediting(false);
        const array = [res?.response?.data, ...userPrayers];
        dispatch(setUserPrayers(array));
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
      {prayerTypeShow ? (
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
        </View>
      ) : null}
      <View style={styles.ModelInputView}>
        <TextInput
          placeholderTextColor={color}
          value={prayer}
          placeholder="Send prayer request"
          // onPressIn={() => setPrayerTypeShow(true)}
          onFocus={() => setPrayerTypeShow(true)}
          onChangeText={(e) => {
            if (e.length <= 150) {
              setPrayer(e);
            }
            setError(null);
          }}
          multiline
          style={{ ...styles.TextInput, color }}
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
      {prayer != null && error == null ? (
        <Text style={{ color, paddingLeft: getWidth(5) }}>{prayer.length}/150 Characters left</Text>
      ) : null}
      {error != null ? (
        <View style={styles.upview}>
          <View style={styles.sdview} />
          <Text style={styles.errortext}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}
export default PrayerInputTypeEdit;

PrayerInputTypeEdit.propTypes = {
  color: PropTypes.string,
  id: PropTypes.string,
  pray: PropTypes.string,
  praytype: PropTypes.string,
  setCurrentIndex: PropTypes.func.isRequired,
  setIsediting: PropTypes.func.isRequired,
};
