import {combineReducers} from 'redux';
import authReducer from './AuthReducers';
import GernelReducers from './GernelReducers';
import PrayerReducer from './PrayerReducer';
import SocialReducer from './SocialReducer';
import UserReducers from './UserReducers';

export const rootReducer = combineReducers({
  auth: authReducer,
  gernal: GernelReducers,
  user: UserReducers,
  prayer: PrayerReducer,
  social: SocialReducer,
});
