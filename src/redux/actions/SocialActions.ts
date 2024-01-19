import { ACTIONS } from '../action-types';

export const getSocial = (data) => ({
  type: ACTIONS.GET_SOCIAL,
  data,
});
export const SetSocial = (data) => ({
  type: ACTIONS.SET_SOCIAL,
  data,
});

export const SetAllNews = (data) => ({
  type: ACTIONS.SET_ALL_NEWS,
  data,
});

export const SetAllBlog = (data) => ({
  type: ACTIONS.SET_ALL_BLOG,
  data,
});

export const SetLocalNews = (data) => ({
  type: ACTIONS.SET_LOCAL_NEWS,
  data,
});

export const SetRecentBlog = (data) => ({
  type: ACTIONS.SET_RECENT_BLOG,
  data,
});

export const SetTodayNews = (data) => ({
  type: ACTIONS.SET_TODAY_NEWS,
  data,
});
