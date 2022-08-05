import { Text, View, TouchableOpacity } from 'react-native';
import React, { useRef, useState } from 'react';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { GernalStyle } from '../../../constants/GernalStyle';
import { getHeight, getWidth } from '@/utils/ResponsiveFun';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Button from '@/components/Button';
import { TextInput } from 'react-native-paper';
import { validateFields } from '@/utils/validation/validate-fields';
import validator from '@/utils/validation/validator';
import { useDispatch, useSelector } from 'react-redux';
import { setLoader } from '@/redux//actions/GernalActions';
import { styles } from './styles';
import Header from '@/components/Header';
import { profileUpdate } from '@/redux//actions/AuthActions';

const PhoneNumberUpdate = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.userData);
  const token = useSelector((state) => state.auth.userToken);

  const inputRefs = {
    phoneNumber: useRef(null),
  };
  const [state, setState] = useState({
    phoneNumber: user.phoneNumber,
    phoneNumberError: '',
  });

  const [editPhone, setEditPhone] = useState(true);
  const changeHandler = (type, value) => setState({ ...state, [type]: value });

  const UpdateProfile = async () => {
    const { phoneNumber } = state;
    const phoneNumberError = await validator('phoneNumber', phoneNumber);

    if (!phoneNumberError) {
      dispatch(setLoader(true));
      const data = {
        phoneNumber: state.phoneNumber,
      };
      dispatch(profileUpdate({ data, token, role: user.role, go }));
    } else {
      setState({ ...state, phoneNumberError });
    }
  };
  const go = () => {
    navigation.navigate('phoneValidate');
  };

  return (
    <View style={styles.container}>
      <GeneralStatusBar
        backgroundColor="white"
        barStyle="dark-content"
        hidden={false}
        translucent={true}
      />
      <Header
        title={editPhone ? 'Phone Number' : 'Edit Phone Number'}
        leftView={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} />
          </TouchableOpacity>
        }
        RightView={<View style={{ width: getWidth(5) }} />}
      />

      <View style={{ flex: 1 }}>
        <View style={{ margin: getHeight(5) }}>
          <TextInput
            theme={{ roundness: 10 }}
            activeOutlineColor={'#5B7279'}
            ref={inputRefs.phoneNumber}
            value={state.phoneNumber}
            returnKeyType={'done'}
            keyboardType={'number-pad'}
            editable={editPhone ? false : true}
            label={'Phone Number'}
            mode="outlined"
            right={
              <TextInput.Icon
                name={() => (
                  <AntDesign
                    name={editPhone ? 'edit' : 'lock'}
                    size={20}
                    color={'#5B7279'}
                    style={styles.hidepicc}
                    onPress={() => setEditPhone(!editPhone)}
                  />
                )}
              />
            }
            style={GernalStyle.input}
            onFocus={() => setState({ ...state, phoneNumberError: '' })}
            onBlur={() =>
              validateFields(state.phoneNumber, 'phoneNumber', (error) =>
                setState({ ...state, phoneNumberError: error })
              )
            }
            onSubmitEditing={() => UpdateProfile()}
            onChangeText={(phoneNumber) => changeHandler('phoneNumber', phoneNumber.trim())}
            blurOnSubmit={false}
          />
          <Text style={{ ...GernalStyle.InputError, marginLeft: 0 }}>{state.phoneNumberError}</Text>
        </View>
        <Button
          text={'UPDATE'}
          btnStyle={GernalStyle.btn}
          btnTextStyle={GernalStyle.btnText}
          onPress={() => {
            UpdateProfile();
          }}
        />
      </View>
    </View>
  );
};

export default PhoneNumberUpdate;
