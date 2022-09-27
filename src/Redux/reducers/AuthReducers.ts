import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { AnyAction, Reducer } from 'redux';
import { ACTIONS } from '../action-types';
import { UserProfile } from '../types';

interface UserData extends FirebaseAuthTypes.User {
  tokenResult: FirebaseAuthTypes.IdTokenResult;
}

type AuthReducer = {
  userToken: string;
  userProfile: UserProfile | null;
  userData: UserData | null;
  errorText: string;
  otpToken: string;
  loginErrors: string[];
  firsrLaunch: boolean;
  FcmToken: string;
};

const initialState: AuthReducer = {
  userToken: '',
  userProfile: null,
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
      };

    case ACTIONS.FETCH_SIGN_UP:
      return {
        ...state,
        //otpToken:action.data.token,
        userProfile: action.data,
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
    case ACTIONS.UPDATE_PROFILE:
    case ACTIONS.FETCH_PROFILE:
      return {
        ...state,
        userProfile: action.data,
      };

    case ACTIONS.UPDATE_USER:
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
        userProfile: null,
        errors: null,
        otpToken: '',
        loginErrors: [],
        userData: null,
      };

    case ACTIONS.SET_USER_NOTIFICATIONS:
      return {
        ...state,

        userProfile: {
          ...state.userProfile,
          ...action.data.notifications,
        },
      };

    default:
      return state;
  }
};

export default authReducer;
