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
      console.log('loginnnnnnnnnn', res);
      if (res?.user?.email) {
        params.data.gotoOtp();
      }
      params.data.sendFcm(res?.response?.token);
      yield put(setLoginData(res));
      yield put(
        getProfile({
          token: res?.response?.token,
          role: res?.response.user.role,
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
    });

    if (res?.status == '200') {
      console.log('res', res?.response);
      yield put(setLoader(false));
      if (res?.response?.user?.email) {
        params.data.gotoOtp();
      }
      params.data.sendFcm(res?.response?.token);
      yield put(setLoginData(res?.response));
      yield put(
        getProfile({
          token: res?.response?.token,
          role: res?.response?.user.role,
        })
      );
    } else {
      params.data.seterror(res?.response?.message);
      yield put(setLoader(false));
    }
  } catch (e) {
    console.log('saga social login error -- ', e.toString());
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
      route: 'auth/register',
      verb: 'post',
    });
    console.log(res);
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
  console.log(params);
  try {
    const res = yield ApiCall({
      params: params.data.data,
      route: `${params.data.role}/update-profile`,
      token: params.data.token,
      verb: 'patch',
    });
    console.log(res);
    if (res?.status == '200') {
      yield put(getProfile({ token: params.data.token, role: res?.response?.data.role }));

      yield put(setLoader(false));
      params.data.go();
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
export function* UpdateProfileSaga() {
  yield takeLatest(ACTIONS.Profile_Update, updateProfileRequest);
}
function* updateOrgProfileRequest(params) {
  try {
    const res = yield ApiCall({
      params: params.data.data,
      route: 'organization/update-profile',
      token: params.data.token,
      verb: 'patch',
    });
    if (res?.status == '200') {
      yield put(getProfile({ token: params.data.token, role: res.data.role }));
      params?.data?.go();
      yield put(setLoader(false));
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
export function* UpdateOrgProfileSaga() {
  yield takeLatest(ACTIONS.ORGProfile_Update, updateOrgProfileRequest);
}
function* getUserProfileRequest(params) {
  try {
    const res = yield ApiCall({
      route: `${params.data.role}/my-profile`,
      token: params.data.token,
      verb: 'get',
    });
    if (res?.status == '200') {
      console.log(res);
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

function* OtpRequest(params) {
  console.log('fds');
  try {
    const res = yield ApiCall({
      params: params.data.data,
      route: 'otp/verify',
      verb: 'post',
    });

    if (res.status == '200') {
      yield put(setOtpData(res?.response));
      yield put(setLoader(false));
      params.data.gonext();
    } else {
      params.data.seterror(res.response);
      yield put(setLoader(false));
    }
  } catch (e) {
    console.log('saga sign up err --- ', e);
  }
}
export function* OtpSaga() {
  yield takeLatest(ACTIONS.OTP, OtpRequest);
}

function* ChangePasswordRequest(params) {
  console.log('in dsaga', params.data);
  try {
    const res = yield ApiCall({
      params: params.data.data,
      token: params.data.token,
      route: 'profile/password/update',
      verb: 'post',
    });

    if (res.status == 200) {
      yield put(setLoader(false));
      params.data.gonext();
      Toast.show(res?.response?.message);
    } else {
      yield put(setLoader(false));
      params.data.seterror(res?.response?.errors);
    }
  } catch (e) {
    console.log('saga change pasword err --- ', e);
  }
}
export function* ChangePasswordSaga() {
  yield takeLatest(ACTIONS.CHANGE_PASSWORD, ChangePasswordRequest);
}

function* UpdatePasswordRequest(params) {
  try {
    const res = yield ApiCall({
      params: params.data.data,
      token: params.data.token,
      route: 'password/reset',
      verb: 'post',
    });

    if (res.status == '200') {
      yield put(setLoader(false));

      Toast.show(res?.response?.message);
    } else {
      yield put(setLoader(false));
      params.data.seterror(res?.response?.errors[0]);
      Toast.show(res?.response?.errors[0]);
    }
  } catch (e) {
    console.log('saga change pasword err --- ', e);
  }
}
export function* UpdatePasswordSaga() {
  yield takeLatest(ACTIONS.UPDATE_PASSWORD, UpdatePasswordRequest);
}
