import { ACTIONS } from '../action-types';

export const getSocial = (data: any) => ({
  type: ACTIONS.GET_SOCIAL,
  data,
});
export const SetSocial = (data: any) => ({
  type: ACTIONS.SET_SOCIAL,
  data,
});

export const SetAllNews = (data: any) => ({
  type: ACTIONS.SET_ALL_NEWS,
  data,
});

export const SetAllBlog = (data: any) => ({
  type: ACTIONS.SET_ALL_BLOG,
  data,
});

export const SetLocalNews = (data: any) => ({
  type: ACTIONS.SET_LOCAL_NEWS,
  data,
});

export const SetRecentBlog = (data: any) => ({
  type: ACTIONS.SET_RECENT_BLOG,
  data,
});

export const SetTodayNews = (data: any) => ({
  type: ACTIONS.SET_TODAY_NEWS,
  data,
});
