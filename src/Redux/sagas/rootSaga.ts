import { fork, all } from 'redux-saga/effects';
import {
  GetUserProfileSaga,
  loginSaga,
  loginSocialSaga,
  signUpSaga,
  UpdateOrgProfileSaga,
  UpdateProfileSaga,
  GetProfileSaga,
} from './AuthSaga';
import {
  GetAllPrayerLiveSaga,
  GetAllPrayerSaga,
  GetMyPrayerSaga,
  GetTestomniesPrayerSaga,
} from './PrayerSaga';
import { GetAllUserSaga, GetChatSaga, UserGetSaga } from './UserSaga';

export function* rootSaga() {
  yield all([
    loginSaga(),
    loginSocialSaga(),
    signUpSaga(),
    UpdateProfileSaga(),
    GetUserProfileSaga(),
    UpdateOrgProfileSaga(),
    UserGetSaga(),
    GetAllUserSaga(),
    GetMyPrayerSaga(),
    GetAllPrayerSaga(),
    GetTestomniesPrayerSaga(),
    GetAllPrayerLiveSaga(),
    GetChatSaga(),
    GetProfileSaga(),
  ]);
}
