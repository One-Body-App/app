import { fork, all } from 'redux-saga/effects';
import {
  GetUserProfileSaga,
  loginSaga,
  loginSocialSaga,
  SignUpSaga,
  UpdateOrgProfileSaga,
  UpdateProfileSaga,
  GetProfileSaga,
  RemoveSocialAccountSaga,
  GetBadgesSaga,
  SetUserBadgesSaga,
  SendVerificationEmailSaga,
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
    SignUpSaga(),
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
    SendVerificationEmailSaga(),
    GetBadgesSaga(),
    SetUserBadgesSaga(),
    GetInterestsSaga(),
  ]);
}
