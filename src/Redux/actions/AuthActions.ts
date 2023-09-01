// --------------- TYPES ---------------
import {
  ACTIONS,
  GetBadges,
  SetUserBadges,
  GetProfile,
  SignUp,
  SendVerificationEmail,
} from '../action-types';

// --------------- ACTIONS ---------------
export const loginRequest = (data) => ({
  type: ACTIONS.LOGIN,
  data,
});
export const loginSocialRequest = (data) => ({
  type: ACTIONS.LOGIN_SOCIAL,
  data,
});

export const setLoginData = (data) => ({
  type: ACTIONS.FETCH_LOGIN_DATA,
  data,
});

export const signUpRequest = (data) => ({
  type: ACTIONS.SIGN_UP,
  data,
});

export const setSignUpData = (data) => ({
  type: ACTIONS.FETCH_SIGN_UP,
  data,
});

export const profileUpdate = (data) => ({
  type: ACTIONS.Profile_Update,
  data,
});
export const orgprofileUpdate = (data) => ({
  type: ACTIONS.ORGProfile_Update,
  data,
});
// export const getProfile = (data) => ({
//   type: ACTIONS.USER_PROFILE,
//   data,
// });
export const setProfile = (data) => ({
  type: ACTIONS.UPDATE_PROFILE,
  data,
});

export const getUserData = (data) => ({
  type: ACTIONS.USER_DATA,
  data,
});
export const setUserData = (data) => ({
  type: ACTIONS.UPDATE_USER,
  data,
});

export const otpRequest = (data) => ({
  type: ACTIONS.OTP,
  data,
});

export const setOtpData = (data) => ({
  type: ACTIONS.FETCH_OTP,
  data,
});
export const logout = () => ({
  type: ACTIONS.LOGOUT,
  data: null,
});
export const setFcmToken = (data) => ({
  type: ACTIONS.FcmToken,
  data,
});
export const changePasswordRequest = (data) => ({
  type: ACTIONS.CHANGE_PASSWORD,
  data,
});

export const forgetPasswordRequest = (data) => ({
  type: ACTIONS.UPDATE_PASSWORD,
  data,
});

export const fitstLounch = (data) => ({
  type: ACTIONS.FIRST_LUNCH,
  data,
});

export const removeSocialAccountRequest = (data) => ({
  type: ACTIONS.REMOVE_SOCIAL_ACCOUNT,
  data,
});

// Sign Up Actions
export const signUp = {
  Request: (params: any) => ({
    type: SignUp.REQUEST,
    params,
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

//Send Verification Email Actions
export const sendVerificationEmail = {
  Request: (params: any) => ({
    type: SendVerificationEmail.REQUEST,
    params,
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

//Badge Actions
export const getBadges = {
  Request: (params: any) => ({
    type: GetBadges.REQUEST,
    params,
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
    params,
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

//Profile Actions
export const getProfile = {
  Request: (params: any) => ({
    type: GetProfile.REQUEST,
    params,
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
