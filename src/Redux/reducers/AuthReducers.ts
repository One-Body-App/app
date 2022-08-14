import { AnyAction, Reducer } from 'redux';
import { ACTIONS } from '../action-types';
import { UserData } from '../types';

type AuthReducer = {
  userToken: string;
  userData: UserData | null;
  errorText: string;
  otpToken: string;
  loginErrors: string[];
  firsrLaunch: boolean;
  FcmToken: string;
};

const initialState: AuthReducer = {
  userToken: '',
  userData: null,
  errorText: '',
  otpToken: '',
  loginErrors: [],
  firsrLaunch: true,
  FcmToken: '',
};

const authReducer: Reducer<AuthReducer> = (state = initialState, action: AnyAction) => {
  switch (action.type) {
    case ACTIONS.FETCH_LOGIN_DATA:
      console.log('done', action.data);
      return {
        ...state,
        userToken: action.data?.token,
        userData: action.data?.user,
      };

    case ACTIONS.FETCH_SIGN_UP:
      console.log('action', action.data?.user);
      return {
        ...state,
        //otpToken:action.data.token,
        userToken: action.data?.token,
        userData: action.data?.user,
      };

    case ACTIONS.FETCH_OTP:
      return {
        ...state,
        otpToken: action.data.token,
      };

    case ACTIONS.ERRORS: {
      return {
        ...state,
        errorText: action.errorText,
      };
    }
    case ACTIONS.LOGIN_ERRORS: {
      return {
        ...state,
        loginErrors: action.loginErrors,
      };
    }
    case ACTIONS.UPDATE_USER:
    case ACTIONS.FETCH_PROFILE:
      return {
        ...state,
        userData: action.data,
      };
    case ACTIONS.FIRST_LUNCH:
      return {
        ...state,
        firsrLaunch: action.data,
      };
    case ACTIONS.LOGOUT:
      return {
        ...state,
        userToken: '',
        userData: null,
        errors: null,
        otpToken: '',
        loginErrors: [],
      };

    default:
      return state;
  }
};

export default authReducer;
