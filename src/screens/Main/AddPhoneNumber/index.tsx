import { StyleSheet, Text, View, Image, TouchableOpacity, ImageBackground } from 'react-native';
import React, { useRef, useState } from 'react';
import { appColor, COLORS, THEME } from '../../constants';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Logo from '@/assets/svg/LogoBlue.svg';
import { GeneralStyle } from '../../../constants/GeneralStyle';
import Icon from 'react-native-vector-icons/Ionicons';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Button from '@/components/Button';
import { TextInput } from 'react-native-paper';
import { validateFields } from '@/utils/validation/validate-fields';
import validator from '@/utils/validation/validator';
import { useDispatch, useSelector } from 'react-redux';
import { setLoader } from '@/redux//actions/GeneralActions';
import { styles } from './styles';
import Header from '@/components/Header';
import { profileUpdate } from '@/redux//actions/AuthActions';

const AddPhoneNumber = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.userProfile);

  const token = useSelector((state) => state.auth.userToken);

  const inputRefs = {
    phoneNumber: useRef(null),
  };
  const [state, setState] = useState({
    phoneNumber: '',
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
        leftView={<View style={{ width: getWidth(5) }} />}
        RightView={<View style={{ width: getWidth(5) }} />}
      />

      <View style={{ flex: 1 }}>
        <Text
          style={{
            marginTop: getHeight(5.5),
            color: '#032f3c',
            fontSize: getFontSize(3),
            fontFamily: 'Rubik-Medium',
            alignSelf: 'center',
          }}
        >
          Verify Phone Number
        </Text>
        <Text
          style={{
            color: '#5b7279',
            fontFamily: 'Rubik-Regular',
            textAlign: 'center',
            marginTop: getHeight(1),
            fontSize: getFontSize(2.3),
            width: '80%',
            lineHeight: 23,
            alignSelf: 'center',
          }}
        >
          For your privacy & security, Let’s verify your Phone Number
        </Text>
        <View style={{ margin: getHeight(5) }}>
          <TextInput
            theme={{ roundness: 10 }}
            activeOutlineColor={'#5B7279'}
            ref={inputRefs.phoneNumber}
            value={state.phoneNumber}
            returnKeyType={'done'}
            keyboardType={'number-pad'}
            // editable={editPhone ? false : true}
            label={'Phone Number'}
            mode="outlined"
            // right={
            //   <TextInput.Icon
            //     name={() => (
            //       <AntDesign
            //         name={editPhone ? 'edit' : 'lock'}
            //         size={20}
            //         color={'#5B7279'}
            //         style={styles.hidepicc}
            //         onPress={() => setEditPhone(!editPhone)}
            //       />
            //     )}
            //   />
            // }
            style={GeneralStyle.input}
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
          <Text style={{ ...GeneralStyle.InputError, marginLeft: 0 }}>
            {state.phoneNumberError}
          </Text>
        </View>
        <Button
          text={'ADD'}
          btnStyle={GeneralStyle.btn}
          btnTextStyle={GeneralStyle.btnText}
          onPress={() => {
            UpdateProfile();
          }}
        />
      </View>
    </View>
  );
};

export default AddPhoneNumber;
