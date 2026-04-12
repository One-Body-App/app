import { all } from 'redux-saga/effects';
import * as AuthSagas from './AuthSaga';
import {
  GetAllPrayerLiveSaga,
  GetAllPrayerSaga,
  GetMyPrayerSaga,
  GetTestomniesPrayerSaga,
} from './PrayerSaga';
import { GetAllUserSaga, GetChatSaga, UserGetSaga, GetInterestsSaga } from './UserSaga';

const invokeSaga = (saga: unknown, name: string) => {
  if (typeof saga === 'function') {
    return saga();
  }

  if (__DEV__) {
    console.warn(`[rootSaga] Skipping missing saga export: ${name}`);
  }

  return undefined;
};

export function* rootSaga() {
  const effects = [
    invokeSaga(AuthSagas.loginSocialSaga, 'loginSocialSaga'),
    invokeSaga(AuthSagas.LogoutSaga, 'LogoutSaga'),
    invokeSaga(AuthSagas.SignUpSaga, 'SignUpSaga'),
    invokeSaga(AuthSagas.UpdateProfileSaga, 'UpdateProfileSaga'),
    invokeSaga(AuthSagas.GetUserProfileSaga, 'GetUserProfileSaga'),
    invokeSaga(AuthSagas.RemoveSocialAccountSaga, 'RemoveSocialAccountSaga'),
    invokeSaga(AuthSagas.UpdateOrgProfileSaga, 'UpdateOrgProfileSaga'),
    UserGetSaga(),
    GetAllUserSaga(),
    GetMyPrayerSaga(),
    GetAllPrayerSaga(),
    GetTestomniesPrayerSaga(),
    GetAllPrayerLiveSaga(),
    GetChatSaga(),
    invokeSaga(AuthSagas.GetProfileSaga, 'GetProfileSaga'),
    invokeSaga(AuthSagas.SendVerificationEmailSaga, 'SendVerificationEmailSaga'),
    invokeSaga(AuthSagas.VerifyEmailTokenSaga, 'VerifyEmailTokenSaga'),
    invokeSaga(AuthSagas.GetBadgesSaga, 'GetBadgesSaga'),
    invokeSaga(AuthSagas.SetUserBadgesSaga, 'SetUserBadgesSaga'),
    GetInterestsSaga(),
  ].filter(Boolean);

  yield all(effects);
}
