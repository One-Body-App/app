import {ACTIONS} from '../action-types';

const initialState = {
  come_back: null,
  AccountType: null,
  loader: false,
  allSms: [],
  chats: [],
  faqs: [],
};

const GernelReducers = (state = initialState, action) => {
  switch (action.type) {
    case ACTIONS.COMEBACK:
      return {
        ...state,
        come_back: action.data,
      };

    case ACTIONS.SET_LOADER:
      return {
        ...state,
        loader: action.data,
      };

    case ACTIONS.SET_ACCOUNTTYPE:
      return {
        ...state,
        AccountType: action.data,
      };
    case ACTIONS.SET_ALLSMS:
      return {
        ...state,
        allSms: action.data,
      };
    case ACTIONS.SET_CHATS:
      return {
        ...state,
        chats: action.data,
      };
    case ACTIONS.SET_FAQS:
      return {
        ...state,
        faqs: action.data,
      };

    default:
      return state;
  }
};

export default GernelReducers;
