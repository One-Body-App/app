// --------------- LIBRARIES ---------------
import { call, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import { Alert } from 'react-native';
import { setAccountType, setLoader } from '../actions/GeneralActions';

// --------------- ASSETS ---------------
import { ApiCall } from '@/src/services/api';
// --------------- TYPES ---------------
import {
  ACTIONS,
  GetBadges,
  SetUserBadges,
  GetProfile,
  SignUp,
  SendVerificationEmail,
} from '../action-types';

// --------------- ACTIONS ---------------
import {
  completeLogout,
  setLoginData,
  getProfile,
  setProfile,
  getBadges,
  setUserBadges,
  signUp,
  sendVerificationEmail,
} from '../actions/AuthActions';
import { AccountType, ResponseGenerator } from '@/utils/types';
import { clearAuthTokens, getValidAccessToken, saveAuthTokens } from '@/services/authTokens';
import { disablePushNotifications } from '@/src/services/notification/pushNotificationService';
import { disconnectChatSocket } from '@/src/services/chat/socketClient';
import { signOutSocialProviders } from '@/services/socialAuth';
import { RootState } from '../reducers/rootReducer';

const resolveProfileUpdateErrorMessage = (response: unknown) => {
  if (typeof response === 'string' && response.trim()) {
    return response;
  }

  if (Array.isArray((response as { message?: unknown } | null)?.message)) {
    return (response as { message: string[] }).message.join(', ');
  }

  if (typeof (response as { message?: unknown } | null)?.message === 'string') {
    return (response as { message: string }).message;
  }

  return 'An error occurred during profile update';
};

function* updateProfileRequest(params: {
  data: {
    token: string;
    accountType: AccountType;
    data: FormData;
    go?: Function;
  };
  type: string;
}) {
  try {
    yield put(setLoader(true));
    const res: ResponseGenerator = yield ApiCall({
      params: params.data.data,
      route: `user/update-profile`,
      token: params.data.token,
      verb: 'patch',
      external: false,
      isFormUrlEncode: true,
    });

    if (res?.status == 200) {
      yield put(
        getProfile.Request({ token: params.data.token, accountType: params.data.accountType })
      );

      // yield put(setLoader(false));
      if (params.data.go) {
        params.data.go();
      }
    } else {
      yield put(setLoader(false));
      Alert.alert('Error', resolveProfileUpdateErrorMessage(res?.response), [
        { text: 'Close', onPress: () => console.log('Close Pressed') },
      ]);
    }
  } catch (e) {
    yield put(setLoader(false));
    Alert.alert('Error', resolveProfileUpdateErrorMessage(e), [
      { text: 'Close', onPress: () => console.log('Close Pressed') },
    ]);
    console.log('saga sign up err --- ', e);
    // yield put(setLoader(false));
  }
}
export function* UpdateProfileSaga() {
  yield takeLatest(ACTIONS.Profile_Update, updateProfileRequest);
}

function* loginSocialRequest(params: {
  data: {
    data: { token: string };
    gotoSignup?: Function;
    sendFcm: Function;
    seterror: Function;
  };
  type: string;
}) {
  try {
    const res: ResponseGenerator = yield ApiCall({
      params: params.data.data,
      route: 'auth/social-login',
      verb: 'post',
      token: params.data.data.token,
    });

    if (res?.status == 200) {
      if (res?.response?.email && params.data.gotoSignup) {
        yield put(setProfile(res?.response));
        params.data.gotoSignup();
      } else {
        yield put(setLoader(false));
      }
      params.data.sendFcm(params.data.data.token);
      yield put(setLoginData({ token: params.data.data.token }));
    } else {
      params.data.seterror(res?.response?.message);
      yield put(setLoader(false));
    }
  } catch (e) {
    yield put(setLoader(false));
  }
}
export function* loginSocialSaga() {
  yield takeLatest(ACTIONS.LOGIN_SOCIAL, loginSocialRequest);
}

function* updateOrgProfileRequest(params: {
  data: { data: Record<string, any> | undefined; token: string; go: () => void };
  type: string;
}) {
  try {
    yield put(setLoader(true));
    const res: ResponseGenerator = yield ApiCall({
      params: { ...params.data.data },
      route: 'user/update-profile',
      token: params.data.token,
      verb: 'patch',
    });

    if (res?.status == 200) {
      yield put(getProfile.Request({ token: params.data.token, accountType: 'organization' }));
      yield put(setLoader(false));
      if (params?.data?.go) {
        params?.data?.go();
      }
    } else {
      yield put(setLoader(false));
      Alert.alert('Error', resolveProfileUpdateErrorMessage(res?.response), [
        { text: 'Close', onPress: () => console.log('Close Pressed') },
      ]);
    }
  } catch (e) {
    yield put(setLoader(false));
    Alert.alert('Error', resolveProfileUpdateErrorMessage(e), [
      { text: 'Close', onPress: () => console.log('Close Pressed') },
    ]);
    console.log('saga sign up err --- ', e);
    // yield put(setLoader(false));
  }
}

// export function* GetProfileSaga() {
//   yield takeLatest(ACTIONS.GET_FETCH_PROFILE, getProfileRequest);
// }
// function* getProfileRequest(params) {
//   try {
//     const res: ResponseGenerator = yield ApiCall({
//       route: 'user/my-profile',
//       token: params.data.token,
//       verb: 'get',
//     });
//     console.log(params.data.token);
//     if (res?.status == 200) {
//       yield put(setProfile({ token: params.data.token, ...res.response }));
//       // params?.data?.go();
//       yield put(setLoader(false));
//     } else {
//       yield put(setLoader(false));
//     }
//   } catch (e) {
//
//     yield put(setLoader(false));
//     // yield put(setLoader(false));
//   }
// }
export function* UpdateOrgProfileSaga() {
  yield takeLatest(ACTIONS.ORGProfile_Update, updateOrgProfileRequest);
}
function* getUserProfileRequest(params: {
  pullSavedData: any;
  data: { token: any };
  type: string;
}) {
  try {
    const res: ResponseGenerator = yield ApiCall({
      route: `user/my-profile?pullSavedData=${params.pullSavedData ?? false}`,
      token: params.data.token,
      verb: 'get',
    });
    if (res?.status == 200) {
      yield put(setProfile(res?.response));
      yield put(setLoader(false));
    } else {
      console.log('error', res?.response);
      yield put(setLoader(false));
    }
  } catch (e) {
    yield put(setLoader(false));

    console.log('saga sign up err --- ', e);
    // yield put(setLoader(false));
  }
}
export function* GetUserProfileSaga() {
  yield takeLatest(ACTIONS.USER_PROFILE, getUserProfileRequest);
}

function* removeSocialAccountRequest(params: { data: { type: any; token: any }; type: string }) {
  try {
    const res: ResponseGenerator = yield ApiCall({
      route: `auth/remove-influencer-social-account/${params.data.type}`,
      token: params.data.token,
      verb: 'delete',
    });

    if (res?.status == 200) {
      yield put(getProfile.Request({ token: params.data.token }));
      yield put(setLoader(false));
    } else {
      console.log('error', res?.response);
      yield put(setLoader(false));
    }
  } catch (e) {
    yield put(setLoader(false));

    console.log('saga sign up err --- ', e);
    // yield put(setLoader(false));
  }
}
export function* RemoveSocialAccountSaga() {
  yield takeLatest(ACTIONS.REMOVE_SOCIAL_ACCOUNT, removeSocialAccountRequest);
}

function* signUpSaga(params: { data: any; type: string }) {
  try {
    const res: ResponseGenerator = yield ApiCall({
      params: params.data,
      route: 'auth/register',
      verb: 'post',
    });

    if (res?.status === 200 && res?.response) {
      const tokens = (res?.response as any)?.tokens;
      const accessToken = tokens?.accessToken;
      if (tokens?.accessToken && tokens?.refreshToken) {
        try {
          yield call(saveAuthTokens, tokens);
        } catch (error: any) {
          if (__DEV__) {
            console.warn(
              'Token persistence failed during signup; continuing with in-memory session',
              error?.message
            );
          }
        }
        yield put(setLoginData({ token: accessToken }));
      }
      yield put(setAccountType(''));
      yield put(signUp.Success((res?.response as any)?.user ?? res?.response));
    } else {
      const fallbackMessage =
        (res?.response as any)?.message ??
        (typeof res?.response === 'string' ? res.response : 'That was a glitch on our part.');
      yield put(signUp.Failed(fallbackMessage));
    }
  } catch (e) {
    const fallbackMessage =
      (e as any)?.message ?? 'That was a glitch on our part. Please try again.';
    yield put(signUp.Failed(fallbackMessage));
  }
}
export function* SignUpSaga() {
  yield takeLatest(SignUp.REQUEST, signUpSaga);
}

function* sendVerificationEmailSaga(params: {
  data: any;
  token: string | boolean;
  type: string;
  allowFalseSuccess?: boolean;
}) {
  console.log('SEND VERIFICATION EMAIL SAGA', params);
  try {
    const res: ResponseGenerator = yield ApiCall({
      params: params.data ?? {},
      route: 'auth/sendVerificationEmail',
      verb: 'post',
      token: params.token ?? true,
    });

    console.log('SEND VERIFICATION EMAIL SAGA', res);
    if (res?.status == 200 && (res?.response === true || params.allowFalseSuccess)) {
      yield put(sendVerificationEmail.Success(res?.response));
    } else {
      yield put(sendVerificationEmail.Failed(res?.response));
    }
  } catch (e) {
    yield put(sendVerificationEmail.Failed(e));
  }
}
export function* SendVerificationEmailSaga() {
  yield takeLatest(SendVerificationEmail.REQUEST, sendVerificationEmailSaga);
}

export function* logoutSaga(params: {
  data?: {
    destination?: 'Intro' | 'Login';
    revokeServerSession?: boolean;
    signOutProviders?: boolean;
  };
  type: string;
}) {
  const destination = params.data?.destination ?? 'Intro';
  const revokeServerSession = params.data?.revokeServerSession !== false;
  const shouldSignOutProviders = params.data?.signOutProviders !== false;

  let logoutToken = '';

  try {
    const reduxToken: string = yield select((state: RootState) => state.auth.userToken);

    try {
      const managedToken: string | null = yield call(getValidAccessToken);
      logoutToken = managedToken ?? reduxToken ?? '';
    } catch (_error) {
      logoutToken = reduxToken ?? '';
    }

    try {
      yield call(disablePushNotifications, logoutToken || undefined);
    } catch (_error) {
      // continue with local cleanup
    }

    try {
      yield call(disconnectChatSocket);
    } catch (_error) {
      // continue with local cleanup
    }

    if (shouldSignOutProviders) {
      try {
        yield call(signOutSocialProviders);
      } catch (_error) {
        // continue with local cleanup
      }
    }

    if (revokeServerSession && logoutToken) {
      try {
        yield call(ApiCall, {
          route: 'auth/logout',
          verb: 'post',
          token: logoutToken,
          suppressErrorLog: true,
        });
      } catch (_error) {
        // continue with local cleanup
      }
    }
  } finally {
    try {
      yield call(clearAuthTokens);
    } catch (_error) {
      // continue with auth state reset
    }

    yield put(
      completeLogout({
        destination,
        completedAt: Date.now(),
      })
    );
  }
}

export function* LogoutSaga() {
  yield takeLatest(ACTIONS.LOGOUT, logoutSaga);
}

function* getBadgesSaga(params: { token: string; type: string }) {
  try {
    const res: ResponseGenerator = yield ApiCall({
      route: 'user/badges',
      verb: 'get',
      token: params.token,
    });

    if (res?.status == 200) {
      yield put(getBadges.Success(res?.response?.data));
    } else yield put(getBadges.Failed(res?.response));
  } catch (e) {
    yield put(getBadges.Failed(e));
  }
}

export function* GetBadgesSaga() {
  yield takeEvery(GetBadges.REQUEST, getBadgesSaga);
}

function* setUserBadgesSaga(params: { token: string; badges: any; type: string }) {
  try {
    const res: ResponseGenerator = yield ApiCall({
      route: 'user/assign-badge',
      token: params.token,
      params: { badges: params.badges },
      verb: 'patch',
    });

    if (res?.status === 200) {
      yield put(setUserBadges.Success(res?.response?.data));

      yield put(
        getProfile.Request({
          token: params.token,
        })
      );
    } else yield put(setUserBadges.Failed(res?.response));
  } catch (e) {
    yield put(setUserBadges.Failed(e));
  }
}

export function* SetUserBadgesSaga() {
  yield takeEvery(SetUserBadges.REQUEST, setUserBadgesSaga);
}

const resolveProfileCompleted = (profile: any) => {
  const rawValue = profile?.isProfileCompleted;
  if (rawValue === false || (typeof rawValue === 'string' && rawValue.toLowerCase() === 'false')) {
    return false;
  }

  const profileData = profile?.profile;
  if (!profileData) return false;

  if (profile?.accountType === 'organization') {
    const hasCompany = !!profileData?.companyName;
    const hasContactEmail = !!profileData?.contactEmail;
    const hasContactName = !!profileData?.contactName;
    const hasOrgType = !!profileData?.typeOfOrganization;
    return hasCompany && hasContactEmail && hasContactName && hasOrgType;
  }

  const hasDob = !!profileData?.dateOfBirth;
  const hasLocation = !!profileData?.location?.address;
  const hasInterests =
    Array.isArray(profile?.interests) && profile.interests.filter(Boolean).length > 0;

  return hasDob && hasLocation && hasInterests;
};

function* getProfileSaga(params: { pullSavedData: any; token: string; type: string }) {
  try {
    if (__DEV__) {
      console.log('[getProfileSaga] Starting profile fetch', {
        hasToken: !!params.token,
        pullSavedData: params.pullSavedData,
      });
    }
    const res: ResponseGenerator = yield ApiCall({
      route: `user/my-profile?pullSavedData=${params.pullSavedData ?? false}`,
      token: params.token,
      verb: 'get',
    });

    if (__DEV__) {
      console.log('[getProfileSaga] Profile fetch response', {
        status: res?.status,
        hasResponse: !!res?.response,
        isProfileCompleted: res?.response?.isProfileCompleted,
      });
    }

    if (res?.status === 200) {
      const responseData = res?.response ?? {};
      yield put(
        getProfile.Success({
          token: params.token,
          ...responseData,
          isProfileCompleted: resolveProfileCompleted(responseData),
        })
      );
    } else {
      yield put(getProfile.Failed(res?.response));
    }
    yield put(setLoader(false));
  } catch (e) {
    if (__DEV__) {
      console.log('[getProfileSaga] Profile fetch error:', e);
    }
    yield put(getProfile.Failed(e));
    yield put(setLoader(false));
  }
}

export function* GetProfileSaga() {
  yield takeLatest(GetProfile.REQUEST, getProfileSaga);
}
