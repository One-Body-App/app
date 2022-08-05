import {ACTIONS} from '../action-types';

export const comback = data => ({
  type: ACTIONS.COMEBACK,
  data,
});

export const setLoader = data => ({
  type: ACTIONS.SET_LOADER,
  data,
});

export const getPrayers = data => ({
  type: ACTIONS.GET_PRAYERS,
  data,
});

export const setPrayers = data => ({
  type: ACTIONS.SET_PRAYERS,
  data,
});
export const setPrayersLive = data => ({
  type: ACTIONS.SET_PRAYERS_Live,
  data,
});
export const setUserPrayers = data => ({
  type: ACTIONS.SET_USERPRAYERS,
  data,
});
export const setAccountType = data => ({
  type: ACTIONS.SET_ACCOUNTTYPE,
  data,
});
export const setAllSms = data => ({
  type: ACTIONS.SET_ALLSMS,
  data,
});
export const getChats = data => ({
  type: ACTIONS.GET_CHATS,
  data,
});
export const setChats = data => ({
  type: ACTIONS.SET_CHATS,
  data,
});
export const setFaqs = data => ({
  type: ACTIONS.SET_FAQS,
  data,
});
