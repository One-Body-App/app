import { ACTIONS, AddUserInterest, GetInterests } from '../action-types';

export const getuserAll = (data: any) => ({
  type: ACTIONS.Get_ALLUSER,
  data,
});

export const setUserAll = (data: any) => ({
  type: ACTIONS.Set_ALLUSER,
  data,
});
export const getuserGet = (data: any) => ({
  type: ACTIONS.GET_User_GET,
  data,
});

export const setUserIntrest = (data: any) => ({
  type: ACTIONS.SET_User_INTREST,
  data,
});

export const setUserSubscribe = (data: any) => ({
  type: ACTIONS.SET_User_SUBSCRIBE,
  data,
});

export const getUserProfile = (data: any) => ({
  type: ACTIONS.GET_FETCH_PROFILE,
  data,
});

export const setUserProfile = (data: any) => ({
  type: ACTIONS.FETCH_PROFILE,
  data,
});

export const setUserDataNotifications = (data: any) => ({
  type: ACTIONS.SET_USER_NOTIFICATIONS,
  data,
});

export const addUserInterest = {
  Request: (params: any) => ({
    type: AddUserInterest.REQUEST,
    params,
  }),
  Success: (data: any) => ({
    type: AddUserInterest.SUCCESS,
    payload: data,
  }),
  Failed: (error: any) => ({
    type: AddUserInterest.FAILED,
    payload: error,
  }),
};

export const getInterests = {
  Request: (params: any) => ({
    type: GetInterests.REQUEST,
    params,
  }),
  Success: (data: any) => ({
    type: GetInterests.SUCCESS,
    payload: data,
  }),
  Failed: (error: any) => ({
    type: GetInterests.FAILED,
    payload: error,
  }),
};
