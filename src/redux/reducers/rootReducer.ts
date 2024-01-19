import { combineReducers } from 'redux';
import AuthReducer from './AuthReducers';
import GeneralReducers from './GeneralReducers';
import PrayerReducer from './PrayerReducer';
import SocialReducer from './SocialReducer';
import UserReducers from './UserReducers';

export const rootReducer = combineReducers({
  auth: AuthReducer,
  general: GeneralReducers,
  user: UserReducers,
  prayer: PrayerReducer,
  social: SocialReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
