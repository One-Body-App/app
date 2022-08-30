import { ACTIONS } from '../action-types';

export const getuserAll = (data) => ({
  type: ACTIONS.Get_ALLUSER,
  data,
});

export const setUserAll = (data) => ({
  type: ACTIONS.Set_ALLUSER,
  data,
});
export const getuserGet = (data) => ({
  type: ACTIONS.GET_User_GET,
  data,
});

export const setUserIntrest = (data) => ({
  type: ACTIONS.SET_User_INTREST,
  data,
});

export const setUserSubscribe = (data) => ({
  type: ACTIONS.SET_User_SUBSCRIBE,
  data,
});

export const getUserData = (data) => ({
  type: ACTIONS.GET_FETCH_PROFILE,
  data,
});

export const setUserData = (data) => ({
  type: ACTIONS.FETCH_PROFILE,
  data,
});
