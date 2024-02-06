import { put, takeLatest } from 'redux-saga/effects';
import { ApiCall } from '@/src/services/api';
import { ACTIONS } from '../action-types';
import { setLoader, setPrayers, setPrayersLive, setUserPrayers } from '../actions/GeneralActions';

import {
  setAllLiveCurrentPage,
  setAllLiveTotalPage,
  setCurrentPage,
  setTestimonies,
  setTestimoniesCurrentPage,
  setTestimoniesTotalPage,
  setTotalPage,
} from '../actions/PrayerAction';
import { ResponseGenerator } from '@/utils/types';

function* GetMyPrayerRequest(params: {
  data: { token: any; page: number; userPrayers: any };
  type: string;
}) {
  try {
    const res: ResponseGenerator = yield ApiCall({
      route: `prayers/my-prayers`,
      verb: 'get',
      token: params?.data?.token,
    });
    if (res?.status === 200) {
      if (params?.data?.page == 1) {
        yield put(setUserPrayers(res?.response?.data));
      } else {
        const array = [...(params?.data?.userPrayers ?? {}), ...(res?.response?.data ?? {})];
        yield put(setUserPrayers(array));
      }
      yield put(setCurrentPage(parseInt(res?.response.currentPage, 10)));
      yield put(setTotalPage(parseInt(res?.response.totalPages, 10)));
      // params?.data?.setIsLoading(false);
    } else {
      yield put(setLoader(false));
      console.log('error', res?.response.data);
    }
  } catch (e: any) {
    console.log('saga get my prayer error -- ', e.toString());
  }
}
export function* GetMyPrayerSaga() {
  yield takeLatest(ACTIONS.GET_MY_PRAYER, GetMyPrayerRequest);
}
function* GetAllPrayerRequest(params: {
  data: { page: number; token: any; Prayers: any };
  type: string;
}) {
  try {
    const res: ResponseGenerator = yield ApiCall({
      route: `prayer/?page=${params?.data?.page}`,
      verb: 'get',
      token: params?.data?.token,
    });

    if (res?.status === 200) {
      if (params?.data?.page === 1) {
        yield put(setPrayers(res?.response));
      } else {
        const array = [...(params?.data?.Prayers ?? {}), ...(res?.response ?? {})];
        yield put(setPrayers(array));
      }
      // yield put(setAllCurrentPage(parseInt(res?.response?.currentPage)));
      // yield put(setAllTotalPage(parseInt(res?.response?.totalPages)));
    } else {
      yield put(setLoader(false));
      console.log('error', res?.response);
    }
  } catch (e: any) {
    console.log('saga get all prayer error -- ', e.toString());
  }
}
export function* GetAllPrayerSaga() {
  yield takeLatest(ACTIONS.GET_ALL_PRAYER, GetAllPrayerRequest);
}
function* GetAllPrayerLiveRequest(params: {
  data: { page: number; token: any; Prayers: any };
  type: string;
}) {
  try {
    const res: ResponseGenerator = yield ApiCall({
      route: `prayers/list?page=${params?.data?.page}`,
      verb: 'get',
      token: params?.data?.token,
    });
    if (res?.status === 200) {
      if (params?.data?.page == 1) {
        yield put(setPrayersLive(res?.response?.data));
      } else {
        const array = [...(params?.data?.Prayers ?? {}), ...(res?.response?.data ?? {})];
        yield put(setPrayersLive(array));
      }
      yield put(setAllLiveCurrentPage(parseInt(res?.response.currentPage, 10)));
      yield put(setAllLiveTotalPage(parseInt(res?.response.totalPages, 10)));
    } else {
      yield put(setLoader(false));
      console.log('error', res?.response);
    }
  } catch (e: any) {
    console.log('saga get all prayer error -- ', e.toString());
  }
}
export function* GetAllPrayerLiveSaga() {
  yield takeLatest(ACTIONS.GET_ALL_PRAYER_LIVE, GetAllPrayerLiveRequest);
}
function* GetTestomniesPrayerRequest(params: {
  data: { token: any; page: number; Testimonies: any };
  type: string;
}) {
  try {
    const res: ResponseGenerator = yield ApiCall({
      route: `prayers/my-prayers?isAnswered=${true}`,
      verb: 'get',
      token: params?.data?.token,
    });
    if (res?.status === 200) {
      if (params?.data?.page == 1) {
        yield put(setTestimonies(res?.response?.data));
      } else {
        const array = [...(params?.data?.Testimonies ?? {}), ...(res?.response?.data ?? {})];
        yield put(setTestimonies(array));
      }
      yield put(setTestimoniesCurrentPage(parseInt(res?.response.currentPage, 10)));
      yield put(setTestimoniesTotalPage(parseInt(res?.response.totalPages, 10)));
    } else {
      yield put(setLoader(false));
      console.log('error', res?.response.data);
    }
  } catch (e: any) {
    console.log('saga get Testomnies prayer error -- ', e.toString());
  }
}
export function* GetTestomniesPrayerSaga() {
  yield takeLatest(ACTIONS.GET_TESTIMONIES, GetTestomniesPrayerRequest);
}
