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

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { setAccountType } from '@/src/Redux/actions/GeneralActions';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons/faUser';
import { faUsers } from '@fortawesome/free-solid-svg-icons/faUsers';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '@/src/Navigation/types';

type Props = StackScreenProps<RootStackParamList, 'SignUp'>;

const Signup = ({ navigation, route }: Props) => {
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
              marginTop: 24,
              marginBottom: 16,
              textAlign: 'center',
              color: '#4F6D77',
              fontWeight: '500',
              fontFamily: 'Rubik-Regular',
              fontSize: 16,
              maxWidth: 250,
              width: '100%',
              alignSelf: 'center',
            }}
          >
            What type of profile would you like?
          </Text>

          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <Button
              text={'Individual'}
              btnStyle={selected == 'individual' ? styles.btnSelected : styles.btn}
              RightIcon={null}
              leftIcon={
                <FontAwesomeIcon
                  icon={faUser}
                  style={{ margin: 5 }}
                  size={getFontSize(1.8)}
                  color={selected == 'individual' ? '#032F3C' : '#B3C1C5'}
                />
              }
              btnTextStyle={{
                ...styles.btnText,
                color: selected == 'individual' ? '#032F3C' : '#81979E',
              }}
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
              leftIcon={
                <FontAwesomeIcon
                  icon={faUsers}
                  style={{ margin: 5 }}
                  size={getFontSize(3)}
                  color={selected == 'organization' ? '#032F3C' : '#B3C1C5'}
                />
              }
              btnTextStyle={{
                ...styles.btnText,
                color: selected == 'organization' ? '#032F3C' : '#81979E',
              }}
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
        <SignupButtons navigation={navigation} route={route} />
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
