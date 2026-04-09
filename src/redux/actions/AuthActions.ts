// --------------- TYPES ---------------
import { AccountType } from '@/utils/types';
import {
  ACTIONS,
  GetBadges,
  SetUserBadges,
  GetProfile,
  SignUp,
  SendVerificationEmail,
} from '../action-types';

// --------------- ACTIONS ---------------

export const loginSocialRequest = (data: {
  data: { token: string };
  gotoSignup?: Function;
  seterror: Function;
  sendFcm: Function;
}) => ({
  type: ACTIONS.LOGIN_SOCIAL,
  data,
});

export const setLoginData = (data: any) => ({
  type: ACTIONS.FETCH_LOGIN_DATA,
  data,
});

export const signUpRequest = (data: any) => ({
  type: ACTIONS.SIGN_UP,
  data,
});

export const setSignUpData = (data: any) => ({
  type: ACTIONS.FETCH_SIGN_UP,
  data,
});

export const profileUpdate = (data: {
  token: string;
  accountType: AccountType;
  data: FormData;
  go?: Function;
}) => ({
  type: ACTIONS.Profile_Update,
  data,
});
export const orgprofileUpdate = (data: any) => ({
  type: ACTIONS.ORGProfile_Update,
  data,
});
// export const getProfile = (data) => ({
//   type: ACTIONS.USER_PROFILE,
//   data,
// });
export const setProfile = (data: any) => ({
  type: ACTIONS.UPDATE_PROFILE,
  data,
});

export const getUserData = (data: any) => ({
  type: ACTIONS.USER_DATA,
  data,
});
export const setUserData = (data: any) => ({
  type: ACTIONS.UPDATE_USER,
  data,
});

export const otpRequest = (data: any) => ({
  type: ACTIONS.OTP,
  data,
});

export const setOtpData = (data: any) => ({
  type: ACTIONS.FETCH_OTP,
  data,
});
export const logout = (options?: {
  destination?: 'Intro' | 'Login';
  revokeServerSession?: boolean;
  signOutProviders?: boolean;
}) => ({
  type: ACTIONS.LOGOUT,
  data: {
    destination: options?.destination ?? 'Intro',
    revokeServerSession: options?.revokeServerSession ?? true,
    signOutProviders: options?.signOutProviders ?? true,
  },
});

export const completeLogout = (data?: {
  completedAt?: number;
  destination?: 'Intro' | 'Login';
}) => ({
  type: ACTIONS.LOGOUT_COMPLETE,
  data: {
    completedAt: data?.completedAt ?? Date.now(),
    destination: data?.destination ?? 'Intro',
  },
});

export const clearAuthState = () => ({
  type: ACTIONS.CLEAR_AUTH_STATE,
});
export const setFcmToken = (data: any) => ({
  type: ACTIONS.FcmToken,
  data,
});
export const changePasswordRequest = (data: any) => ({
  type: ACTIONS.CHANGE_PASSWORD,
  data,
});

export const forgetPasswordRequest = (data: any) => ({
  type: ACTIONS.UPDATE_PASSWORD,
  data,
});

export const fitstLounch = (data: any) => ({
  type: ACTIONS.FIRST_LUNCH,
  data,
});

export const removeSocialAccountRequest = (data: any) => ({
  type: ACTIONS.REMOVE_SOCIAL_ACCOUNT,
  data,
});

// Sign Up Actions
export const signUp = {
  Request: (params: any) => ({
    type: SignUp.REQUEST,
    ...params,
  }),
  Success: (data: any) => ({
    type: SignUp.SUCCESS,
    payload: data,
  }),
  Failed: (error: any) => ({
    type: SignUp.FAILED,
    payload: error,
  }),
  Reset: () => ({
    type: SignUp.RESET,
  }),
};

// Send Verification Email Actions
export const sendVerificationEmail = {
  Request: (params: any) => ({
    type: SendVerificationEmail.REQUEST,
    ...params,
  }),
  Success: (data: any) => ({
    type: SendVerificationEmail.SUCCESS,
    payload: data,
  }),
  Failed: (error: any) => ({
    type: SendVerificationEmail.FAILED,
    payload: error,
  }),
};

// Badge Actions

export const getBadges = {
  Reset: () => ({
    type: GetBadges.RESET,
  }),
  Request: (params: any) => ({
    type: GetBadges.REQUEST,
    ...params,
  }),
  Success: (data: any) => ({
    type: GetBadges.SUCCESS,
    payload: data,
  }),
  Failed: (error: any) => ({
    type: GetBadges.FAILED,
    payload: error,
  }),
};

export const setUserBadges = {
  Request: (params: any) => ({
    type: SetUserBadges.REQUEST,
    ...params,
  }),
  Success: (data: any) => ({
    type: SetUserBadges.SUCCESS,
    payload: data,
  }),
  Failed: (error: any) => ({
    type: SetUserBadges.FAILED,
    payload: error,
  }),
};

// Profile Actions
export const getProfile = {
  Request: (params: any) => ({
    type: GetProfile.REQUEST,
    ...params,
  }),
  Success: (data: any) => ({
    type: GetProfile.SUCCESS,
    payload: data,
  }),
  Failed: (error: any) => ({
    type: GetProfile.FAILED,
    payload: error,
  }),
};
