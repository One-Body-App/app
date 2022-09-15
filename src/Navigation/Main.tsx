import { LinkingOptions, NavigationContainer } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

import { useDispatch, useSelector } from 'react-redux';
import { AppProvider } from '../../app-context';
import { getHeight, getWidth } from '@/utils/ResponsiveFun';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { useToast } from 'react-native-toast-notifications';

import AuthStack from './AuthStack';
import HomeStack from './HomeStack';
import { RootState } from '../Redux/reducers/rootReducer';
import { getUserData, getuserGet, setUserData } from '../Redux/actions/UserAction';
import { getProfile, setLoginData } from '../Redux/actions/AuthActions';
import { isEqual } from 'lodash';
import { setLoader } from '../Redux/actions/GeneralActions';

import { ScrollView } from 'react-native';
import { AuthContext } from '../Services/authContext';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AccountType from '../screens/Auth/AccountType';
import ConfirmPassword from '../screens/Auth/ConfirmPassword';
import ForgotPassword from '../screens/Auth/ForgetPassword';
import Login from '../screens/Auth/Login';
import NewPassword from '../screens/Auth/NewPassword';
import PasswordResetOtp from '../screens/Auth/PasswordResetOtp';
import Signup from '../screens/Auth/Signup';
import SignupForm from '../screens/Auth/SignupForm';
import InfluencerStepOne from '../screens/BecomeInfluencer/InfluencerStepOne';
import InfluencerStepThree from '../screens/BecomeInfluencer/InfluencerStepThree';
import InfluencerStepTwo from '../screens/BecomeInfluencer/InfluencerStepTwo';
import LoadingPage from '../screens/loadingPage';
import AddPhoneNumber from '../screens/Main/AddPhoneNumber';
import BlogView from '../screens/Main/BlogView';
import Deactivateaccount from '../screens/Main/Deactivateaccount';
import Deactivateaccountotp from '../screens/Main/Deactivateaccountotp';
import Deactivateaccountconfirm from '../screens/Main/Deactiveaccountconfirm';
import EditProfile from '../screens/Main/EditProfile';
import EndUserAgrement from '../screens/Main/EndUserAgrement';
import Help from '../screens/Main/Help';
import Faqs from '../screens/Main/Help/Faqs';
import IndividualSteps from '../screens/Main/IndividualSteps';
import ConversationScreen from '../screens/Main/Message/conversation';
import Notificationandemail from '../screens/Main/Notificationandemail';
import OrgnizationSteps from '../screens/Main/OrgnizationSteps';
import PasswordChange from '../screens/Main/PasswordChange';
import PhoneNumberUpdate from '../screens/Main/PhoneNumberUpdate';
import PhoneValidate from '../screens/Main/PhoneValidate';
import PhoneValidateOtp from '../screens/Main/PhoneValidateOtp';
import Prayer from '../screens/Main/Prayer';
import PrivacyPolicy from '../screens/Main/PrivacyPolicy';
import Search from '../screens/Main/Search';
import Setting from '../screens/Main/Setting';
import UserProfile from '../screens/Main/UserProfile';
import Drawerr from './Drawerr';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator();
const Main = () => {
  const toast = useToast();
  const loader = useSelector((state: RootState) => state.general.loader);
  const userData = useSelector((state: RootState) => state.auth.userData);
  const dispatch = useDispatch();

  const [initializing, setInitializing] = useState<boolean>(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    toast.hideAll();

    if (loader) {
      toast.show(<ActivityIndicator />, {
        placement: 'top',
      });
    } else {
      toast.hideAll();
    }
  }, [loader]);

  const onAuthStateChanged = async function (firebaseUser: FirebaseAuthTypes.User | null) {
    const firebaseToken = await firebaseUser?.getIdToken();

    if (!isEqual(firebaseUser, user)) {
      if (firebaseUser?.email && firebaseUser?.emailVerified) {
        setUser(firebaseUser);
      }
    }
    console.log(firebaseToken);
    if (!isEqual(firebaseToken, token)) {
      setToken(firebaseToken ?? '');
    }
  };

  useEffect(() => {
    const subscriber = auth().onIdTokenChanged(onAuthStateChanged);
    dispatch(setLoader(true));

    return subscriber; // unsubscribe on unmount
  }, []);

  useEffect(() => {
    if (user) {
      dispatch(setLoginData({ token }));
    }

    if (token) {
      dispatch(
        getUserData({
          token,
        })
      );
    }

    if (initializing != true) {
      dispatch(setLoader(false));
    }

    if (initializing) setInitializing(false);
  }, [token, user, initializing]);

  const linking: LinkingOptions<RootStackParamList> = {
    prefixes: ['https://app.onebodyapp.com'],
    config: {
      screens: {
        Login: {
          path: '/auth/:action',
        },
        SignUp: {
          path: '/signup/:action',
        },
      },
      /* configuration for matching screens with paths */
    },
  };

  const authContext = React.useMemo(
    () => ({
      signIn: async (data: any) => {
        // In a production app, we need to send some data (usually username, password) to server and get a token
        // We will also need to handle errors if sign in failed
        // After getting token, we need to persist the token using `SecureStore` or any other encrypted storage
        // In the example, we'll use a dummy token

        dispatch({ type: 'SIGN_IN', token: 'dummy-auth-token' });
      },
      signOut: () => dispatch({ type: 'SIGN_OUT' }),
      signUp: async (data: any) => {
        // In a production app, we need to send user data to server and get a token
        // We will also need to handle errors if sign up failed
        // After getting token, we need to persist the token using `SecureStore` or any other encrypted storage
        // In the example, we'll use a dummy token

        dispatch({ type: 'SIGN_IN', token: 'dummy-auth-token' });
      },
    }),
    []
  );
  console.log(user, token, userData);
  return (
    <AuthContext.Provider value={authContext}>
      <NavigationContainer linking={linking}>
        <AppProvider>
          {/* {initializing ? (
          <View style={styles.loaderbackground}>
            <View>
              <ActivityIndicator size={getHeight(5)} color="#126B87" />
            </View>
          </View>
        ) : user &&
          token &&
          userData &&
          (userData?.role == 'individual' || userData?.role == 'organization') ? (
          <HomeStack userData={userData} user={user} />
        ) : (
          <AuthStack />
        )} */}

          <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="SignUp">
            {user &&
            token &&
            userData &&
            (userData?.role == 'individual' || userData?.role == 'organization') ? (
              <>
                <Stack.Screen name="Bootombar" component={Drawerr} />
                <Stack.Screen name="InfluencerStepOne" component={InfluencerStepOne} />
                <Stack.Screen name="InfluencerStepTwo" component={InfluencerStepTwo} />
                <Stack.Screen name="InfluencerStepThree" component={InfluencerStepThree} />
                <Stack.Screen name="Prayer" component={Prayer} />
                <Stack.Screen name="IndividualSteps" component={IndividualSteps} />
                <Stack.Screen name="OrgnizationSteps" component={OrgnizationSteps} />
                <Stack.Screen name="Help" component={Help} />
                <Stack.Screen name="Faqs" component={Faqs} />
                <Stack.Screen name="Deactivateaccount" component={Deactivateaccount} />
                <Stack.Screen name="editProfile" component={EditProfile} />
                <Stack.Screen name="setting" component={Setting} />
                <Stack.Screen name="passwordChange" component={PasswordChange} />
                <Stack.Screen name="phoneValidate" component={PhoneValidate} />

                <Stack.Screen name="confirm" component={ConfirmPassword} />

                <Stack.Screen name="newpassword" component={NewPassword} />

                <Stack.Screen name="loading" component={LoadingPage} />
                <Stack.Screen name="conversation" component={ConversationScreen} />
                <Stack.Screen
                  options={{ headerShown: false }}
                  name="Notificationandemail"
                  component={Notificationandemail}
                />
                <Stack.Screen name="Deactivateaccountotp" component={Deactivateaccountotp} />
                <Stack.Screen
                  name="Deactivateaccountconfirm"
                  component={Deactivateaccountconfirm}
                />
                <Stack.Screen name="PhoneNumberUpdate" component={PhoneNumberUpdate} />
                <Stack.Screen name="AddPhoneNumber" component={AddPhoneNumber} />
                <Stack.Screen name="UserProfile" component={UserProfile} />

                <Stack.Screen
                  name="Search"
                  component={Search}
                  options={{ presentation: 'modal' }}
                />
                <Stack.Screen
                  name="BlogView"
                  component={BlogView}
                  options={{ presentation: 'modal' }}
                />
              </>
            ) : (
              <>
                <Stack.Screen name="Login" component={Login} />
                <Stack.Screen name="SignUp" component={Signup} />
                <Stack.Screen name="AccountType" component={AccountType} />
                <Stack.Screen name="SignupForm" component={SignupForm} />
                <Stack.Screen name="forget" component={ForgotPassword} />

                <Stack.Screen name="PhoneValidateOtp" component={PhoneValidateOtp} />
                <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
                <Stack.Screen name="EndUserAgrement" component={EndUserAgrement} />
                <Stack.Screen name="confirm" component={ConfirmPassword} />
                <Stack.Screen name="newpassword" component={NewPassword} />
                <Stack.Screen name="PasswordResetOtp" component={PasswordResetOtp} />
              </>
            )}
          </Stack.Navigator>
        </AppProvider>
      </NavigationContainer>
    </AuthContext.Provider>
  );
};
const styles = StyleSheet.create({
  loaderbackground: {
    justifyContent: 'center',
    alignItems: 'center',
    height: getHeight(110),
    width: getWidth(100),
    backgroundColor: 'rgba(52, 52, 52, 0.5)',
    position: 'absolute',
    alignSelf: 'center',
  },
});
export default Main;
