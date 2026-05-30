import { ACTIONS } from '../action-types';

export const getMyPrayer = (data: any) => ({
  type: ACTIONS.GET_MY_PRAYER,
  data,
});
export const setCurrentPage = (data: any) => ({
  type: ACTIONS.MY_PRAYER_CurrentPage,
  data,
});
export const setTotalPage = (data: any) => ({
  type: ACTIONS.MY_PRAYER_TotalPaga,
  data,
});
export const getAllPrayer = (data: any) => ({
  type: ACTIONS.GET_ALL_PRAYER,
  data,
});
export const getAllPrayerLive = (data: any) => ({
  type: ACTIONS.GET_ALL_PRAYER_LIVE,
  data,
});
export const setAllCurrentPage = (data: any) => ({
  type: ACTIONS.ALL_PRAYER_CurrentPage,
  data,
});
export const setAllTotalPage = (data: any) => ({
  type: ACTIONS.ALL_PRAYER_TotalPaga,
  data,
});

export const setAllLiveCurrentPage = (data: any) => ({
  type: ACTIONS.ALL_Live_PRAYER_CurrentPage,
  data,
});
export const setAllLiveTotalPage = (data: any) => ({
  type: ACTIONS.ALL_Live_PRAYER_TotalPaga,
  data,
});

export const setTestimonies = (data: any) => ({
  type: ACTIONS.SET_TESTIMONIES,
  data,
});

export const getTestimonies = (data: any) => ({
  type: ACTIONS.GET_TESTIMONIES,
  data,
});
export const setTestimoniesCurrentPage = (data: any) => ({
  type: ACTIONS.TESTIMONIES_CurrentPage,
  data,
});
export const setTestimoniesTotalPage = (data: any) => ({
  type: ACTIONS.TESTIMONIES_TotalPaga,
  data,
});
