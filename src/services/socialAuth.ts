import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import { Buffer } from 'buffer';
import { Platform } from 'react-native';
import { GOOGLE_LOGIN_CLIENT_ID } from './constants';
import type { MfaChallengeResponse } from './login';

export type SocialProvider = 'google' | 'apple';
export type SocialAuthIntent = 'login' | 'signup';

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

type LegacyAuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
};

export type SocialLoginResponse = {
  tokens?: LegacyAuthTokens;
  user?: any;
  isNewUser?: boolean;
  authMethod?: 'social';
  bypassMandatoryMfaOnboarding?: boolean;
  signupRequired?: true;
  provider?: SocialProvider;
  details?: SocialProfileDetails;
  message?: string;
  mfaRequired?: boolean;
  enrollmentRequired?: boolean;
  mfaToken?: string;
  preferredMethod?: MfaChallengeResponse['preferredMethod'];
  availableMethods?: MfaChallengeResponse['availableMethods'];
  emailMasked?: string;
  reason?: MfaChallengeResponse['reason'];
};

let googleConfigured = false;

type GoogleIdTokenDiagnostics = {
  aud?: string | string[];
  azp?: string;
  iss?: string;
  exp?: number;
  hasSub: boolean;
};

const isAndroidGoogleDeveloperError = (error: any) => {
  if (Platform.OS !== 'android') {
    return false;
  }

  const errorDetails = [error?.code, error?.message, error?.description, error?.nativeErrorMessage]
    .filter((value): value is string | number => value !== undefined && value !== null)
    .join(' ')
    .toLowerCase();

  return (
    error?.code === 10 ||
    error?.status === 10 ||
    errorDetails.includes('developer_error') ||
    errorDetails.includes('developer error') ||
    errorDetails.includes('code 10')
  );
};

const logAndroidGoogleDeveloperError = (error: any) => {
  if (!__DEV__ || !isAndroidGoogleDeveloperError(error)) {
    return;
  }

  console.warn(
    '[Google Sign-In] Android DEVELOPER_ERROR detected. Verify GOOGLE_LOGIN_CLIENT_ID is the WEB OAuth client ID and that the Android signing SHA fingerprint is registered in Firebase/Google Cloud.',
    {
      code: error?.code,
      message: error?.message,
    }
  );
};

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const [, payload] = token.split('.');
    if (!payload) {
      return null;
    }

    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddingLength = (4 - (normalizedPayload.length % 4)) % 4;
    const paddedPayload = normalizedPayload.padEnd(normalizedPayload.length + paddingLength, '=');
    const decodedPayload = Buffer.from(paddedPayload, 'base64').toString('utf8');
    const parsedPayload = JSON.parse(decodedPayload);

    return parsedPayload && typeof parsedPayload === 'object' ? parsedPayload : null;
  } catch {
    return null;
  }
};

const getNumericClaim = (payload: Record<string, unknown>, key: 'exp') => {
  const value = Number(payload[key]);
  return Number.isFinite(value) ? value : undefined;
};

const getGoogleIdTokenDiagnostics = (idToken: string): GoogleIdTokenDiagnostics | null => {
  const payload = decodeJwtPayload(idToken);
  if (!payload) {
    return null;
  }

  const audClaim = payload.aud;
  const audIsStringArray =
    Array.isArray(audClaim) && audClaim.every((value) => typeof value === 'string');
  const aud = typeof audClaim === 'string' || audIsStringArray ? audClaim : undefined;

  return {
    aud,
    azp: typeof payload.azp === 'string' ? payload.azp : undefined,
    iss: typeof payload.iss === 'string' ? payload.iss : undefined,
    exp: getNumericClaim(payload, 'exp'),
    hasSub: typeof payload.sub === 'string' && payload.sub.length > 0,
  };
};

const logAndroidGoogleTokenDiagnostics = (idToken: string) => {
  if (!__DEV__ || Platform.OS !== 'android') {
    return;
  }

  const diagnostics = getGoogleIdTokenDiagnostics(idToken);
  if (!diagnostics) {
    console.warn('[Google Sign-In] Android ID token diagnostics unavailable', {
      decodeFailed: true,
    });
    return;
  }

  console.warn('[Google Sign-In] Android ID token claims', diagnostics);
};

const getGoogleSignInData = (response: any) => {
  if (response?.type === 'success') {
    return response.data;
  }

  return response;
};

const getGoogleWebClientId = () => {
  const rawValue = GOOGLE_LOGIN_CLIENT_ID?.trim() ?? '';
  if (!rawValue) {
    return '';
  }

  const clientIds = rawValue.split(',').flatMap((value) => {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  });

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
    const signInResponse = await GoogleSignin.signIn();
    if (signInResponse?.type === 'cancelled') {
      return { cancelled: true };
    }

    const userInfo = getGoogleSignInData(signInResponse);
    const idToken = userInfo?.idToken ?? undefined;

    if (!idToken) {
      return { idToken: undefined };
    }

    logAndroidGoogleTokenDiagnostics(idToken);

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

    logAndroidGoogleDeveloperError(error);
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
  intent: SocialAuthIntent;
  idToken: string;
  nonce?: string;
  accountType?: string | null;
  details?: SocialProfileDetails;
  createIfMissing?: boolean;
}) => {
  return {
    status: 410,
    response: {
      provider: params.provider,
      details: params.details,
      message: 'Legacy social-token exchange is disabled. Please use Clerk social sign-in.',
    } as SocialLoginResponse,
  };
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

  const hasGoogleSession = await runBestEffortProviderSignOut(() => {
    if (typeof (GoogleSignin as any).hasPreviousSignIn === 'function') {
      return (GoogleSignin as any).hasPreviousSignIn();
    }

    return (GoogleSignin as any).isSignedIn();
  });
  if (hasGoogleSession) {
    await runBestEffortProviderSignOut(() => GoogleSignin.revokeAccess());
    await runBestEffortProviderSignOut(() => GoogleSignin.signOut());
  }
};
