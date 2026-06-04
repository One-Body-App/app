import { ApiCall } from '@/services/api';
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

const legacyAuthDisabledResponse = {
  status: 410,
  response: {
    message: 'Legacy API authentication is disabled. Please use Clerk sign-in.',
  },
};

export const registerWithEmailAndPassword = async (_params: {
  name: string;
  email: string;
  username: string;
  password: string;
  accountType?: string | null;
}) => {
  return legacyAuthDisabledResponse as {
    status: number;
    response: AuthApiResponse | MfaChallengeResponse | { message: string };
  };
};

export const loginWithEmailAndPassword = async (_params: {
  email: string;
  password: string;
  twoFactorCode?: string;
}) => {
  return legacyAuthDisabledResponse as {
    status: number;
    response: AuthApiResponse | MfaChallengeResponse | { message: string };
  };
};

export const migrateLegacyPasswordToClerk = async (
  params: { email: string; password: string },
  options?: { suppressErrorLog?: boolean }
) => {
  return ApiCall<{ migrated: boolean }>({
    route: 'auth/clerk/migrate-password',
    verb: 'post',
    params: {
      email: params.email.trim().toLowerCase(),
      password: params.password,
    },
    suppressErrorLog: options?.suppressErrorLog,
  });
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
  return res;
};

export const beginAuthenticatedMfaOnboarding = async (token: string) => {
  return ApiCall<MfaChallengeResponse | { mfaRequired: false }>({
    route: 'auth/mfa/onboarding/begin',
    verb: 'post',
    token,
  });
};

export const beginAuthenticatedMfaLogin = async (token: string) => {
  return ApiCall<MfaChallengeResponse | { mfaRequired: false }>({
    route: 'auth/mfa/login/begin',
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
  return res;
};

export const verifyTotpCode = async (params: { mfaToken: string; code: string }) => {
  const res = await ApiCall<AuthApiResponse>({
    route: 'auth/mfa/totp/verify',
    verb: 'post',
    params,
  });
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
  return res;
};

export const verifyBackupCode = async (params: { mfaToken: string; code: string }) => {
  const res = await ApiCall<AuthApiResponse>({
    route: 'auth/mfa/backup/verify',
    verb: 'post',
    params,
  });
  return res;
};

export const verifyEmailTwoFactorCode = async (_params: { email: string; code: string }) => {
  return legacyAuthDisabledResponse as {
    status: number;
    response: AuthApiResponse | { message: string };
  };
};

export const refreshWithStoredToken = async (_refreshToken: string) => {
  return {
    status: 410,
    data: {
      message: 'Legacy API token refresh is disabled. Please use Clerk sign-in.',
    },
  };
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
