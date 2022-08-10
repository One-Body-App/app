import { AnyAction, Reducer } from 'redux';
import { ACTIONS } from '../action-types';

type GeneralReducers = {
  comeBack: null;
  accountType: string | null;
  loader: boolean;
  allSms: [];
  chats: [];
  faqs: [];
};

const initialState: GeneralReducers = {
  comeBack: null,
  accountType: null,
  loader: false,
  allSms: [],
  chats: [],
  faqs: [],
};

const generalReducers: Reducer<GeneralReducers> = (state = initialState, action: AnyAction) => {
  switch (action.type) {
    case ACTIONS.COMEBACK:
      return {
        ...state,
        comeBack: action.data,
      };

    case ACTIONS.SET_LOADER:
      return {
        ...state,
        loader: action.data,
      };

    case ACTIONS.SET_ACCOUNTTYPE:
      return {
        ...state,
        accountType: action.data,
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

export default generalReducers;
