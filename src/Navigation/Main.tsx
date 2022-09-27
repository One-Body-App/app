import { LinkingOptions, NavigationContainer } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

import { useDispatch, useSelector } from 'react-redux';
import { AppProvider } from '../../app-context';
import { getHeight, getWidth } from '@/utils/ResponsiveFun';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { useToast } from 'react-native-toast-notifications';

import { RootState } from '../Redux/reducers/rootReducer';
import { getUserProfile } from '../Redux/actions/UserAction';
import { setLoginData, setUserData } from '../Redux/actions/AuthActions';
import { isEqual } from 'lodash';
import { setLoader } from '../Redux/actions/GeneralActions';
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
import RemoveAccount from '../screens/Main/RemoveAccount';
import RemoveAccountConfirmation from '../screens/Main/RemoveAccountConfirmation';
import EditProfile from '../screens/Main/EditProfile';
import EndUserAgrement from '../screens/Main/EndUserAgrement';
import Help from '../screens/Main/Help';
import Faqs from '../screens/Main/Help/Faqs';
import IndividualSteps from '../screens/Main/IndividualSteps';
import ConversationScreen from '../screens/Main/Message/conversation';
import NotificationSettings from '../screens/Main/notificationSettings/index';
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
import ConfirmLogin from '../screens/Auth/Login/ConfirmLogin';
import EmailChange from '../screens/Main/EmailChange';

const Stack = createNativeStackNavigator();
const Main = () => {
  const toast = useToast();
  const loader = useSelector((state: RootState) => state.general.loader);
  const userProfile = useSelector((state: RootState) => state.auth.userProfile);
  const dispatch = useDispatch();

  const [initializing, setInitializing] = useState<boolean>(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    toast.hideAll();

    if (loader) {
      toast.show(<ActivityIndicator color="#12D2D9" />, {
        placement: 'top',
      });
    } else {
      toast.hideAll();
    }
  }, [loader]);

  const onAuthStateChanged = async function (firebaseUser: FirebaseAuthTypes.User | null) {
    const firebaseToken = await firebaseUser?.getIdToken();

    if (!isEqual(firebaseUser, user)) {
      // if (firebaseUser?.email && firebaseUser?.emailVerified) {
      setUser(firebaseUser);
      dispatch(
        setUserData({
          ...firebaseUser,
          tokenResult: await firebaseUser?.getIdTokenResult(),
        })
      );
      // }
    }

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
        getUserProfile({
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
        ConfirmLogin: {
          path: '/auth/:action',
        },
        SignUp: {
          path: '/signup/:action',
        },
      },
    },
  };
  console.log(userProfile);
  return (
    <NavigationContainer linking={linking}>
      <AppProvider>
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="SignUp">
          {user &&
          token &&
          userProfile &&
          (userProfile?.role == 'individual' || userProfile?.role == 'organization') &&
          user?.emailVerified ? (
            <>
              {userProfile.isProfileCompleted ? (
                <>
                  <Stack.Screen name="Bootombar" component={Drawerr} />
                  <Stack.Screen name="InfluencerStepOne" component={InfluencerStepOne} />
                  <Stack.Screen name="InfluencerStepTwo" component={InfluencerStepTwo} />
                  <Stack.Screen name="InfluencerStepThree" component={InfluencerStepThree} />
                  <Stack.Screen name="Prayer" component={Prayer} />
                  <Stack.Screen name="Help" component={Help} />
                  <Stack.Screen name="Faqs" component={Faqs} />
                  <Stack.Screen name="RemoveAccount" component={RemoveAccount} />
                  <Stack.Screen name="editProfile" component={EditProfile} />
                  <Stack.Screen name="Settings" component={Setting} />
                  <Stack.Screen name="PasswordChange" component={PasswordChange} />
                  <Stack.Screen name="EmailChange" component={EmailChange} />

                  <Stack.Screen name="phoneValidate" component={PhoneValidate} />
                  <Stack.Screen name="confirm" component={ConfirmPassword} />
                  <Stack.Screen name="newpassword" component={NewPassword} />
                  <Stack.Screen name="conversation" component={ConversationScreen} />
                  <Stack.Screen
                    options={{ headerShown: false }}
                    name="NotificationSettings"
                    component={NotificationSettings}
                  />
                  <Stack.Screen
                    name="RemoveAccountConfirmation"
                    component={RemoveAccountConfirmation}
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
                  <Stack.Screen
                    name="ConfirmLogin"
                    component={ConfirmLogin}
                    options={{ presentation: 'modal' }}
                  />
                </>
              ) : (
                <>
                  {userProfile?.role == 'individual' ? (
                    <Stack.Screen name="IndividualSteps" component={IndividualSteps} />
                  ) : (
                    <Stack.Screen name="OrgnizationSteps" component={OrgnizationSteps} />
                  )}
                </>
              )}
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
              <Stack.Screen
                name="ConfirmLogin"
                component={ConfirmLogin}
                options={{ presentation: 'modal' }}
              />
            </>
          )}
        </Stack.Navigator>
      </AppProvider>
    </NavigationContainer>
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
