import React from 'react';
import { Text, View, Image, TouchableOpacity } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { getFontSize, getHeight } from '@/utils/ResponsiveFun';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import { setAccountType } from '@/redux//actions/GernalActions';
import GradientHeader from '@/components/GradientHeader';
import Organization from '@/assets/svg/Organization.svg';
import Button from '@/components/Button';
import { styles } from './styles';
import { appColor } from '../../../constants';
import GoBackIcon from '@/components/GoBackIcon';

const AccountType = ({ navigation }) => {
  const dispatch = useDispatch();
  const selected = useSelector((state) => state.gernal.AccountType);

  return (
    <View style={styles.container}>
      <GeneralStatusBar
        backgroundColor={appColor.StatusBarColor}
        barStyle="light-content"
        hidden={false}
        translucent={true}
      />
      <GradientHeader />
      <LinearGradient colors={['#fff', '#fff', '#E0EEF3']} style={styles.innerContainer}>
        <Text style={styles.heading}>What type of profile would you like?</Text>
        <View>
          <Button
            text={'Individual'}
            btnStyle={selected == 'individual' ? styles.btnSelected : styles.btn}
            leftIcon={
              <FontAwesome
                name="user"
                style={{ margin: 3 }}
                size={getFontSize(3)}
                color="#B3C1C5"
              />
            }
            btnTextStyle={styles.btnText}
            onPress={() => {
              dispatch(setAccountType('individual'));
              setTimeout(function () {
                navigation.navigate('SignUp');
              }, 1000);
            }}
          />
          <Button
            text={'Organization'}
            btnStyle={selected == 'organization' ? styles.btnSelected : styles.btn}
            leftIcon={<Organization style={{ margin: 2 }} />}
            btnTextStyle={styles.btnText}
            onPress={() => {
              dispatch(setAccountType('organization'));
              setTimeout(function () {
                navigation.navigate('SignUp');
              }, 1000);
            }}
          />
        </View>
        <View style={styles.alreadyLogin}>
          <Text style={styles.alreadyAccountContainer}>Already Have an account?</Text>
          <TouchableOpacity style={{ marginLeft: 5 }} onPress={() => navigation.navigate('Login')}>
            <Text style={{ ...styles.helight, textDecorationLine: 'underline' }}>Login</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      <Image
        style={styles.footer}
        resizeMode="stretch"
        source={require('@/assets/images/waveBG.png')}
      />
      <View
        style={{
          ...styles.footer,
          justifyContent: 'center',
          alignItems: 'center',
          height: getHeight(9),
        }}
      >
        <Text style={styles.helight}>Unify the Body</Text>
        <Text style={{ color: 'gray', marginTop: 2 }}>1 Cor. 12:12</Text>
      </View>
      <GoBackIcon color={'white'} />
    </View>
  );
};
export default AccountType;
