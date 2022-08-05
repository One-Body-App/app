import {ACTIONS} from '../action-types';

const initialState = {
  MyPrayerCurrentPage: 1,
  MyPrayerTotalPage: 1,
  ALLPrayerCurrentPage: 1,
  ALLPrayerTotalPage: 1,
  TestomniesPrayerCurrentPage: 1,
  TestomniesPrayerTotalPage: 1,
  userPrayers: [],
  prayers: [],
  Testomnies: [],
  ALLPrayerLiveCurrentPage: 1,
  ALLPrayerLiveTotalPage: 1,
  prayersLive: [],
};

const PrayerReducer = (state = initialState, action) => {
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

    case ACTIONS.TESTOMNIES_CurrentPage:
      return {
        ...state,
        TestomniesPrayerCurrentPage: action.data,
      };

    case ACTIONS.TESTOMNIES_TotalPaga:
      return {
        ...state,
        TestomniesPrayerTotalPage: action.data,
      };
    case ACTIONS.SET_TESTOMNIES:
      return {
        ...state,
        Testomnies: action.data,
      };

    default:
      return state;
  }
};

export default PrayerReducer;
