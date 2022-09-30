import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, Image, useColorScheme } from 'react-native';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import GradientHeader from '@/components/GradientHeader';
import SignupButtons from '@/components/SignupButtons';
import { getFontSize, getHeight } from '@/utils/ResponsiveFun';
import { appColor } from '../../../constants';
import { styles } from './styles';
import Button from '@/components/Button';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { setAccountType, setLoader } from '@/src/Redux/actions/GeneralActions';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons/faUser';
import { faUsers } from '@fortawesome/free-solid-svg-icons/faUsers';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '@/src/Navigation/types';
import axios from 'axios';
import { processLogin } from '@/src/Services/login';
import { loginSocialRequest } from '@/src/Redux/actions/AuthActions';
import { requestUserPermission } from '@/src/Services/Notification/notificationServices';
import { useTheme } from '@react-navigation/native';

type Props = StackScreenProps<RootStackParamList, 'SignUp'>;

const Signup = ({ navigation, route }: Props) => {
  const dispatch = useDispatch();
  const selected = useSelector((state: RootState) => state.general.accountType);
  const [error, seterror] = useState<string>();
  const accounType = useSelector((state: RootState) => state.general.accountType);
  const [token, setToken] = useState('');
  const [newUserCredentials, setNewUserCredentials] =
    useState<FirebaseAuthTypes.UserCredential | null>(null);

  const gotoSignup = async () => {
    setNewUserCredentials(null);
    dispatch(setAccountType(''));
    dispatch(setLoader(false));

    await auth().currentUser?.reload();
    await auth().currentUser?.getIdToken(true);
  };

  const sendFcm = (token: string) => {
    requestUserPermission(token, true);
  };

  const socialLogin = (newUserCredentials: FirebaseAuthTypes.UserCredential | null) => {
    if (newUserCredentials) {
      const data = {
        email: newUserCredentials?.user.email,
        name: newUserCredentials?.user.displayName,
        socialData: newUserCredentials?.additionalUserInfo,
        userId: newUserCredentials.user.uid,

        role: accounType,
        token,
      };

      dispatch(loginSocialRequest({ data, seterror, gotoSignup, sendFcm }));
    }
  };

  useEffect(() => {
    socialLogin(newUserCredentials);
  }, [newUserCredentials]);

  useEffect(() => {
    if (route.params?.oauth_token && route.params?.oauth_verifier) {
      const getTwitterAuthToken = async () => {
        try {
          const options = {
            method: 'POST',
            url: 'https://api.twitter.com/oauth/access_token',
            params: {
              oauth_token: route.params?.oauth_token,
              oauth_verifier: route.params?.oauth_verifier,
            },
            headers: {
              'Content-Type': 'application/json',
            },
          };
          const result = await axios.request(options);

          if (result.data) {
            const tokenData = result.data.split('&')?.map((item: string) => {
              return item.split('=')[1];
            });

            const twitterCredential = auth.TwitterAuthProvider.credential(
              tokenData[0],
              tokenData[1]
            );

            const userCredentials = await auth().signInWithCredential(twitterCredential);

            await processLogin(
              userCredentials,
              setToken,
              dispatch,
              setAccountType,
              setNewUserCredentials
            );
          }
        } catch (error: any) {
          seterror(error.nativeErrorMessage);
        }
      };
      getTwitterAuthToken();
    }
  }, [route.params]);
  const { colors } = useTheme();
  const scheme = useColorScheme();

  const getButtonTextStyle = (selected: boolean) => {
    if (selected) {
      return {
        ...styles.btnText,
        color: scheme == 'dark' ? '#81979E' : '#032F3C',
      };
    }

    return { ...styles.btnText, color: scheme == 'dark' ? '#032F3C' : '#B3C1C5' };
  };

  const getButtonContainer = (selected: boolean) => {
    if (selected) {
      return { ...styles.btnSelected, borderColor: colors.border };
    } else {
      return { ...styles.btn, borderColor: colors.border };
    }
  };

  return (
    <View style={styles.container}>
      <GeneralStatusBar
        backgroundColor={appColor.StatusBarColor}
        barStyle="light-content"
        hidden={false}
        translucent={true}
      />
      <GradientHeader title="Sign up" />
      <ScrollView contentContainerStyle={styles.containerScroll}>
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
              btnStyle={getButtonContainer(selected == 'individual')}
              RightIcon={null}
              leftIcon={
                <FontAwesomeIcon
                  icon={faUser}
                  style={{ margin: 5 }}
                  size={getFontSize(1.8)}
                  color={
                    selected == 'individual'
                      ? scheme == 'dark'
                        ? '#81979E'
                        : '#032F3C'
                      : scheme == 'dark'
                      ? '#032F3C'
                      : '#B3C1C5'
                  }
                />
              }
              btnTextStyle={getButtonTextStyle(selected == 'individual')}
              onPress={() => {
                dispatch(setAccountType('individual'));
              }}
            />
            <Button
              text={'Organization'}
              RightIcon={null}
              btnStyle={getButtonContainer(selected == 'organization')}
              leftIcon={
                <FontAwesomeIcon
                  icon={faUsers}
                  style={{ margin: 5 }}
                  size={getFontSize(3)}
                  color={
                    selected == 'organization'
                      ? scheme == 'dark'
                        ? '#81979E'
                        : '#032F3C'
                      : scheme == 'dark'
                      ? '#032F3C'
                      : '#B3C1C5'
                  }
                />
              }
              btnTextStyle={getButtonTextStyle(selected == 'organization')}
              onPress={() => {
                dispatch(setAccountType('organization'));
              }}
            />
          </View>
        </View>
        <SignupButtons
          socialLogin={socialLogin}
          navigation={navigation}
          route={route}
          errorFromLogin={error}
        />

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
