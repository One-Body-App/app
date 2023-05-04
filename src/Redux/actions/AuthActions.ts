import { ACTIONS } from '../action-types';

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
export const getProfile = (data) => ({
  type: ACTIONS.USER_PROFILE,
  data,
});
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

export const forgetPasswordRequest = (data) => (
  console.log('in action'),
  {
    type: ACTIONS.UPDATE_PASSWORD,
    data,
  }
);

export const fitstLounch = (data) => ({
  type: ACTIONS.FIRST_LUNCH,
  data,
});

export const removeSocialAccountRequest = (data) => ({
  type: ACTIONS.REMOVE_SOCIAL_ACCOUNT,
  data,
});
