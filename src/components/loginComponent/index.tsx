import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, useColorScheme, Platform } from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import { useDispatch, useSelector } from 'react-redux';
import {
  AppleAuthProvider,
  FirebaseAuthTypes,
  GoogleAuthProvider,
  TwitterAuthProvider,
  getAuth,
  getIdToken,
  signInWithCredential,
  signInWithEmailAndPassword,
  reload,
  sendEmailVerification,
  checkActionCode,
  applyActionCode,
  signOut,
} from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LoginManager } from 'react-native-fbsdk-next';
import axios from 'axios';
import { getApp } from '@react-native-firebase/app';

import { useToast } from 'react-native-toast-notifications';
import { useNavigation, useTheme, useFocusEffect } from '@react-navigation/native';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import FontAwesome from '@react-native-vector-icons/fontawesome';
import { openInbox } from 'react-native-email-link';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getHeight } from '@/utils/ResponsiveFun';
import { validateFields } from '@/utils/validation/validate-fields';
import validator from '@/utils/validation/validator';
import GeneralStyle from '../../constants/GeneralStyle';
import Google from '@/assets/svg/G.svg';
import Twitter from '@/assets/svg/Twitter.svg';
import Apple from '@/assets/svg/Apple.svg';
import Button from '../Button';

import { styles } from './styles';
import { requestUserPermission } from '@/services/notification/notificationServices';
import { RootState } from '@/src/redux/reducers/rootReducer';
import {
  loginSocialRequest,
  logout,
  sendVerificationEmail,
  signUp,
  getProfile,
} from '@/src/redux/actions/AuthActions';

import { setAccountType, setLoader } from '@/src/redux/actions/GeneralActions';

import { getTwitterLoginToken, processLogin } from '@/services/login';
import { GOOGLE_LOGIN_CLIENT_ID, OpenURLButton } from '@/services/constants';
import { MainStackParamList } from '@/src/navigator/types';
import StyledText from '../styled/Text';
import { Colors, Typography } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import { button } from '@/src/styles/buttons';
import { borderRadius, borderWidth } from '@/src/styles/outlines';
import StyledTextInput from '../styled/TextInput';
import { fontSize } from '@/src/styles/typography';
import { loadPendingAccountType, clearPendingAccountType } from '@/src/services/accountTypeStorage';

type ProfileScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'ConfirmLogin'>;

interface Props {
  showConfirmationEmailMessage: boolean;
  verifyAccount?: boolean;
  oauth_token?: string;
  oauth_verifier?: string;

  action?: string;

  mode?: string;
  oobCode?: string;
  currentUserEmail?: string;
  onlyPassword?: boolean;
  toScreenRouteParams?: Record<string, string>;
  updateParent?: Function;

  enabledLoginProviders?: string[];
}

const logVerifyEmail = (...args: any[]) => {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
};

function LoginComponent({
  showConfirmationEmailMessage,
  oauth_token,
  oauth_verifier,
  oobCode,
  mode,
  action,
  verifyAccount,

  currentUserEmail,
  onlyPassword,
  toScreenRouteParams,
  enabledLoginProviders,
  updateParent,
}: Props) {
  const dispatch = useDispatch();
  const navigation = useNavigation<ProfileScreenNavigationProp>();

  const authState = useSelector((rootState: RootState) => rootState.auth);
  const userProfile = useSelector((rootState: RootState) => rootState.auth.getProfileData);
  const toScreen = useSelector(
    (rootState: RootState) => rootState.general.loginVerficationBackPage
  );
  const toScreenParams = useSelector(
    (rootState: RootState) => rootState.general.loginVerficationBackPageParams
  );

  const inputRefs = {
    email: useRef<any>(null),
    password: useRef<any>(null),
  };
  const [state, setState] = useState({
    email: currentUserEmail ?? '',
    emailError: '',
    password: '',
    passwordError: '',
  });
  const resetForm = useCallback(() => {
    setState({
      email: currentUserEmail ?? '',
      emailError: '',
      password: '',
      passwordError: '',
    });
  }, [currentUserEmail]);

  const toast = useToast();
  const firebaseAuth = getAuth(getApp());

  const [error, seterror] = useState<string>();
  const [success, setSuccess] = useState<string>('');
  const [hidePass, setHidePass] = useState(true);
  const [isVerificationNeeded, setIsVerificationNeeded] = useState<boolean>(false);
  const [token, setToken] = useState('');
  const [verificationEmailRequested, setVerificationEmailRequested] = useState(false);

  const [newUserCredentials, setNewUserCredentials] =
    useState<FirebaseAuthTypes.UserCredential | null>(null);
  const hasRunFocusVerifyCheck = useRef(false);

  const accountType = useSelector((rootState: RootState) => rootState.general.accountType);

  const changeHandler = useCallback((type: 'email' | 'password', value: string) => {
    setState((prevState) => ({
      ...prevState,
      [type]: value,
      ...(type === 'email' ? { emailError: '' } : {}),
      ...(type === 'password' ? { passwordError: '' } : {}),
    }));
  }, []);
  const gotoSignup = useCallback(async () => {
    setNewUserCredentials(null);
    dispatch(setAccountType(''));

    if (firebaseAuth.currentUser) {
      await reload(firebaseAuth.currentUser);
    }
    if (firebaseAuth.currentUser) {
      await getIdToken(firebaseAuth.currentUser, true);
    }
  }, [dispatch, firebaseAuth]);
  const sendFcm = useCallback((fcmToken: string) => {
    requestUserPermission(fcmToken, true);
  }, []);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_LOGIN_CLIENT_ID,
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });

    // navigation.addListener('beforeRemove', (e) => {
    //   LoginManager.logOut();
    //   if (firebaseAuth.currentUser?.uid) {
    //     firebaseAuth.signOut();

    //     firebaseAuth.currentUser?.reload();
    //   }
    //   dispatch(logout());
    // });
  }, []);

  useEffect(() => {
    if (token) {
      if (firebaseAuth.currentUser) {
        reload(firebaseAuth.currentUser);
      }

      if (Platform.OS === 'android') {
        navigation.replace('MainRoot', {
          screen: 'Main',
          params: { screen: 'HomeTab', params: { screen: 'Notifications' } },
        });
      }
    }
  }, [token, firebaseAuth.currentUser, navigation]);

  useFocusEffect(
    useCallback(() => {
      if (hasRunFocusVerifyCheck.current) {
        resetForm();
        return;
      }
      hasRunFocusVerifyCheck.current = true;
      resetForm();

      const checkVerifiedAndNavigate = async () => {
        const { currentUser } = firebaseAuth;
        if (!currentUser) {
          return;
        }
        try {
          await reload(currentUser);
          logVerifyEmail('[VerifyEmail] focus check after reload', {
            emailVerified: currentUser.emailVerified,
            uid: currentUser.uid,
            platform: Platform.OS,
          });
          if (currentUser.emailVerified) {
            navigation.reset({
              index: 0,
              routes: [{ name: 'MainRoot' }],
            });
          }
        } catch (err) {
          logVerifyEmail('[VerifyEmail] focus check failed', err);
        }
      };

      checkVerifiedAndNavigate();
    }, [firebaseAuth, navigation, resetForm])
  );

  useEffect(() => {
    logVerifyEmail('[VerifyEmail] effect check', {
      mode,
      action,
      hasOobCode: !!oobCode,
      oobCodeLength: oobCode?.length,
      platform: Platform.OS,
      hasCurrentUser: !!firebaseAuth.currentUser,
      currentUserEmail: firebaseAuth.currentUser?.email,
    });

    if (mode === 'verifyEmail' && action === 'action' && oobCode) {
      logVerifyEmail('[VerifyEmail] Starting verification process', {
        mode,
        action,
        hasOobCode: !!oobCode,
        oobCodeLength: oobCode?.length,
        platform: Platform.OS,
        hasCurrentUser: !!firebaseAuth.currentUser,
        currentUserEmail: firebaseAuth.currentUser?.email,
      });

      const verifyEmail = async () => {
        try {
          logVerifyEmail('[VerifyEmail] Step 1: Checking action code');
          const result = await checkActionCode(firebaseAuth, oobCode);
          logVerifyEmail('[VerifyEmail] Step 2: Action code checked', {
            operation: result.operation,
            email: result.data.email,
          });

          if (result.operation === 'VERIFY_EMAIL') {
            logVerifyEmail('[VerifyEmail] Step 3: Applying action code');
            await applyActionCode(firebaseAuth, oobCode);
            logVerifyEmail('[VerifyEmail] Step 4: Action code applied');

            // Reload the current user to update emailVerified status
            const { currentUser } = firebaseAuth;
            logVerifyEmail('[VerifyEmail] Step 5: Current user check', {
              hasCurrentUser: !!currentUser,
              currentUserEmail: currentUser?.email,
            });

            if (currentUser) {
              logVerifyEmail('[VerifyEmail] Step 6: Reloading user');
              await reload(currentUser);
              logVerifyEmail('[VerifyEmail] Step 7: After reload', {
                emailVerified: currentUser.emailVerified,
                uid: currentUser.uid,
              });

              // Poll briefly to allow emailVerified to propagate (iOS can lag)
              let verified = currentUser.emailVerified;
              logVerifyEmail('[VerifyEmail] Step 8: Starting polling loop', {
                initialVerified: verified,
              });
              /* eslint-disable no-await-in-loop */
              for (let i = 0; i < 3 && !verified; i += 1) {
                await new Promise<void>((resolve) => {
                  setTimeout(resolve, 500);
                });
                await reload(currentUser);
                verified = currentUser.emailVerified;
                logVerifyEmail('[VerifyEmail] Polling emailVerified', {
                  emailVerified: verified,
                  attempt: i + 1,
                });
              }
              /* eslint-enable no-await-in-loop */

              logVerifyEmail('[VerifyEmail] Step 9: Polling complete', { finalVerified: verified });

              // Force token refresh to ensure global state updates and profile fetch
              logVerifyEmail('[VerifyEmail] Step 10: Getting new ID token');
              const newToken = await getIdToken(currentUser, true);
              logVerifyEmail('[VerifyEmail] Step 11: Got new token', { hasToken: !!newToken });

              // Explicitly trigger profile fetch to ensure it happens on iOS
              // This is critical because onIdTokenChanged might not fire quickly enough
              if (newToken) {
                logVerifyEmail('[VerifyEmail] Step 12: Dispatching profile fetch');
                dispatch(getProfile.Request({ token: newToken }));
              }

              // Wait a brief moment to allow profile fetch to start
              // This is critical on iOS where navigation timing can cause race conditions
              logVerifyEmail('[VerifyEmail] Step 13: Waiting for profile fetch to start');
              await new Promise<void>((resolve) => {
                setTimeout(() => resolve(), 600);
              });

              // Now navigate - AppContent will have profile data or be loading it
              logVerifyEmail('[VerifyEmail] Step 14: Preparing navigation', {
                emailVerified: firebaseAuth.currentUser?.emailVerified,
              });

              if (firebaseAuth.currentUser?.emailVerified) {
                logVerifyEmail('[VerifyEmail] Step 15: Navigating to MainRoot');
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'MainRoot' }],
                });
              } else {
                logVerifyEmail('[VerifyEmail] Step 15: Showing success message (not verified)');
                setSuccess('Email verification successful. Please Sign in to your account');
              }
            } else {
              logVerifyEmail('[VerifyEmail] No current user - showing success message');
              setSuccess('Email verification successful. Please Sign in to your account');
            }
          } else {
            logVerifyEmail('[VerifyEmail] Operation was not VERIFY_EMAIL', {
              operation: result.operation,
            });
          }
        } catch (e: any) {
          logVerifyEmail('[VerifyEmail] ERROR', {
            message: e?.message,
            code: e?.code,
            platform: Platform.OS,
          });
          seterror('Invalid Verification code, please try again.');
        }
      };
      verifyEmail();
    }

    if (mode === 'verifyAndChangeEmail' && action === 'action' && oobCode) {
      const verifyAndChangeEmail = async () => {
        try {
          const result = await checkActionCode(firebaseAuth, oobCode);
          await applyActionCode(firebaseAuth, oobCode);

          setSuccess('Email changed successful. Please Sign in to your account');
          setState({ ...state, email: result.data.email ?? '' });
        } catch (e: any) {
          if (updateParent) {
            updateParent(false);
          }
          navigation.goBack();
          toast.show('Invalid Verification code, please try again.', {
            placement: 'top',
            type: 'danger',
          });
        }
      };
      verifyAndChangeEmail();
    }
  }, [
    mode,
    action,
    oobCode,
    firebaseAuth,
    navigation,
    state,
    updateParent,
    toast,
    setSuccess,
    seterror,
    dispatch,
  ]);

  useEffect(() => {
    if (!success) {
      return;
    }
    const restoreAccountType = async () => {
      const pendingType = await loadPendingAccountType();
      if (pendingType) {
        dispatch(setAccountType(pendingType));
        await clearPendingAccountType();
      }
    };
    restoreAccountType();
  }, [success, dispatch]);

  // useEffect(() => {
  //   if (action == 'confirmation' && provider == 'twitter') {

  //   }
  // }, [action]);

  useEffect(() => {
    const checkNewUserCredentials = async () => {
      if (newUserCredentials && accountType) {
        const data = {
          email: newUserCredentials?.user.email,
          name: newUserCredentials?.user.displayName,
          socialData: newUserCredentials?.additionalUserInfo,
          userId: newUserCredentials.user.uid,
          token,
          accountType,
        };

        dispatch(loginSocialRequest({ data, seterror, gotoSignup, sendFcm }));
      } else if (newUserCredentials) {
        seterror('User not found, please register to continue');
        newUserCredentials.user.delete();
        LoginManager.logOut();
        await signOut(firebaseAuth);
        if (firebaseAuth.currentUser) {
          await reload(firebaseAuth.currentUser);
        }
        dispatch(logout());
      }
    };

    if (newUserCredentials) {
      checkNewUserCredentials();
    }
  }, [newUserCredentials, accountType, token, dispatch, gotoSignup, firebaseAuth, sendFcm]);

  useEffect(() => {
    if (oauth_token && oauth_verifier) {
      const getTwitterAuthToken = async () => {
        try {
          const options = {
            method: 'POST',
            url: 'https://api.twitter.com/oauth/access_token',
            params: {
              oauth_token,
              oauth_verifier,
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

            const twitterCredential = TwitterAuthProvider.credential(tokenData[0], tokenData[1]);
            const userCredentials = await signInWithCredential(firebaseAuth, twitterCredential);

            if (
              !!verifyAccount &&
              !!onlyPassword &&
              userCredentials.user.email !== currentUserEmail
            ) {
              if (updateParent) {
                updateParent(false);
              }
              navigation.goBack();
              toast.show(`Please login with the current user's email`, {
                type: 'error',
                placement: 'top',
              });
            } else if (verifyAccount) {
              if (toScreen) {
                navigation.goBack();

                navigation.push(toScreen as keyof MainStackParamList, {
                  // setError: seterror,
                  ...toScreenParams,
                });
              } else {
                if (updateParent) {
                  updateParent(true);
                }
                navigation.goBack();
              }
            } else {
              processLogin(userCredentials, setNewUserCredentials, setToken);
            }
          }
        } catch (twitterAuthError: any) {
          if (twitterAuthError.nativeErrorMessage.includes('auth/user-not-found')) {
            seterror('User/password combination not found');
          } else {
            seterror(twitterAuthError.nativeErrorMessage);
          }
        }
      };
      getTwitterAuthToken();
    }
  }, [
    oauth_token,
    oauth_verifier,
    firebaseAuth,
    verifyAccount,
    onlyPassword,
    currentUserEmail,
    updateParent,
    navigation,
    toast,
    toScreen,
    toScreenParams,
  ]);

  useEffect(() => {
    if (authState?.sendVerificationEmailSuccess === true) {
      toast.show(`Verification email successfully sent. Check your inbox.`, {
        type: 'success',
        placement: 'top',
      });
    }
  }, [authState?.sendVerificationEmailSuccess, toast]);

  useEffect(() => {
    if (authState?.sendVerificationEmailSuccess === false) {
      toast.show(`We couldn't send the verification email. Please try again.`, {
        type: 'danger',
        placement: 'top',
      });
    }
  }, [authState?.sendVerificationEmailSuccess, toast]);

  useEffect(() => {
    const shouldAutoSend =
      (isVerificationNeeded || showConfirmationEmailMessage) && !verificationEmailRequested;

    if (!shouldAutoSend) {
      return;
    }

    const sendVerification = async () => {
      const firebaseToken = firebaseAuth.currentUser
        ? await getIdToken(firebaseAuth.currentUser)
        : undefined;
      if (firebaseToken) {
        setVerificationEmailRequested(true);
        dispatch(sendVerificationEmail.Request({ token: firebaseToken }));
      }
    };

    sendVerification();
  }, [
    dispatch,
    isVerificationNeeded,
    showConfirmationEmailMessage,
    verificationEmailRequested,
    firebaseAuth.currentUser,
  ]);

  const signInUser = async () => {
    try {
      const { email, password } = state;
      const emailError = await validator('email', email);
      const passwordError = await validator('password', password);
      seterror('');
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[login] signInUser submit', {
          email,
          verifyAccount: !!verifyAccount,
          onlyPassword: !!onlyPassword,
        });
      }

      if (!!verifyAccount && !!onlyPassword && email !== currentUserEmail) {
        throw new Error("Please login with the current user's email");
      }

      if (!emailError && !passwordError) {
        dispatch(setLoader(true));

        const emailCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log('[login] firebase signIn success', {
            uid: emailCredential.user.uid,
            emailVerified: !!emailCredential.user.emailVerified,
          });
        }

        if (verifyAccount) {
          setState({ ...state, password: '' });

          if (mode === 'verifyEmail') {
            if (Platform.OS === 'ios') {
              navigation.pop();
            }
            await processLogin(emailCredential, setNewUserCredentials, setToken);
          } else if (toScreen) {
            navigation.goBack();
            navigation.push(toScreen as keyof MainStackParamList, {
              // setError: seterror,
              ...toScreenRouteParams,
            });
          } else {
            if (updateParent) {
              updateParent(true);
            }
            navigation.goBack();
          }
        } else if (emailCredential.user.emailVerified) {
          await processLogin(emailCredential, setNewUserCredentials, setToken);
          dispatch(setLoader(false));
        } else {
          setIsVerificationNeeded(true);
          await processLogin(emailCredential, setNewUserCredentials, setToken);

          dispatch(setLoader(false));
        }

        // dispatch(loginRequest({ data, seterror, gotoOtp, sendFcm }));
      } else {
        setState({ ...state, emailError, passwordError });
      }
    } catch (signInUserError: any) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[login] signInUser error', {
          message: signInUserError?.message,
          code: signInUserError?.code,
        });
      }
      let message = 'User/password combination not found';
      if (
        signInUserError.message &&
        !signInUserError.message.includes('auth/user-not-found') &&
        !signInUserError.message.includes('auth/wrong-password')
      ) {
        message = signInUserError.message;
      }
      if (__DEV__) {
        console.warn('signInUser error', signInUserError?.code, signInUserError?.message);
      }
      seterror(message);
      dispatch(setLoader(false));
    }
  };
  const onTwitterButtonPress = async () => {
    try {
      seterror('');
      setState({ ...state, emailError: '', passwordError: '' });

      const urlToken = await getTwitterLoginToken(false, verifyAccount);

      if (urlToken) {
        OpenURLButton(
          `https://api.twitter.com/oauth/authenticate?oauth_token=${urlToken}`,
          false,
          true,
          verifyAccount
            ? 'onebodyapp://app.onebodyapp.com/auth/confirmation'
            : 'onebodyapp://app.onebodyapp.com/login/twitter'
        );

        // Linking.openURL(`https://api.twitter.com/oauth/authenticate?oauth_token=${urlToken}`);
      }
    } catch (e) {
      // Error handled silently or via other mechanisms
    }
  };

  async function onAppleButtonPress() {
    // performs login request
    // const appleAuthRequestResponse = await appleAuth.performRequest({
    //   requestedOperation: appleAuth.Operation.LOGIN,
    //   requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    // });

    // // get current authentication state for user
    // // /!\ This method must be tested on a real device. On the iOS simulator it always throws an error.
    // const credentialState = await appleAuth.getCredentialStateForUser(
    //   appleAuthRequestResponse.user
    // );

    // // use credentialState response to ensure the user is authenticated
    // if (credentialState === appleAuth.State.AUTHORIZED) {
    //   console.warn('apple response', appleAuthRequestResponse);

    //   // user is authenticated
    // }
    try {
      // Start the sign-in request
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      // Ensure Apple returned a user identityToken
      if (!appleAuthRequestResponse.identityToken) {
        throw new Error('Apple Sign-In failed - no identify token returned');
      }

      // Create a Firebase credential from the response
      const { identityToken, nonce } = appleAuthRequestResponse;
      const appleCredential = AppleAuthProvider.credential(identityToken, nonce);

      const credentialState = await appleAuth.getCredentialStateForUser(
        appleAuthRequestResponse.user
      );

      if (credentialState === appleAuth.State.AUTHORIZED) {
        const userCredentials = await signInWithCredential(firebaseAuth, appleCredential);

        processLogin(userCredentials, setNewUserCredentials, setToken);
      }
    } catch (appleAuthError: any) {
      if (appleAuthError.code !== appleAuth.Error.CANCELED && appleAuthError.message)
        seterror(appleAuthError.message);
    }
  }

  const googleSignIn = async () => {
    try {
      seterror('');
      dispatch(setLoader(true));
      setState({ ...state, emailError: '', passwordError: '' });

      // Get the users ID token
      const { idToken } = await GoogleSignin.signIn();

      // Create a Google credential with the token
      const googleCredential = GoogleAuthProvider.credential(idToken);
      const userCredentials = await signInWithCredential(firebaseAuth, googleCredential);

      if (!!verifyAccount && !!onlyPassword && userCredentials.user.email !== currentUserEmail) {
        navigation.goBack();
        toast.show(`Please login with the current user's email`, {
          type: 'error',
          placement: 'top',
        });
      } else if (verifyAccount) {
        if (toScreen) {
          navigation.goBack();

          navigation.push(toScreen as keyof MainStackParamList, {
            // setError: seterror,
            ...toScreenParams,
          });
        } else {
          if (updateParent) {
            updateParent(true);
          }
          navigation.goBack();
        }
      } else {
        await processLogin(userCredentials, setNewUserCredentials, setToken);
      }
      dispatch(setLoader(false));
    } catch (signInError: any) {
      if (!signInError.message.includes('Code=-5')) {
        seterror(signInError.message.replace(`[${signInError.code}]`, ''));
      }
    }
  };

  const scheme = useColorScheme();
  const { colors } = useTheme();
  const isDark = scheme === 'dark';
  const brandWhite = '#f6f6f7';

  const [resendAttempts, setResendAttempts] = useState(0);
  const [resendMessage, setResendMessage] = useState<string>('');

  if (isVerificationNeeded || (showConfirmationEmailMessage && userProfile)) {
    return (
      <View style={{ marginHorizontal: spacing.x16, flex: 1, marginTop: spacing.x24 }}>
        <StyledText style={[Typography.header.h1, isDark ? { color: brandWhite } : undefined]}>
          Verify your email address
        </StyledText>
        <StyledText
          style={[
            Typography.subheader.R,
            { color: isDark ? brandWhite : Colors.neutral[300], marginTop: spacing.x8 },
          ]}
        >
          You’ll need to verify your email to complete your account activation.
        </StyledText>
        <StyledText
          style={[
            Typography.subheader.R,
            {
              ...fontSize.x1,
              color: isDark ? brandWhite : Colors.primarySapphire[300],
              marginTop: spacing.x8,
              marginBottom: spacing.x48,
            },
          ]}
        >
          Check your junk/spam folder if the Verification email is not received.
        </StyledText>
        <Button
          text="Go to My Email"
          btnStyle={[
            button.primary,
            {
              flex: 1,
            },
          ]}
          onPress={() => {
            openInbox();
          }}
          btnTextStyle={[{ color: '#fff' }]}
        />
        <Button
          onPress={async () => {
            const firebaseToken = firebaseAuth.currentUser
              ? await getIdToken(firebaseAuth.currentUser)
              : undefined;
            dispatch(sendVerificationEmail.Request({ token: firebaseToken }));
          }}
          text="Didn’t receive the mail? "
          wrapperViewBtnStyle={{ marginTop: 40, justifyContent: 'center' }}
          btnTextStyle={[Typography.subheader.R, { color: Colors.neutral[300] }]}
          rightIcon={
            <StyledText style={{ color: Colors.primarySapphire.brand }}>Resend email</StyledText>
          }
        />
      </View>
    );
  }

  const getButtonTextStyle = () => {
    return { ...styles.btnTitle, color: scheme === 'dark' ? '#838383' : Colors.primary.brand };
  };

  const getButtonContainer = () => {
    return { ...styles.buttonContainer, borderColor: colors.border };
  };

  const getDisabledButtonTextStyle = () => {
    return {
      ...styles.disabledBtnTextStyle,
      color: scheme === 'dark' ? '#3a3a3a' : '#B3C1C5',
      borderColor: colors.border,
    };
  };

  const getDisabledButtonStyle = () => {
    return { ...styles.disabledButtonContainer, borderColor: colors.border };
  };

  if (verifyAccount) {
    return (
      <View
        style={{
          flex: 1,
          marginHorizontal: spacing.x16,
          paddingVertical: spacing.x24,
          justifyContent: 'space-between',
        }}
      >
        <View>
          <StyledText
            style={[Typography.header.h1, { color: isDark ? brandWhite : Colors.primary.brand }]}
          >
            Verify your Email address
          </StyledText>
          <StyledText
            style={[
              Typography.subheader.R,
              {
                color: isDark ? brandWhite : Colors.primary.brand,
                marginTop: spacing.x8,
                lineHeight: 21,
              },
            ]}
          >
            You’ll need to verify your email to complete your account activation.
          </StyledText>

          <View
            style={{
              marginTop: spacing.x24,
              paddingHorizontal: spacing.x16,
              paddingVertical: spacing.x20,
              backgroundColor: colors.card,
              borderRadius: borderRadius.base,
              borderWidth: 1,
              borderColor: Colors.neutral[800],
            }}
          >
            <Button
              text="Open email app"
              btnStyle={[
                button.primary,
                {
                  width: '100%',
                  paddingVertical: spacing.x13,
                  borderRadius: 60,
                },
              ]}
              btnTextStyle={{ color: '#FFF', fontSize: 14, fontWeight: '500', lineHeight: 24 }}
              onPress={() => {
                openInbox();
              }}
            />

            <TouchableOpacity
              style={{ marginTop: spacing.x16, alignSelf: 'center' }}
              onPress={() => {
                if (resendAttempts >= 5) {
                  setResendMessage('Please wait before requesting another verification email.');
                  return;
                }
                const { currentUser } = firebaseAuth;
                if (currentUser) {
                  sendEmailVerification(currentUser)
                    .then(() => {
                      setResendAttempts((prev) => prev + 1);
                      setResendMessage('Verification email sent. Please check your inbox.');
                    })
                    .catch(() => {
                      setResendMessage('Unable to resend right now. Please try again later.');
                    });
                } else {
                  setResendMessage('Please log in again to resend the verification email.');
                }
              }}
            >
              <StyledText style={{ color: Colors.neutral[300] }}>
                Didn’t get mail?{' '}
                <StyledText style={{ color: Colors.primary.brand }}>Resend email</StyledText>
              </StyledText>
            </TouchableOpacity>
            {resendMessage ? (
              <StyledText
                style={{
                  color: Colors.primary.brand,
                  textAlign: 'center',
                  marginTop: spacing.x8,
                  fontSize: 12,
                }}
              >
                {resendMessage}
              </StyledText>
            ) : null}
          </View>
        </View>

        <View style={{ marginTop: spacing.x20 }}>
          <Button
            text="Cancel"
            btnStyle={{
              paddingVertical: spacing.x10,
            }}
            onPress={async () => {
              if (updateParent) {
                updateParent(false);
              }

              navigation.goBack();
              if (!onlyPassword) {
                dispatch(signUp.Reset());
                LoginManager.logOut();
                await signOut(firebaseAuth);
                dispatch(logout());
              }
            }}
            btnTextStyle={{ color: Colors.neutral[300] }}
          />
        </View>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        marginHorizontal: spacing.x16,
      }}
    >
      <View style={{ marginVertical: spacing.x16 }}>
        <StyledText style={[Typography.header.h1]}>
          {verifyAccount ? 'Verify your account information' : 'Welcome back'}
        </StyledText>

        {!verifyAccount ? (
          <StyledText
            style={[Typography.subheader.R, { color: Colors.neutral[300], marginTop: spacing.x8 }]}
          >
            Sign in to your account
          </StyledText>
        ) : null}
      </View>
      <View
        style={{
          paddingHorizontal: spacing.x16,
          paddingVertical: spacing.x24,

          backgroundColor: colors.background,
          borderRadius: borderRadius.base,
          marginBottom: spacing.x64,
        }}
      >
        {verifyAccount && error ? (
          <View style={{ ...styles.Errorview }}>
            <StyledText style={styles.errortext}>{error}</StyledText>
          </View>
        ) : null}
        {!verifyAccount ? (
          <View>
            <TouchableOpacity
              style={{ flexDirection: 'row', marginBottom: spacing.x24, flex: 1 }}
              onPress={() => {
                navigation.replace('AccountType');
              }}
            >
              <StyledText style={{ color: Colors.neutral[300] }}>New to One Body? </StyledText>
              <StyledText style={{ color: Colors.primarySapphire.brand }}>
                Create an account
              </StyledText>
            </TouchableOpacity>
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          {enabledLoginProviders && enabledLoginProviders?.indexOf('password') > -1 ? (
            <View style={{ flex: 2, flexGrow: 1, flexShrink: 0 }}>
              {success ? (
                <View
                  style={[
                    GeneralStyle.MessageView,
                    { backgroundColor: Colors.successFeedback.background },
                  ]}
                >
                  <StyledText style={styles.successtext}>{success}</StyledText>
                </View>
              ) : null}
              <StyledTextInput
                wrapperStyle={{ flex: 1 }}
                ref={inputRefs.email}
                value={state.email}
                returnKeyType="next"
                keyboardType="email-address"
                label="Email"
                autoCorrect={false}
                placeholder="Email address"
                autoComplete="email"
                autoCapitalize="none"
                onFocus={() => setState({ ...state, emailError: '' })}
                onBlur={() =>
                  validateFields(state.email, 'email', (validationError: string) =>
                    setState({ ...state, emailError: validationError })
                  )
                }
                onSubmitEditing={() => inputRefs.password?.current.focus()}
                onChangeText={(email) => changeHandler('email', email.trim())}
              />
              {state.emailError ? (
                <StyledText style={{ ...GeneralStyle.InputError }}>{state.emailError}</StyledText>
              ) : null}

              <StyledTextInput
                wrapperStyle={{ marginTop: 15, flex: 1 }}
                ref={inputRefs.password}
                value={state.password}
                returnKeyType="send"
                label="Password"
                placeholder="Password"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!!hidePass}
                rightIcon={
                  <View style={{ justifyContent: 'center' }}>
                    <MaterialCommunityIcons
                      name={hidePass ? 'eye-outline' : 'eye-off-outline'}
                      size={15}
                      color={Colors.primarySapphire[500]}
                      onPress={() => setHidePass(!hidePass)}
                    />
                  </View>
                }
                onFocus={() => setState({ ...state, passwordError: '' })}
                onSubmitEditing={() => signInUser()}
                onChangeText={(password) => changeHandler('password', password.trim())}
              />
              {state.passwordError ? (
                <StyledText style={{ ...GeneralStyle.InputError }}>
                  {state.passwordError}
                </StyledText>
              ) : null}
            </View>
          ) : null}

          <View style={{ flex: 1, paddingTop: spacing.x32 }}>
            {enabledLoginProviders && enabledLoginProviders?.includes('password') ? (
              <View style={{ marginHorizontal: 10 }}>
                <Button
                  text="Sign in"
                  disabled={!state.password || !state.email}
                  btnStyle={[
                    button.primary,
                    {
                      flex: 1,
                    },
                  ]}
                  disabledBtnStyle={[
                    button.primary,
                    {
                      backgroundColor: Colors.primarySapphire[200],
                      flex: 1,
                      opacity: 0.4,
                    },
                  ]}
                  onPress={() => signInUser()}
                  btnTextStyle={{ color: '#FFF' }}
                />
              </View>
            ) : null}

            {verifyAccount ? (
              <View style={{ marginTop: enabledLoginProviders ? 20 : 0 }}>
                <Button
                  text="Cancel"
                  btnStyle={[
                    {
                      flex: 1,
                    },
                  ]}
                  onPress={async () => {
                    if (updateParent) {
                      updateParent(false);
                    }

                    navigation.goBack();
                    if (!onlyPassword) {
                      dispatch(signUp.Reset());
                      LoginManager.logOut();
                      await signOut(firebaseAuth);
                      dispatch(logout());
                    }
                  }}
                  btnTextStyle={{ color: Colors.neutral[300] }}
                />
              </View>
            ) : null}

            {!verifyAccount && error ? (
              <View style={{ ...styles.Errorview, marginTop: spacing.x24 }}>
                <StyledText style={styles.errortext}>{error}</StyledText>
              </View>
            ) : null}

            {enabledLoginProviders &&
            enabledLoginProviders?.includes('password') &&
            ((enabledLoginProviders && enabledLoginProviders?.includes('google.com')) ||
              (enabledLoginProviders && enabledLoginProviders?.includes('facebook.com')) ||
              (enabledLoginProviders && enabledLoginProviders?.includes('twitter.com'))) ? (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flex: 1,
                  marginTop: spacing.x24,
                }}
              >
                <View
                  style={{
                    borderBottomColor: Colors.neutral[800],
                    borderBottomWidth: borderWidth.thin,
                    flex: 1,
                  }}
                />

                <StyledText style={{ paddingHorizontal: spacing.x10, color: Colors.neutral[300] }}>
                  Or
                </StyledText>
                <View
                  style={{
                    borderBottomColor: Colors.neutral[800],
                    borderBottomWidth: borderWidth.thin,
                    flex: 1,
                  }}
                />
              </View>
            ) : null}

            {enabledLoginProviders ? (
              <View
                style={{
                  marginTop: spacing.x24,
                  flex: 1,
                  flexDirection: 'column',
                }}
              >
                <View style={{ flexDirection: 'row', flex: 1 }}>
                  {enabledLoginProviders &&
                  enabledLoginProviders?.includes('google.com') &&
                  enabledLoginProviders?.includes('password') ? (
                    <View style={{ paddingHorizontal: 10, flex: 1 }}>
                      <Button
                        onPress={() => googleSignIn()}
                        wrapperViewBtnStyle={{ flex: 1 }}
                        leftIcon={<Google style={{ alignSelf: 'center' }} fill="#000" />}
                        btnStyle={[getButtonContainer(), { marginHorizontal: 0, flex: 1 }]}
                      />
                    </View>
                  ) : (
                    // eslint-disable-next-line react/jsx-no-useless-fragment
                    <>
                      {enabledLoginProviders && enabledLoginProviders?.includes('google.com') ? (
                        <Button
                          text="Log in with Google"
                          leftIcon={<Google style={{ marginRight: 7 }} height={getHeight(5)} />}
                          btnStyle={getButtonContainer()}
                          btnTextStyle={getButtonTextStyle()}
                          onPress={() => googleSignIn()}
                          disabledBtnStyle={getDisabledButtonStyle()}
                          disabledBtnTextStyle={getDisabledButtonTextStyle()}
                          wrapperBtnStyle={{ width: '100%' }}
                        />
                      ) : null}
                    </>
                  )}

                  {/* {enabledLoginProviders &&
        enabledLoginProviders?.includes('facebook.com') &&
        enabledLoginProviders?.includes('password') ? (
          <View style={{ paddingHorizontal: 10, flex: 1 }}>
            <Button
              onPress={() => facebookLogin()}
              wrapperViewBtnStyle={{ flex: 1 }}
              leftIcon={<Facebook style={{ alignSelf: 'center' }} fill="#1877f2" />}
              btnStyle={[getButtonContainer(), { marginHorizontal: 0, flex: 1 }]}
            />
          </View>
        ) : (
          // <TouchableOpacity onPress={() => facebookLogin()} style={styles.socialContainer}>
          //   <Facebook style={{ alignSelf: 'center' }} fill="#1877f2" />
          // </TouchableOpacity>
          <>
            {enabledLoginProviders && enabledLoginProviders?.includes('facebook.com') ? (
              <Button
                text={'Login with Facebook'}
                leftIcon={<Facebook style={{ marginLeft: 5, marginRight: 10 }} fill="#1877f2" />}
                btnStyle={getButtonContainer()}
                btnTextStyle={getButtonTextStyle()}
                onPress={() => {
                  facebookLogin();
                }}
                disabledBtnStyle={getDisabledButtonStyle()}
                disabledBtnTextStyle={getDisabledButtonTextStyle()}
                wrapperBtnStyle={{
                  width: '100%',

                  paddingVertical: 10,
                }}
              />
            ) : null}
          </>
        )} */}

                  {enabledLoginProviders &&
                  enabledLoginProviders?.includes('twitter.com') &&
                  enabledLoginProviders?.includes('password') ? (
                    <View style={{ paddingHorizontal: spacing.x10, flex: 1 }}>
                      <Button
                        onPress={() => onTwitterButtonPress()}
                        wrapperViewBtnStyle={{ flex: 1 }}
                        leftIcon={<Twitter fill="#00acee" style={{ alignSelf: 'center' }} />}
                        btnStyle={[
                          getButtonContainer(),
                          {
                            marginHorizontal: 0,
                            flex: 1,
                          },
                        ]}
                      />
                    </View>
                  ) : (
                    // eslint-disable-next-line react/jsx-no-useless-fragment
                    <>
                      {enabledLoginProviders && enabledLoginProviders?.includes('twitter.com') ? (
                        <Button
                          text="Login with Twitter"
                          leftIcon={
                            <Twitter
                              style={{ marginRight: 7 }}
                              height={getHeight(5)}
                              fill="#00acee"
                            />
                          }
                          btnStyle={getButtonContainer()}
                          btnTextStyle={getButtonTextStyle()}
                          onPress={() => {
                            onTwitterButtonPress();
                          }}
                          disabledBtnStyle={getDisabledButtonStyle()}
                          disabledBtnTextStyle={getDisabledButtonTextStyle()}
                          wrapperBtnStyle={{ width: '100%' }}
                        />
                      ) : null}
                    </>
                  )}

                  {enabledLoginProviders &&
                  enabledLoginProviders?.includes('apple') &&
                  enabledLoginProviders?.includes('password') &&
                  Platform.OS === 'ios' ? (
                    <View style={{ paddingHorizontal: spacing.x10, flex: 1 }}>
                      <Button
                        onPress={() => onAppleButtonPress()}
                        wrapperViewBtnStyle={{ flex: 1 }}
                        leftIcon={
                          <FontAwesome
                            name="apple"
                            style={{
                              // flex: 1,
                              // marginRight: getWidth(3),
                              // color: disabled ? (dark ? colors.text : '#B3C1C5') : '',
                              color: colors.text,
                            }}
                            size={22}
                          />
                        }
                        btnStyle={[getButtonContainer(), { marginHorizontal: 0, flex: 1 }]}
                      />
                    </View>
                  ) : (
                    // eslint-disable-next-line react/jsx-no-useless-fragment
                    <>
                      {enabledLoginProviders &&
                      enabledLoginProviders?.includes('apple') &&
                      Platform.OS === 'ios' ? (
                        <Button
                          text="Login with Apple"
                          leftIcon={<Apple style={{ marginRight: 7 }} height={getHeight(5)} />}
                          btnStyle={getButtonContainer()}
                          btnTextStyle={getButtonTextStyle()}
                          onPress={() => {
                            onAppleButtonPress();
                          }}
                          disabledBtnStyle={getDisabledButtonStyle()}
                          disabledBtnTextStyle={getDisabledButtonTextStyle()}
                          wrapperBtnStyle={{ width: '100%' }}
                        />
                      ) : null}
                    </>
                  )}
                </View>
                {!verifyAccount &&
                enabledLoginProviders &&
                enabledLoginProviders?.includes('password') ? (
                  <View style={{ alignItems: 'center', flex: 1, marginTop: spacing.x16 }}>
                    <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                      <StyledText style={{ color: Colors.primarySapphire.brand }}>
                        Forgot Password?
                      </StyledText>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>

        <View />
      </View>
    </View>
  );
}

export default LoginComponent;
