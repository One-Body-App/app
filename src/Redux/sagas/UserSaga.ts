import { ApiCall } from '@/src/Services/api';
import { ACTIONS, AddUserInterest, GetInterests } from '../action-types';
import Toast from 'react-native-simple-toast';
import { call, put, takeEvery, takeLatest } from 'redux-saga/effects';
import { setChats, setLoader } from '../actions/GeneralActions';
import {
  setUserAll,
  setUserProfile,
  setUserIntrest,
  setUserSubscribe,
  setUserDataNotifications,
  addUserInterest,
  getInterests,
} from '../actions/UserAction';
import { getProfile } from '../actions/AuthActions';

function* UserGetRequest(params) {
  try {
    const res = yield ApiCall({
      token: params.data.token,
      route: `user/my-profile?pullSavedData=${params.pullSavedData ?? false}`,
      verb: 'get',
    });

    if (res?.status == '200') {
      if (params.data.get == 'interests') {
        yield put(setLoader(false));
        yield put(setUserIntrest(res?.response?.interests));
      } else {
        yield put(setLoader(false));

        yield put(setUserProfile(res?.response));
        yield put(getProfile.Success(res?.response));
      }
    } else {
      yield put(setLoader(false));
    }
    if (params.data.go) params.data.go();
  } catch (e) {
    console.log('saga get Intrest and Subscribe err --- ', e);
  }
}
export function* UserGetSaga() {
  yield takeLatest(ACTIONS.GET_User_GET, UserGetRequest);
}

function* GetAllUserRequest(params) {
  try {
    const res = yield ApiCall({
      token: params.data.token,
      route: `user/get-users-to-subscribe${
        params.data?.limit ? `?itemsPerPage=${params.data?.limit}` : ''
      }`,
      verb: 'get',
    });

    if (res?.status == '200') {
      yield put(setUserAll(res?.response?.data));

      yield put(setLoader(false));
    } else {
      yield put(setLoader(false));
      console.log('error', res?.response);
    }
  } catch (e) {
    console.log('saga get all user err --- ', e);
  }
}
export function* GetAllUserSaga() {
  yield takeLatest(ACTIONS.Get_ALLUSER, GetAllUserRequest);
}

function* GetChatRequest(params) {
  try {
    const res = yield ApiCall({
      token: params.data.token,
      route: 'chat/chat-rooms',
      verb: 'get',
    });

    if (res?.status == '200') {
      yield put(setChats(res?.response?.data));
    } else {
      console.log('error', res?.response);
    }
  } catch (e) {
    console.log('saga get all user err --- ', e);
  }
}
export function* GetChatSaga() {
  yield takeLatest(ACTIONS.GET_CHATS, GetChatRequest);
}

//Interests
function* addUserInterestSaga({ params }) {
  try {
    const res = yield ApiCall({
      route: 'user/add-interests',
      token: params?.token,
      verb: 'patch',
      params: { interests: params?.interests },
    });
    if (res?.status == 200) {
      yield put(addUserInterest.Success(res?.response?.data));
    } else yield put(addUserInterest.Failed(res?.response));
  } catch (e) {
    yield put(addUserInterest.Failed(e));
  }
}

export function* AddUserInterestSaga() {
  yield takeEvery(AddUserInterest.REQUEST, addUserInterestSaga);
}

function* getInterestsSaga({ params }) {
  try {
    const res = yield ApiCall({
      route: 'tags/interest',
      verb: 'get',
      token: params?.token,
    });
    if (res?.status == 200) {
      yield put(getInterests.Success(res));
    } else yield put(getInterests.Failed(res?.response));
  } catch (e) {
    yield put(getInterests.Failed(e));
  }
}

export function* GetInterestsSaga() {
  yield takeEvery(GetInterests.REQUEST, getInterestsSaga);
}
