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

type EmailTwoFactorChallenge = {
  twoFactorRequired: true;
  method: 'email';
  emailMasked: string;
  reason: 'new_location' | 'admin_policy';
};

export const registerWithEmailAndPassword = async (params: {
  name: string;
  email: string;
  username: string;
  password: string;
  accountType?: string | null;
}) => {
  const res = await ApiCall<AuthApiResponse>({
    route: 'auth/register',
    verb: 'post',
    params: {
      ...params,
      accountType: params.accountType ?? undefined,
    },
  });

  if (res.status === 200 && (res.response as any)?.tokens?.accessToken) {
    await saveAuthTokens((res.response as any).tokens);
  }

  return res;
};

export const loginWithEmailAndPassword = async (params: {
  email: string;
  password: string;
  twoFactorCode?: string;
}) => {
  const res = await ApiCall<AuthApiResponse | EmailTwoFactorChallenge>({
    route: 'auth/login',
    verb: 'post',
    params,
  });

  if (res.status === 200 && (res.response as any)?.tokens?.accessToken) {
    await saveAuthTokens((res.response as any).tokens);
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
    await saveAuthTokens((res.response as any).tokens);
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
