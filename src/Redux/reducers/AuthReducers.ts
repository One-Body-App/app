import { User } from '@/utils/types';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { AnyAction, Reducer } from 'redux';
import {
  ACTIONS,
  GetBadges,
  SetUserBadges,
  GetProfile,
  SignUp,
  SendVerificationEmail,
} from '../action-types';

interface UserData extends FirebaseAuthTypes.User {
  tokenResult: FirebaseAuthTypes.IdTokenResult;
}

type AuthReducer = {
  signUpSuccess: boolean;
  signUpData: ArrayLike<any> | null | undefined;
  sendVerificationEmailSuccess: boolean;
  sendVerificationEmailData: ArrayLike<any> | null | undefined;
  getBadgesSuccess: boolean;
  setUserBadgesSuccess: boolean;
  getProfileSuccess: boolean;
  getBadgesData: ArrayLike<any> | null | undefined;
  getProfileData: ArrayLike<any> | null | undefined;
  userToken: string;
  userProfile: User | null;
  userData: UserData | null;
  errorText: string;
  otpToken: string;
  loginErrors: string[];
  firsrLaunch: boolean;
  FcmToken: string;
  error: string[] | null;
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
  error: null,
};

const authReducer: Reducer<AuthReducer> = (state = initialState, action: AnyAction) => {
  switch (action.type) {
    case ACTIONS.FETCH_LOGIN_DATA:
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
        getProfileData: null,
      };

    case ACTIONS.SET_USER_NOTIFICATIONS:
      return {
        ...state,

        userProfile: {
          ...state.userProfile,
          ...action.data.notifications,
        },
      };

    //SignUp
    case SignUp.REQUEST:
      return {
        ...state,
        signUpSuccess: null,
        error: null,
      };
    case SignUp.SUCCESS:
      return {
        ...state,
        signUpSuccess: true,
        signUpData: action.payload,
        userProfile: action.payload,
      };
    case SignUp.FAILED:
      return {
        ...state,
        signUpSuccess: false,
        error: action.payload,
      };

    //Send Verification Email
    case SendVerificationEmail.REQUEST:
      return {
        ...state,
        sendVerificationEmailSuccess: null,
        error: null,
      };
    case SendVerificationEmail.SUCCESS:
      return {
        ...state,
        sendVerificationEmailSuccess: true,
        sendVerificationEmailData: action.payload,
      };
    case SendVerificationEmail.FAILED:
      return {
        ...state,
        sendVerificationEmailSuccess: false,
        error: action.payload,
      };

    //Badges
    case GetBadges.REQUEST:
      return {
        ...state,
        getBadgesSuccess: null,
        error: null,
      };
    case GetBadges.SUCCESS:
      return {
        ...state,
        getBadgesSuccess: true,
        getBadgesData: action.payload,
      };
    case GetBadges.FAILED:
      return {
        ...state,
        getBadgesSuccess: false,
        error: action.payload,
      };

    case SetUserBadges.REQUEST:
      return {
        ...state,
        setUserBadgesSuccess: null,
        error: null,
      };
    case SetUserBadges.SUCCESS:
      return {
        ...state,
        setUserBadgesSuccess: true,
        setUserBadgesData: action.payload,
      };
    case SetUserBadges.FAILED:
      return {
        ...state,
        setUserBadgesSuccess: false,
        error: action.payload,
      };

    //Profile
    case GetProfile.REQUEST:
      return {
        ...state,
        getProfileSuccess: null,
        error: null,
      };
    case GetProfile.SUCCESS:
      return {
        ...state,
        getProfileSuccess: true,
        getProfileData: action.payload,
      };
    case GetProfile.FAILED:
      return {
        ...state,
        getProfileSuccess: false,
        error: action.payload,
      };

    default:
      return state;
  }
};

export default authReducer;
