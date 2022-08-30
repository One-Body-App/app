import React, { useEffect } from 'react';
import { Text, View, Image, TouchableOpacity } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { getFontSize, getHeight } from '@/utils/ResponsiveFun';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import { setAccountType } from '@/redux//actions/GeneralActions';
import GradientHeader from '@/components/GradientHeader';
import Organization from '@/assets/svg/Organization.svg';
import Button from '@/components/Button';
import { styles } from './styles';
import { appColor } from '../../../constants';
import GoBackIcon from '@/components/GoBackIcon';
import { StackScreenProps } from '@react-navigation/stack';
// import { ParamListBase } from '@react-navigation/native';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import auth from '@react-native-firebase/auth';
import { logout, setProfile } from '@/src/Redux/actions/AuthActions';
import { ApiCall } from '@/src/Services/api';
import { getuserGet } from '@/src/Redux/actions/UserAction';
import { LoginManager } from 'react-native-fbsdk-next';
import { ParamListBase } from '@react-navigation/native';

type Props = StackScreenProps<ParamListBase, 'Login'>;

const AccountType = ({ route, navigation }: Props) => {
  const dispatch = useDispatch();
  const selected = useSelector((state: RootState) => state.general.accountType);
  const token = useSelector((state: RootState) => state.auth.userToken);

  useEffect(() => {
    navigation?.addListener('beforeRemove', async (e) => {
      try {
        e.preventDefault();
        LoginManager.logOut();
        await auth().signOut();
        dispatch(logout());
        navigation.dispatch(e.data.action);
      } catch {
        navigation.dispatch(e.data.action);
      }
    });

    return navigation?.removeListener('beforeRemove', () => {});
  }, [navigation]);

  const setRole = async () => {
    try {
      const res = await ApiCall({
        route: 'user/set-role',
        token: token,
        params: { role: selected },
        verb: 'patch',
      });
      console.log(res);
      if (res?.status == 200) {
        dispatch(setProfile(res.response));
        console.log('role res == 200 ... ', res);
      } else {
        console.log('error', res);
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  useEffect(() => {
    if (selected) {
      setRole();
    }
  }, [selected]);

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
            }}
          />
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
