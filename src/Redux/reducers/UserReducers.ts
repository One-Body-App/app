import {ACTIONS} from '../action-types';

const initialState = {
  
  userInrest: [],
  userSubscribes: [],
  allUser:[],
 
};

const UserReducers = (state = initialState, action) => {
  switch (action.type) {
    case ACTIONS.SET_User_INTREST:
      return {
        ...state,
        userInrest: action.data,
      };

    case ACTIONS.SET_User_SUBSCRIBE:
      return {
        ...state,
        userSubscribes: action.data,
      };

      case ACTIONS.Set_ALLUSER:
        return {
          ...state,
          allUser: action.data,
        };
   
    default:
      return state;
  }
};

export default UserReducers;
