import React from 'react';
import { View, TouchableOpacity, Animated, ScrollView, Text, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SceneMap, TabView } from 'react-native-tab-view';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import GoBackIcon from '@/components/GoBackIcon';
import LoginComponent from '@/components/LoginComponent';
import GradientHeader from '@/components/GradientHeader';
import SignupButtons from '@/components/SignupButtons';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import { appColor } from '../../../constants';
import { styles } from './styles';
import Button from '@/components/Button';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Organization from '@/assets/svg/Organization.svg';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { setAccountType } from '@/src/Redux/actions/GeneralActions';

const Signup = () => {
  const dispatch = useDispatch();
  const selected = useSelector((state: RootState) => state.general.accountType);

  return (
    <View style={styles.container}>
      <GeneralStatusBar
        backgroundColor={appColor.StatusBarColor}
        barStyle="light-content"
        hidden={false}
        translucent={true}
      />
      <GradientHeader title="Sign up" />
      <ScrollView
        contentContainerStyle={styles.containerScroll}
        style={{ backgroundColor: '#FFF' }}
      >
        <View style={{ paddingHorizontal: 25, flex: 1 }}>
          <Text
            style={{
              marginVertical: 20,
              textAlign: 'center',
              color: '#4F6D77',
              fontWeight: '500',
              fontFamily: 'Rubik-Regular',
              fontSize: 20,
              maxWidth: 200,
              width: '100%',
              alignSelf: 'center',
            }}
          >
            What type of profile would you like?
          </Text>

          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Button
              text={'Individual'}
              btnStyle={selected == 'individual' ? styles.btnSelected : styles.btn}
              RightIcon={null}
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

                // if (!fromAccountCreation) {
                //   setTimeout(function () {
                //     navigation.navigate('SignUp');
                //   }, 1000);
                // }
              }}
            />
            <Button
              text={'Organization'}
              RightIcon={null}
              btnStyle={selected == 'organization' ? styles.btnSelected : styles.btn}
              leftIcon={<Organization style={{ margin: 2 }} />}
              btnTextStyle={styles.btnText}
              onPress={() => {
                dispatch(setAccountType('organization'));
                // if (!fromAccountCreation) {
                //   setTimeout(function () {
                //     navigation.navigate('SignUp');
                //   }, 1000);
                // }
              }}
            />
          </View>
        </View>
        <SignupButtons />
        <View>
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
        </View>
      </ScrollView>
    </View>
  );
};

export default Signup;
