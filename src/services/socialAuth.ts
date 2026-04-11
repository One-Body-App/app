import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import { ApiCall } from './api';
import { AuthTokens, saveAuthTokens } from './authTokens';
import { GOOGLE_LOGIN_CLIENT_ID } from './constants';
import type { MfaChallengeResponse } from './login';

export type SocialProvider = 'google' | 'apple';

export type SocialProfileDetails = {
  email?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
};

export type SocialTokenResult = {
  idToken?: string;
  nonce?: string;
  details?: SocialProfileDetails;
  cancelled?: boolean;
};

export type SocialLoginResponse = {
  tokens?: AuthTokens;
  user?: any;
  isNewUser?: boolean;
  message?: string;
  mfaRequired?: boolean;
  enrollmentRequired?: boolean;
  mfaToken?: string;
  preferredMethod?: MfaChallengeResponse['preferredMethod'];
  availableMethods?: MfaChallengeResponse['availableMethods'];
  emailMasked?: string;
  reason?: MfaChallengeResponse['reason'];
};

const persistTokensSafely = async (tokens?: AuthTokens) => {
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

let googleConfigured = false;

const getGoogleWebClientId = () => {
  const rawValue = GOOGLE_LOGIN_CLIENT_ID?.trim() ?? '';
  if (!rawValue) {
    return '';
  }

  const clientIds = rawValue
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (clientIds.length !== 1) {
    throw new Error(
      'Google Sign-In is misconfigured. GOOGLE_LOGIN_CLIENT_ID must be a single web client ID.'
    );
  }

  return clientIds[0];
};

export const ensureGoogleSigninConfigured = () => {
  if (googleConfigured) return;
  const webClientId = getGoogleWebClientId();
  if (webClientId) {
    GoogleSignin.configure({
      webClientId,
    });
  }
  googleConfigured = true;
};

const createNonce = (length = 32) => {
  const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
};

export const getGoogleIdToken = async (): Promise<SocialTokenResult> => {
  try {
    ensureGoogleSigninConfigured();
    if (!getGoogleWebClientId()) {
      return { idToken: undefined };
    }

    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const userInfo = await GoogleSignin.signIn();
    const idToken = userInfo?.idToken ?? undefined;

    if (!idToken) {
      return { idToken: undefined };
    }

    return {
      idToken,
      details: {
        email: userInfo.user?.email ?? undefined,
        displayName: userInfo.user?.name ?? undefined,
        firstName: userInfo.user?.givenName ?? undefined,
        lastName: userInfo.user?.familyName ?? undefined,
      },
    };
  } catch (error: any) {
    if (error?.code === statusCodes.SIGN_IN_CANCELLED) {
      return { cancelled: true };
    }
    throw error;
  }
};

export const getAppleIdToken = async (): Promise<SocialTokenResult> => {
  try {
    if (!appleAuth.isSupported) {
      return { idToken: undefined };
    }

    const rawNonce = createNonce();

    const appleResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      nonce: rawNonce,
    });

    const idToken = appleResponse?.identityToken ?? undefined;
    if (!idToken) {
      return { idToken: undefined };
    }

    const givenName = appleResponse.fullName?.givenName ?? '';
    const familyName = appleResponse.fullName?.familyName ?? '';
    const displayName = `${givenName} ${familyName}`.trim() || undefined;

    return {
      idToken,
      nonce: rawNonce,
      details: {
        email: appleResponse.email ?? undefined,
        displayName,
        firstName: givenName || undefined,
        lastName: familyName || undefined,
      },
    };
  } catch (error: any) {
    if (error?.code === appleAuth.Error.CANCELED) {
      return { cancelled: true };
    }
    throw error;
  }
};

export const exchangeSocialToken = async (params: {
  provider: SocialProvider;
  idToken: string;
  nonce?: string;
  accountType?: string | null;
  details?: SocialProfileDetails;
}) => {
  const res = await ApiCall<SocialLoginResponse>({
    route: 'auth/social-login',
    verb: 'post',
    params: {
      provider: params.provider,
      idToken: params.idToken,
      token: params.idToken,
      nonce: params.nonce,
      accountType: params.accountType ?? undefined,
      details: params.details,
    },
  });

  if (res.status === 200 && res.response?.tokens?.accessToken) {
    await persistTokensSafely(res.response.tokens);
  }

  return res;
};

const runBestEffortProviderSignOut = async <T>(
  signOutStep: () => Promise<T> | T
): Promise<T | undefined> => {
  try {
    return await signOutStep();
  } catch (error) {
    if (__DEV__) {
      console.log('[Auth Logout] Provider sign-out failed', error);
    }
  }

  return undefined;
};

export const signOutSocialProviders = async () => {
  try {
    ensureGoogleSigninConfigured();
  } catch (error) {
    if (__DEV__) {
      console.log('[Auth Logout] Google Sign-In configure failed during logout', error);
    }
  }

  const hasGoogleSession = await runBestEffortProviderSignOut(() => GoogleSignin.isSignedIn());
  if (hasGoogleSession) {
    await runBestEffortProviderSignOut(() => GoogleSignin.revokeAccess());
    await runBestEffortProviderSignOut(() => GoogleSignin.signOut());
  }
};
