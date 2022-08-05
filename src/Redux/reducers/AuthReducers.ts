import {ACTIONS} from '../action-types';

const initialState = {
  userToken: null,
  userData: null,
  errorText: null,
  otpToken: null,
  loginErrors: null,
  firsLounch: true,
  FcmToken: null,
};

const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case ACTIONS.FETCH_LOGIN_DATA:
      console.log('done', action.data);
      return {
        ...state,
        userToken: action.data?.response.token,
        userData: action.data?.response.user,
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
      return {
        ...state,
        userData: action.data,
      };
    case ACTIONS.FIRST_LUNCH:
      return {
        ...state,
        firsLounch: action.data,
      };
    case ACTIONS.LOGOUT:
      return {
        ...state,
        userToken: null,
        userData: null,
        errors: null,
        otpToken: null,
        loginErrors: null,
      };

    default:
      return state;
  }
};

export default authReducer;
