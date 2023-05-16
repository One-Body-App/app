import { ApiCall } from '@/services/api';
import { ACTIONS } from '../action-types';
import Toast from 'react-native-simple-toast';
import { call, put, takeEvery, takeLatest } from 'redux-saga/effects';
import {
  setSignUpData,
  setLoginData,
  setOtpData,
  getProfile,
  setProfile,
  profileUpdate,
} from '../actions/AuthActions';
import { setAccountType, setLoader } from '../actions/GeneralActions';
import { Alert } from 'react-native';

function* loginRequest(params) {
  try {
    const res = yield ApiCall({
      params: params.data.data,
      route: 'auth/login',
      verb: 'post',
    });

    if (res?.status == '200') {
      yield put(setLoader(false));

      if (res?.user?.email) {
        params.data.gotoOtp();
      }
      params.data.sendFcm(res?.response?.token);
      yield put(setLoginData(res));
      yield put(
        getProfile({
          token: res?.response?.token,
          accountType: res?.response.user.accountType,
        })
      );
    } else {
      params.data.seterror(res?.response?.message);
      yield put(setLoader(false));
    }
  } catch (e) {
    console.log('saga login error -- ', e.toString());
    yield put(setLoader(false));
  }
}
export function* loginSaga() {
  yield takeLatest(ACTIONS.LOGIN, loginRequest);
}

function* loginSocialRequest(params) {
  try {
    const res = yield ApiCall({
      params: params.data.data,
      route: 'auth/social-login',
      verb: 'post',
      token: params.data.token,
    });

    if (res?.status == '200') {
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

function* signUpRequest(params) {
  try {
    const res = yield ApiCall({
      params: params.data.data,
      route: 'user/register',
      verb: 'post',
      token: params.token,
    });

    if (res?.status == '200') {
      yield put(setSignUpData(res?.response));
      params.data.go();
      yield put(setLoader(false));
      yield put(setAccountType(null));
    } else {
      params.data.seterror(res?.response?.message);
      yield put(setLoader(false));
    }
  } catch (e) {
    console.log('saga sign up err --- ', e);
    // yield put(setLoader(false));
  }
}
export function* signUpSaga() {
  yield takeLatest(ACTIONS.SIGN_UP, signUpRequest);
}
function* updateProfileRequest(params) {
  try {
    const res = yield ApiCall({
      params: params.data.data,
      route: `user/update-profile`,
      token: params.data.token,
      verb: 'patch',
      external: false,
      isFormUrlEncode: true,
    });

    if (res?.status == 200) {
      yield put(getProfile({ token: params.data.token, accountType: params.data.accountType }));

      yield put(setLoader(false));
      if (params.data.go) {
        params.data.go();
      }
    } else {
      yield put(setLoader(false));
      Alert.alert('Error', 'An error accoured during profile Update', [
        { text: 'Close', onPress: () => console.log('Close Pressed') },
      ]);
    }
  } catch (e) {
    console.log(e);
    yield put(setLoader(false));
    Alert.alert('Error', 'An error accoured during profile Update', [
      { text: 'Close', onPress: () => console.log('Close Pressed') },
    ]);
    console.log('saga sign up err --- ', e);
    // yield put(setLoader(false));
  }
}
export function* UpdateProfileSaga() {
  yield takeLatest(ACTIONS.Profile_Update, updateProfileRequest);
}
function* updateOrgProfileRequest(params) {
  try {
    const res = yield ApiCall({
      params: { ...params.data.data, accountType: 'organization' },
      route: 'user/update-profile',
      token: params.data.token,
      verb: 'patch',
    });

    if (res?.status == '200') {
      yield put(getProfile({ token: params.data.token, accountType: 'organization' }));
      yield put(setLoader(false));
      params?.data?.go();
    } else {
      yield put(setLoader(false));
      Alert.alert('Error', 'An error accoured during profile Update', [
        { text: 'Close', onPress: () => console.log('Close Pressed') },
      ]);
    }
  } catch (e) {
    yield put(setLoader(false));
    Alert.alert('Error', 'An error accoured during profile Update', [
      { text: 'Close', onPress: () => console.log('Close Pressed') },
    ]);
    console.log('saga sign up err --- ', e);
    // yield put(setLoader(false));
  }
}

export function* GetProfileSaga() {
  yield takeLatest(ACTIONS.GET_FETCH_PROFILE, getProfileRequest);
}
function* getProfileRequest(params) {
  try {
    const res = yield ApiCall({
      route: 'user/my-profile',
      token: params.data.token,
      verb: 'get',
    });
    console.log(params.data.token);
    if (res?.status == '200') {
      yield put(setProfile({ token: params.data.token, ...res.response }));
      // params?.data?.go();
      yield put(setLoader(false));
    } else {
      yield put(setLoader(false));
    }
  } catch (e) {
    console.log(e);
    yield put(setLoader(false));
    // yield put(setLoader(false));
  }
}
export function* UpdateOrgProfileSaga() {
  yield takeLatest(ACTIONS.ORGProfile_Update, updateOrgProfileRequest);
}
function* getUserProfileRequest(params) {
  try {
    const res = yield ApiCall({
      route: `user/my-profile`,
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

function* removeSocialAccountRequest(params) {
  try {
    const res = yield ApiCall({
      route: `auth/remove-influencer-social-account/${params.data.type}`,
      token: params.data.token,
      verb: 'delete',
    });

    if (res?.status == 200) {
      yield put(getProfile({ token: params.data.token }));
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
