import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import { ApiCall } from './api';
import { AuthTokens, saveAuthTokens } from './authTokens';
import { GOOGLE_LOGIN_CLIENT_ID } from './constants';

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
};

let googleConfigured = false;

export const ensureGoogleSigninConfigured = () => {
  if (googleConfigured) return;
  if (GOOGLE_LOGIN_CLIENT_ID) {
    GoogleSignin.configure({
      webClientId: GOOGLE_LOGIN_CLIENT_ID,
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
    if (!GOOGLE_LOGIN_CLIENT_ID) {
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
        email: userInfo.user?.email,
        displayName: userInfo.user?.name,
        firstName: userInfo.user?.givenName,
        lastName: userInfo.user?.familyName,
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
    await saveAuthTokens(res.response.tokens);
  }

  return res;
};
