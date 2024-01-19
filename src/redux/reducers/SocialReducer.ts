import { AnyAction, Reducer } from 'redux';
import { ACTIONS } from '../action-types';

type SocialReducer = {
  SocialPost: any[];
  AllBlog: any[];
  TodayNews: any[];
  AllNews: any[];
  LocalNews: any[];
  RecentBlog: any[];
};

const initialState: SocialReducer = {
  SocialPost: [],
  AllBlog: [],
  TodayNews: [],
  AllNews: [],
  LocalNews: [],
  RecentBlog: [],
};

const socialReducer: Reducer<SocialReducer> = (state = initialState, action: AnyAction) => {
  switch (action.type) {
    case ACTIONS.SET_SOCIAL:
      return {
        ...state,
        SocialPost: action.data,
      };
    case ACTIONS.SET_ALL_BLOG:
      return {
        ...state,
        AllBlog: action.data,
      };
    case ACTIONS.SET_ALL_NEWS:
      return {
        ...state,
        AllNews: action.data,
      };
    case ACTIONS.SET_LOCAL_NEWS:
      return {
        ...state,
        LocalNews: action.data,
      };
    case ACTIONS.SET_RECENT_BLOG:
      return {
        ...state,
        RecentBlog: action.data,
      };
    case ACTIONS.SET_TODAY_NEWS:
      return {
        ...state,
        TodayNews: action.data,
      };

    default:
      return state;
  }
};

export default socialReducer;
