import { AnyAction, Reducer } from 'redux';
import { User } from '@/utils/types';
import {
  ACTIONS,
  GetBadges,
  SetUserBadges,
  GetProfile,
  SignUp,
  SendVerificationEmail,
} from '../action-types';

interface UserData {
  email?: string | null;
  emailVerified?: boolean;
  uid?: string;
  tokenResult?: any;
  [key: string]: any;
}

type AuthReducer = {
  signUpSuccess?: boolean;
  signUpData: ArrayLike<any> | null | undefined;
  sendVerificationEmailSuccess?: boolean;
  sendVerificationEmailData: ArrayLike<any> | null | undefined;
  getBadgesSuccess?: boolean;
  setUserBadgesSuccess?: boolean;
  getProfileSuccess?: boolean;
  getProfileError?: string[] | null;
  getBadgesData: any[] | null | undefined;
  getProfileData: User | null | undefined;
  userToken: string;
  userProfile: User | null;
  userData: UserData | null;
  errorText: string;
  otpToken: string;
  loginErrors: string[];
  FcmToken: string;
  error: string[] | null;
  isLoading: boolean;
  logoutPending: boolean;
  logoutCompletedAt?: number;
  logoutDestination?: 'Intro' | 'Login';
};

const initialState: AuthReducer = {
  userToken: '',
  userProfile: null,
  userData: null,
  errorText: '',
  otpToken: '',
  loginErrors: [],
  FcmToken: '',
  error: null,
  signUpData: null,
  sendVerificationEmailData: null,
  getBadgesData: null,
  getProfileData: null,
  getProfileError: null,
  isLoading: false,
  logoutPending: false,
  logoutCompletedAt: undefined,
  logoutDestination: undefined,
};

const resetLogoutState = {
  logoutPending: false,
  logoutCompletedAt: undefined,
  logoutDestination: undefined,
};

const authReducer: Reducer<AuthReducer> = (state = initialState, action: AnyAction) => {
  switch (action.type) {
    case ACTIONS.FETCH_LOGIN_DATA:
      return {
        ...state,
        userToken: action.data?.token,
        ...resetLogoutState,
      };

    case ACTIONS.FETCH_SIGN_UP:
      return {
        ...state,
        // otpToken:action.data.token,
        userProfile: action.data,
        ...resetLogoutState,
      };

    case ACTIONS.FETCH_OTP:
      return {
        ...state,
        otpToken: action.data.token,
        ...resetLogoutState,
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
        ...resetLogoutState,
      };

    case ACTIONS.UPDATE_USER:
      return {
        ...state,
        userData: action.data,
        ...resetLogoutState,
      };
    case ACTIONS.FIRST_LUNCH:
      return {
        ...state,
      };
    case ACTIONS.LOGOUT:
      return {
        ...state,
        logoutPending: true,
        logoutDestination: action.data?.destination ?? 'Intro',
      };

    case ACTIONS.LOGOUT_COMPLETE:
      return {
        ...initialState,
        logoutPending: false,
        logoutCompletedAt: action.data?.completedAt ?? Date.now(),
        logoutDestination: action.data?.destination ?? 'Intro',
      };

    case ACTIONS.CLEAR_AUTH_STATE:
      return {
        ...initialState,
        ...resetLogoutState,
      };

    case ACTIONS.SET_USER_NOTIFICATIONS:
      return {
        ...state,

        userProfile: {
          ...state.userProfile,
          ...action.data.notifications,
        },
      };

    // SignUp
    case SignUp.REQUEST:
      return {
        ...state,
        signUpSuccess: undefined,
        error: null,
      };
    case SignUp.SUCCESS:
      return {
        ...state,
        signUpSuccess: true,
        signUpData: action.payload,
        userProfile: action.payload,
        ...resetLogoutState,
      };
    case SignUp.FAILED:
      return {
        ...state,
        signUpSuccess: false,
        error: action.payload,
      };

    case SignUp.RESET:
      return {
        ...state,
        signUpSuccess: false,
        error: '',
      };

    // Send Verification Email
    case SendVerificationEmail.REQUEST:
      return {
        ...state,
        sendVerificationEmailSuccess: undefined,
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

    // Badges
    case GetBadges.REQUEST:
    case GetBadges.RESET:
      return {
        ...state,
        getBadgesSuccess: undefined,
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
        setUserBadgesSuccess: undefined,
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

    // Profile
    case GetProfile.REQUEST:
      return {
        ...state,
        getProfileSuccess: undefined,
        getProfileError: null,
        isLoading: true,
        error: null,
      };
    case GetProfile.SUCCESS:
      return {
        ...state,
        getProfileSuccess: true,
        getProfileError: null,
        isLoading: false,
        getProfileData: action.payload,
        ...resetLogoutState,
      };
    case GetProfile.FAILED:
      return {
        ...state,
        getProfileSuccess: false,
        getProfileError: action.payload,
        isLoading: false,
        error: action.payload,
      };

    default:
      return state;
  }
};

export default authReducer;
