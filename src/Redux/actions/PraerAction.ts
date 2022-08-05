import {ACTIONS} from '../action-types';

export const getMyPrayer = data => ({
  type: ACTIONS.GET_MY_PRAYER,
  data,
});
export const setCurrentPage = data => ({
  type: ACTIONS.MY_PRAYER_CurrentPage,
  data,
});
export const setTotalPage = data => ({
  type: ACTIONS.MY_PRAYER_TotalPaga,
  data,
});
export const getAllPrayer = data => ({
  type: ACTIONS.GET_ALL_PRAYER,
  data,
});
export const getAllPrayerLive = data => ({
  type: ACTIONS.GET_ALL_PRAYER_LIVE,
  data,
});
export const setAllCurrentPage = data => ({
  type: ACTIONS.ALL_PRAYER_CurrentPage,
  data,
});
export const setAllTotalPage = data => ({
  type: ACTIONS.ALL_PRAYER_TotalPaga,
  data,
});

export const setAllLiveCurrentPage = data => ({
  type: ACTIONS.ALL_Live_PRAYER_CurrentPage,
  data,
});
export const setAllLiveTotalPage = data => ({
  type: ACTIONS.ALL_Live_PRAYER_TotalPaga,
  data,
});

export const setTestimonies = data => ({
  type: ACTIONS.SET_TESTOMNIES,
  data,
});

export const getTestimonies = data => ({
  type: ACTIONS.GET_TESTOMNIES,
  data,
});
export const setTestimoniesCurrentPage = data => ({
  type: ACTIONS.TESTOMNIES_CurrentPage,
  data,
});
export const setTestimoniesTotalPage = data => ({
  type: ACTIONS.TESTOMNIES_TotalPaga,
  data,
});
