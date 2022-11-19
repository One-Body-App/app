import { AnyAction, Reducer } from 'redux';
import { ACTIONS } from '../action-types';
import { UserProfile } from '../types';

type UserReducers = {
  userInrest: string[];
  userSubscribes: string[];
  allUser: UserProfile[];
  pushNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  subscribeToNewsletter: boolean;
};

const initialState: UserReducers = {
  userInrest: [],
  userSubscribes: [],
  allUser: [],
  pushNotificationsEnabled: false,
  emailNotificationsEnabled: false,
  subscribeToNewsletter: false,
};

const userReducers: Reducer<UserReducers> = (state = initialState, action: AnyAction) => {
  switch (action.type) {
    case ACTIONS.SET_User_INTREST:
      return {
        ...state,
        userInrest: action.data,
      };

    case ACTIONS.SET_User_SUBSCRIBE:
      return {
        ...state,
        userSubscribes: action.data,
      };

    case ACTIONS.Set_ALLUSER:
      return {
        ...state,
        allUser: action.data,
      };

    default:
      return state;
  }
};

export default userReducers;
