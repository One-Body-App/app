import { AnyAction, Reducer } from 'redux';
import { User } from '@/utils/types';
import { ACTIONS, AddUserInterest, GetInterests } from '../action-types';

type UserReducers = {
  addUserInterestSuccess?: boolean | null;
  addUserInterestData?: any;
  getInterestsSuccess?: boolean | null;
  getInterestsData?: any;
  error?: any;
  userInrest: string[];
  userSubscribes: string[];
  allUser: User[];
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

    // Interests
    case AddUserInterest.REQUEST:
      return {
        ...state,
        addUserInterestSuccess: null,
        error: null,
      };
    case AddUserInterest.SUCCESS:
      return {
        ...state,
        addUserInterestSuccess: true,
        addUserInterestData: action.payload,
      };
    case AddUserInterest.FAILED:
      return {
        ...state,
        addUserInterestSuccess: false,
        error: action.payload,
      };

    case GetInterests.REQUEST:
      return {
        ...state,
        getInterestsSuccess: null,
        error: null,
      };
    case GetInterests.SUCCESS:
      return {
        ...state,
        getInterestsSuccess: true,
        getInterestsData: action.payload,
      };
    case GetInterests.FAILED:
      return {
        ...state,
        getInterestsSuccess: false,
        error: action.payload,
      };

    default:
      return state;
  }
};

export default userReducers;
