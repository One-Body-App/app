import axios, { AxiosError, AxiosResponse } from 'axios';
import { DevSettings } from 'react-native';
import { BASE_URL } from './constants';
import { getAuthTokenKind, type AuthTokenKind } from './authTokens';
import { getClerkSessionToken } from './clerkSession';

const unmanagedAuthRoutes = [
  'auth/social-login',
  'auth/login',
  'auth/register',
  'auth/refresh',
  'auth/forgot-password',
  'auth/reset-password',
  'auth/clerk/migrate-password',
  'auth/sendVerificationEmail/public',
];

const normalizeRoute = (route: string) => route.replace(/^\/+/, '');

const shouldUseManagedAuth = (route: string) => {
  const normalizedRoute = normalizeRoute(route);
  return !unmanagedAuthRoutes.some((authRoute) => normalizedRoute.startsWith(authRoute));
};

const joinUrl = (base: string, route: string) => {
  if (!base) {
    return route;
  }

  return `${base.replace(/\/+$/, '')}/${route.replace(/^\/+/, '')}`;
};

export const ApiCall = async <T = any>({
  params,
  route,
  verb,
  token,
  baseurl,
  external,
  isFormUrlEncode,
  suppressErrorLog = false,
  timeoutMs = 300000,
}: //
{
  params?: Record<string, unknown> | FormData;
  route: string;
  verb: 'post' | 'get' | 'delete' | 'patch';
  token?: string | boolean;
  baseurl?: string;
  external?: boolean;
  isFormUrlEncode?: boolean;
  suppressErrorLog?: boolean;
  timeoutMs?: number;
}): Promise<{ status: number; response: T }> => {
  let tokenToUse = '';
  let usedClerkSessionToken = false;
  let authTokenKind: AuthTokenKind = 'unknown';
  const requestUrl = external ? route : joinUrl(baseurl ?? BASE_URL, route);
  const managedAuthRoute = shouldUseManagedAuth(route);

  const makeAuthHeader = (value: string) =>
    value ? { Authorization: `Bearer ${value}` } : undefined;
  const getClerkTokenSafely = (options?: { forceRefresh?: boolean }) =>
    getClerkSessionToken(options).catch(() => null);

  const executeRequest = async (url: string, authValue?: string) => {
    const authHeader = makeAuthHeader(authValue ?? tokenToUse);
    let response: AxiosResponse<unknown, unknown> | null = null;

    switch (verb) {
      case 'get':
        response = await axios.get(
          url,
          authHeader ? { headers: authHeader, timeout: timeoutMs } : { timeout: timeoutMs }
        );
        break;
      case 'post':
        response = await axios.post(
          url,
          params,
          authHeader
            ? {
                headers: {
                  'Content-Type': isFormUrlEncode ? 'multipart/form-data' : 'application/json',
                  ...authHeader,
                },
                timeout: timeoutMs,
              }
            : {
                headers: {
                  'Content-Type': isFormUrlEncode ? 'multipart/form-data' : 'application/json',
                },
                timeout: timeoutMs,
              }
        );
        break;
      case 'patch':
        response = await axios.patch(
          url,
          params,
          authHeader
            ? {
                headers: {
                  'Content-Type': isFormUrlEncode ? 'multipart/form-data' : 'application/json',
                  ...authHeader,
                },
                timeout: timeoutMs,
              }
            : {
                headers: {
                  'Content-Type': isFormUrlEncode ? 'multipart/form-data' : 'application/json',
                },
                timeout: timeoutMs,
              }
        );
        break;
      case 'delete':
        response = await axios.delete(url, {
          headers: authHeader,
          params,
          timeout: timeoutMs,
        });
        break;
      default:
        response = null;
    }

    return response;
  };

  const resolveInitialAuthToken = async (): Promise<{
    tokenValue: string;
    kind: AuthTokenKind;
    usedClerk: boolean;
  }> => {
    if (token === undefined) {
      return { tokenValue: '', kind: 'unknown', usedClerk: false };
    }

    if (!managedAuthRoute) {
      return {
        tokenValue: '',
        kind: 'unknown',
        usedClerk: false,
      };
    }

    if (typeof token === 'string' && token.length > 0) {
      const initialTokenKind = getAuthTokenKind(token);
      const clerkAccessToken = await getClerkTokenSafely();
      if (clerkAccessToken) {
        return { tokenValue: clerkAccessToken, kind: 'clerk', usedClerk: true };
      }

      if (initialTokenKind === 'api') {
        return {
          tokenValue: '',
          kind: 'api',
          usedClerk: false,
        };
      }

      return {
        tokenValue: token,
        kind: initialTokenKind,
        usedClerk: false,
      };
    }

    const clerkAccessToken = await getClerkTokenSafely();
    if (clerkAccessToken) {
      return { tokenValue: clerkAccessToken, kind: 'clerk', usedClerk: true };
    }

    return { tokenValue: '', kind: 'unknown', usedClerk: false };
  };

  try {
    const initialAuth = await resolveInitialAuthToken();
    tokenToUse = initialAuth.tokenValue;
    authTokenKind = initialAuth.kind;
    usedClerkSessionToken = initialAuth.usedClerk;

    const response = await executeRequest(requestUrl);
    if (!response) {
      return { status: 400, response: 'method not found' as any };
    }

    return { status: 200, response: response?.data as T };
  } catch (err: unknown) {
    const axiosError = err as AxiosError;
    const message = axiosError.response?.data ?? axiosError.message ?? err;
    if (!suppressErrorLog) {
      console.warn('ApiCall error', route, axiosError?.response?.status, message);
    }

    const status = axiosError?.response?.status;
    const canRetryAuth = status === 401 && token !== undefined && managedAuthRoute;
    const attemptedRetryTokens = new Set<string>();
    if (tokenToUse) {
      attemptedRetryTokens.add(tokenToUse);
    }

    const retryWithToken = async (authValue: string | null, label: string) => {
      if (!authValue || attemptedRetryTokens.has(authValue)) {
        return null;
      }

      attemptedRetryTokens.add(authValue);
      try {
        const retryResponse = await executeRequest(requestUrl, authValue);
        if (retryResponse) {
          return { status: 200, response: retryResponse.data as T };
        }
      } catch (retryErr: unknown) {
        const retryAxiosError = retryErr as AxiosError;
        const retryStatus = retryAxiosError?.response?.status ?? 400;
        const retryMessage = retryAxiosError.response?.data ?? retryAxiosError.message ?? retryErr;
        if (!suppressErrorLog) {
          console.warn(label, route, retryStatus, retryMessage);
        }
      }

      return null;
    };

    if (canRetryAuth) {
      if (usedClerkSessionToken || authTokenKind !== 'api' || token === true) {
        const forceManagedAccess = await getClerkTokenSafely({ forceRefresh: true });
        const managedRetryResult = await retryWithToken(
          forceManagedAccess,
          'ApiCall managed-token retry error'
        );
        if (managedRetryResult) {
          return managedRetryResult;
        }
      }
    }

    if (
      axiosError?.code === 'ECONNABORTED' ||
      (typeof axiosError?.message === 'string' && axiosError.message.includes('timeout'))
    ) {
      // Reload to recover from a stuck session on timeout
      DevSettings.reload();
    }
    const resolvedStatus =
      axiosError?.response?.status ?? (axiosError?.code === 'ECONNABORTED' ? 408 : 400);
    const responseData: any = axiosError?.response?.data;
    let apiMessage: string | null = null;
    if (typeof responseData?.message === 'string') {
      apiMessage = responseData.message;
    } else if (Array.isArray(responseData?.message)) {
      apiMessage = responseData.message.join(', ');
    }
    const friendlyMessage =
      apiMessage ?? `That was a glitch on our part. Try again! (${resolvedStatus})`;
    return { status: resolvedStatus, response: { message: friendlyMessage } as any };
  }
};

export default ApiCall;
