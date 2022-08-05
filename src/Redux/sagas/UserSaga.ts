import { ApiCall } from '@/services/api';
import { ACTIONS } from '../action-types';
import Toast from 'react-native-simple-toast';
import { call, put, takeEvery, takeLatest } from 'redux-saga/effects';
import { setChats, setLoader } from '../actions/GernalActions';
import { setUserAll, setUserIntrest, setUserSubscribe } from '../actions/UserAction';

function* UserGetRequest(params) {
  try {
    const res = yield ApiCall({
      token: params.data.token,
      route: `${params.data.role}/my-data?get=${params.data.get}`,
      verb: 'get',
    });

    if (res?.status == '200') {
      if (params.data.get == 'interests') {
        console.log('response', res?.response);
        yield put(setLoader(false));
        yield put(setUserIntrest(res?.response?.interests));
      } else {
        console.log('else part in working now', res?.response);
        yield put(setLoader(false));

        yield put(setUserSubscribe(res?.response?.following));
      }
    } else {
      console.log('error', res?.response);
      yield put(setLoader(false));
    }
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
      route: 'user/get-users-to-subscribe',
      verb: 'get',
    });

    if (res?.status == '200') {
      console.log('res all user', res?.response?.data);
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
