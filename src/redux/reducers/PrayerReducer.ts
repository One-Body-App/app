import { AnyAction, Reducer } from 'redux';
import { ACTIONS } from '../action-types';

type PrayerReducer = {
  MyPrayerCurrentPage: number;
  MyPrayerTotalPage: number;
  ALLPrayerCurrentPage: number;
  ALLPrayerTotalPage: number;
  TestimoniesPrayerCurrentPage: number;
  TestimoniesPrayerTotalPage: number;
  userPrayers: any[];
  prayers: any[];
  Testimonies: any[];
  ALLPrayerLiveCurrentPage: number;
  ALLPrayerLiveTotalPage: number;
  prayersLive: any[];
};

const initialState: PrayerReducer = {
  MyPrayerCurrentPage: 1,
  MyPrayerTotalPage: 1,
  ALLPrayerCurrentPage: 1,
  ALLPrayerTotalPage: 1,
  TestimoniesPrayerCurrentPage: 1,
  TestimoniesPrayerTotalPage: 1,
  userPrayers: [],
  prayers: [],
  Testimonies: [],
  ALLPrayerLiveCurrentPage: 1,
  ALLPrayerLiveTotalPage: 1,
  prayersLive: [],
};

const prayerReducer: Reducer<PrayerReducer> = (state = initialState, action: AnyAction) => {
  switch (action.type) {
    case ACTIONS.MY_PRAYER_CurrentPage:
      return {
        ...state,
        MyPrayerCurrentPage: action.data,
      };
    case ACTIONS.MY_PRAYER_TotalPaga:
      return {
        ...state,
        MyPrayerTotalPage: action.data,
      };
    case ACTIONS.SET_USERPRAYERS:
      return {
        ...state,
        userPrayers: action.data,
      };

    case ACTIONS.ALL_PRAYER_CurrentPage:
      return {
        ...state,
        ALLPrayerCurrentPage: action.data,
      };

    case ACTIONS.ALL_PRAYER_TotalPaga:
      return {
        ...state,
        ALLPrayerTotalPage: action.data,
      };
    case ACTIONS.SET_PRAYERS:
      return {
        ...state,
        prayers: action.data,
      };

    case ACTIONS.ALL_Live_PRAYER_CurrentPage:
      return {
        ...state,
        ALLPrayerLiveCurrentPage: action.data,
      };

    case ACTIONS.ALL_Live_PRAYER_TotalPaga:
      return {
        ...state,
        ALLPrayerLiveTotalPage: action.data,
      };
    case ACTIONS.SET_PRAYERS_Live:
      return {
        ...state,
        prayersLive: action.data,
      };

    case ACTIONS.TESTIMONIES_CurrentPage:
      return {
        ...state,
        TestimoniesPrayerCurrentPage: action.data,
      };

    case ACTIONS.TESTIMONIES_TotalPaga:
      return {
        ...state,
        TestimoniesPrayerTotalPage: action.data,
      };
    case ACTIONS.SET_TESTIMONIES:
      return {
        ...state,
        Testimonies: action.data,
      };

    default:
      return state;
  }
};

export default prayerReducer;
