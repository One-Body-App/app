import axios from 'axios';
import { ApiCall } from '@/services/api';
import { BASE_URL } from './constants';
import { saveAuthTokens } from './authTokens';
import { requestUserPermission } from './notification/notificationServices';

type AuthApiTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
};

type AuthApiResponse<TUser = any> = {
  user: TUser;
  tokens: AuthApiTokens;
};

export type MfaMethod = 'passkey' | 'totp' | 'email' | 'backup';

export type MfaChallengeResponse = {
  mfaRequired: true;
  enrollmentRequired: boolean;
  mfaToken: string;
  preferredMethod: MfaMethod;
  availableMethods: MfaMethod[];
  emailMasked: string;
  reason: 'mandatory_mfa' | 'step_up';
};

const persistTokensSafely = async (tokens?: AuthApiTokens) => {
  if (!tokens?.accessToken) {
    return;
  }

  try {
    await saveAuthTokens(tokens);
  } catch (error: any) {
    if (__DEV__) {
      console.warn('Token persistence failed; continuing with in-memory session', error?.message);
    }
  }
};

export const registerWithEmailAndPassword = async (params: {
  name: string;
  email: string;
  username: string;
  password: string;
  accountType?: string | null;
}) => {
  const res = await ApiCall<AuthApiResponse | MfaChallengeResponse>({
    route: 'auth/register',
    verb: 'post',
    params: {
      ...params,
      accountType: params.accountType ?? undefined,
    },
  });

  if (res.status === 200 && (res.response as any)?.tokens?.accessToken) {
    await persistTokensSafely((res.response as any).tokens);
  }

  return res;
};

export const loginWithEmailAndPassword = async (params: {
  email: string;
  password: string;
  twoFactorCode?: string;
}) => {
  const res = await ApiCall<AuthApiResponse | MfaChallengeResponse>({
    route: 'auth/login',
    verb: 'post',
    params,
  });

  if (res.status === 200 && (res.response as any)?.tokens?.accessToken) {
    await persistTokensSafely((res.response as any).tokens);
  }

  return res;
};

const persistTokensIfProvided = async (response: any) => {
  if (response?.tokens?.accessToken) {
    await persistTokensSafely(response.tokens);
  }
};

export const beginPasskeyRegistration = async (params: {
  mfaToken: string;
  deviceName?: string;
}) => {
  return ApiCall({
    route: 'auth/mfa/passkey/register/begin',
    verb: 'post',
    params,
  });
};

export const finishPasskeyRegistration = async (params: {
  mfaToken: string;
  response: Record<string, any>;
}) => {
  const res = await ApiCall<AuthApiResponse & { backupCodes?: string[] }>({
    route: 'auth/mfa/passkey/register/finish',
    verb: 'post',
    params,
  });
  if (res.status === 200) {
    await persistTokensIfProvided(res.response);
  }
  return res;
};

export const beginAuthenticatedMfaOnboarding = async (token: string) => {
  return ApiCall<MfaChallengeResponse | { mfaRequired: false }>({
    route: 'auth/mfa/onboarding/begin',
    verb: 'post',
    token,
  });
};

export const beginPasskeyLogin = async (params: { mfaToken: string }) => {
  return ApiCall({
    route: 'auth/mfa/passkey/login/begin',
    verb: 'post',
    params,
  });
};

export const finishPasskeyLogin = async (params: {
  mfaToken: string;
  response: Record<string, any>;
}) => {
  const res = await ApiCall<AuthApiResponse>({
    route: 'auth/mfa/passkey/login/finish',
    verb: 'post',
    params,
  });
  if (res.status === 200) {
    await persistTokensIfProvided(res.response);
  }
  return res;
};

export const beginTotpSetup = async (params: { mfaToken: string }) => {
  return ApiCall<{ otpauth: string }>({
    route: 'auth/mfa/totp/setup/begin',
    verb: 'post',
    params,
  });
};

export const verifyTotpSetup = async (params: { mfaToken: string; code: string }) => {
  const res = await ApiCall<AuthApiResponse & { backupCodes?: string[] }>({
    route: 'auth/mfa/totp/setup/verify',
    verb: 'post',
    params,
  });
  if (res.status === 200) {
    await persistTokensIfProvided(res.response);
  }
  return res;
};

export const verifyTotpCode = async (params: { mfaToken: string; code: string }) => {
  const res = await ApiCall<AuthApiResponse>({
    route: 'auth/mfa/totp/verify',
    verb: 'post',
    params,
  });
  if (res.status === 200) {
    await persistTokensIfProvided(res.response);
  }
  return res;
};

export const sendEmailMfaCode = async (params: { mfaToken: string }) => {
  return ApiCall<{ sent: boolean }>({
    route: 'auth/mfa/email/send',
    verb: 'post',
    params,
  });
};

export const verifyEmailMfaCode = async (params: { mfaToken: string; code: string }) => {
  const res = await ApiCall<AuthApiResponse & { backupCodes?: string[] }>({
    route: 'auth/mfa/email/verify',
    verb: 'post',
    params,
  });
  if (res.status === 200) {
    await persistTokensIfProvided(res.response);
  }
  return res;
};

export const verifyBackupCode = async (params: { mfaToken: string; code: string }) => {
  const res = await ApiCall<AuthApiResponse>({
    route: 'auth/mfa/backup/verify',
    verb: 'post',
    params,
  });
  if (res.status === 200) {
    await persistTokensIfProvided(res.response);
  }
  return res;
};

export const verifyEmailTwoFactorCode = async (params: { email: string; code: string }) => {
  const res = await ApiCall<AuthApiResponse>({
    route: 'auth/two-factor/email/verify',
    verb: 'post',
    params,
  });

  if (res.status === 200 && (res.response as any)?.tokens?.accessToken) {
    await persistTokensSafely((res.response as any).tokens);
  }

  return res;
};

export const refreshWithStoredToken = async (refreshToken: string) => {
  const options = {
    method: 'POST',
    url: `${BASE_URL}/auth/refresh`,
    headers: { 'Content-Type': 'application/json' },
    data: { refreshToken },
  };

  return axios.request(options);
};

export const processLogin = async (accessToken: string) => {
  const userProfileResult = await ApiCall({
    token: accessToken,
    route: 'user/my-profile',
    verb: 'get',
  });

  if (userProfileResult.status !== 200) {
    return undefined;
  }

  if (userProfileResult.response && typeof userProfileResult.response === 'object') {
    if (!userProfileResult.response.FCM) {
      await requestUserPermission(accessToken, userProfileResult.response.pushNotificationsEnabled);
    }

    return userProfileResult.response;
  }

  return undefined;
};

export const getTwitterLoginToken = async (
  signup?: boolean,
  confirmation?: boolean,
  influencer?: boolean
) => {
  let params = '';

  if (signup) {
    params = '?signup=1';
  }

  if (confirmation) {
    params = '?confirmation=1';
  }

  if (influencer) {
    params = '?influencer=1';
  }

  const options = {
    method: 'GET',
    url: `${BASE_URL}/auth/twitter-token${params ?? ''}`,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const result = await axios.request(options);
  const token = result.data?.oAuthToken;

  return token;
};
