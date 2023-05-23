import { fork, all } from 'redux-saga/effects';
import {
  GetUserProfileSaga,
  loginSaga,
  loginSocialSaga,
  signUpSaga,
  UpdateOrgProfileSaga,
  UpdateProfileSaga,
  GetProfileSaga,
  RemoveSocialAccountSaga,
  GetBadgesSaga,
  SetUserBadgesSaga,
} from './AuthSaga';
import {
  GetAllPrayerLiveSaga,
  GetAllPrayerSaga,
  GetMyPrayerSaga,
  GetTestomniesPrayerSaga,
} from './PrayerSaga';
import { GetAllUserSaga, GetChatSaga, UserGetSaga, GetInterestsSaga } from './UserSaga';

export function* rootSaga() {
  yield all([
    loginSaga(),
    loginSocialSaga(),
    signUpSaga(),
    UpdateProfileSaga(),
    GetUserProfileSaga(),
    RemoveSocialAccountSaga(),
    UpdateOrgProfileSaga(),
    UserGetSaga(),
    GetAllUserSaga(),
    GetMyPrayerSaga(),
    GetAllPrayerSaga(),
    GetTestomniesPrayerSaga(),
    GetAllPrayerLiveSaga(),
    GetChatSaga(),
    GetProfileSaga(),
    GetBadgesSaga(),
    SetUserBadgesSaga(),
    GetInterestsSaga(),
  ]);
}
