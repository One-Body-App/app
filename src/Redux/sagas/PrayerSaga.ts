import { ApiCall } from '@/src/Services/api';
import { ACTIONS } from '../action-types';
import Toast from 'react-native-simple-toast';
import { call, put, takeEvery, takeLatest } from 'redux-saga/effects';
import { setLoader, setPrayers, setPrayersLive, setUserPrayers } from '../actions/GeneralActions';

import {
  setAllCurrentPage,
  setAllLiveCurrentPage,
  setAllLiveTotalPage,
  setAllTotalPage,
  setCurrentPage,
  setTestimonies,
  setTestimoniesCurrentPage,
  setTestimoniesTotalPage,
  setTotalPage,
} from '../actions/PrayerAction';

function* GetMyPrayerRequest(params) {
  try {
    const res = yield ApiCall({
      route: `prayers/my-prayers`,
      verb: 'get',
      token: params?.data?.token,
    });
    if (res?.status == '200') {
      if (params?.data?.page == 1) {
        yield put(setUserPrayers(res?.response?.data));
      } else {
        const array = [...params?.data?.userPrayers, ...res?.response?.data];
        yield put(setUserPrayers(array));
      }
      yield put(setCurrentPage(parseInt(res?.response.currentPage)));
      yield put(setTotalPage(parseInt(res?.response.totalPages)));
      // params?.data?.setIsLoading(false);
    } else {
      yield put(setLoader(false));
      console.log('error', res?.data);
    }
  } catch (e) {
    console.log('saga get my prayer error -- ', e.toString());
  }
}
export function* GetMyPrayerSaga() {
  yield takeLatest(ACTIONS.GET_MY_PRAYER, GetMyPrayerRequest);
}
function* GetAllPrayerRequest(params) {
  try {
    const res = yield ApiCall({
      route: `prayer/?page=${params?.data?.page}`,
      verb: 'get',
      token: params?.data?.token,
    });
    console.log(res?.status);
    if (res?.status == 200) {
      if (params?.data?.page == 1) {
        yield put(setPrayers(res?.response));
      } else {
        const array = [...params?.data?.Prayers, ...res?.response];
        yield put(setPrayers(array));
      }
      // yield put(setAllCurrentPage(parseInt(res?.response?.currentPage)));
      // yield put(setAllTotalPage(parseInt(res?.response?.totalPages)));
    } else {
      yield put(setLoader(false));
      console.log('error', res?.response);
    }
  } catch (e) {
    console.log('saga get all prayer error -- ', e.toString());
  }
}
export function* GetAllPrayerSaga() {
  yield takeLatest(ACTIONS.GET_ALL_PRAYER, GetAllPrayerRequest);
}
function* GetAllPrayerLiveRequest(params) {
  try {
    const res = yield ApiCall({
      route: `prayers/list?page=${params?.data?.page}`,
      verb: 'get',
      token: params?.data?.token,
    });
    if (res?.status == '200') {
      if (params?.data?.page == 1) {
        yield put(setPrayersLive(res?.response?.data));
      } else {
        const array = [...params?.data?.Prayers, ...res?.response?.data];
        yield put(setPrayersLive(array));
      }
      yield put(setAllLiveCurrentPage(parseInt(res?.response.currentPage)));
      yield put(setAllLiveTotalPage(parseInt(res?.response.totalPages)));
    } else {
      yield put(setLoader(false));
      console.log('error', res?.response);
    }
  } catch (e) {
    console.log('saga get all prayer error -- ', e.toString());
  }
}
export function* GetAllPrayerLiveSaga() {
  yield takeLatest(ACTIONS.GET_ALL_PRAYER_LIVE, GetAllPrayerLiveRequest);
}
function* GetTestomniesPrayerRequest(params) {
  try {
    const res = yield ApiCall({
      route: `prayers/my-prayers?isAnswered=${true}`,
      verb: 'get',
      token: params?.data?.token,
    });
    if (res?.status == '200') {
      console.log('res in Testomnies', res);
      if (params?.data?.page == 1) {
        yield put(setTestimonies(res?.response?.data));
      } else {
        const array = [...params?.data?.Testimonies, ...res?.response?.data];
        yield put(setTestimonies(array));
      }
      yield put(setTestimoniesCurrentPage(parseInt(res?.currentPage)));
      yield put(setTestimoniesTotalPage(parseInt(res?.totalPages)));
    } else {
      yield put(setLoader(false));
      console.log('error', res?.data);
    }
  } catch (e) {
    console.log('saga get Testomnies prayer error -- ', e.toString());
  }
}
export function* GetTestomniesPrayerSaga() {
  yield takeLatest(ACTIONS.GET_TESTIMONIES, GetTestomniesPrayerRequest);
}
