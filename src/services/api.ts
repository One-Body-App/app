import axios, { AxiosError, AxiosResponse } from 'axios';
import { DevSettings } from 'react-native';
import { BASE_URL } from './constants';
import { getValidAccessToken, refreshAuthTokens } from './authTokens';

const shouldPreferManagedSessionToken = (route: string) => !route.startsWith('auth/social-login');

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
  const requestUrl = baseurl ? `${baseurl}/${route}` : `${!external ? `${BASE_URL}/` : ''}${route}`;

  const makeAuthHeader = (value: string) =>
    value ? { Authorization: `Bearer ${value}` } : undefined;

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

  try {
    if (token !== undefined) {
      const managedAccessToken = shouldPreferManagedSessionToken(route)
        ? await getValidAccessToken()
        : null;

      if (typeof token === 'string' && token.length > 0) {
        // Most app calls pass Redux token strings. Prefer the managed token source so we don't
        // keep retrying with stale in-memory tokens after refresh.
        tokenToUse = managedAccessToken ?? token;
      } else {
        tokenToUse = managedAccessToken ?? '';
      }
    }

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
    const isAuthEndpoint = route.startsWith('auth/login') || route.startsWith('auth/register');
    const isRefreshEndpoint = route.startsWith('auth/refresh');
    const canRetryWithManagedToken =
      status === 401 &&
      token !== undefined &&
      typeof token === 'string' &&
      token.length > 0 &&
      shouldPreferManagedSessionToken(route);
    const canRetryWithRefresh =
      status === 401 && token !== undefined && !isRefreshEndpoint && !isAuthEndpoint;

    if (canRetryWithManagedToken) {
      const managedAccess = await getValidAccessToken();
      if (managedAccess && managedAccess !== tokenToUse) {
        try {
          const managedRetryResponse = await executeRequest(requestUrl, managedAccess);
          if (managedRetryResponse) {
            return { status: 200, response: managedRetryResponse.data as T };
          }
        } catch (managedRetryErr: unknown) {
          const managedRetryAxiosError = managedRetryErr as AxiosError;
          const managedRetryStatus = managedRetryAxiosError?.response?.status ?? 400;
          const managedRetryMessage =
            managedRetryAxiosError.response?.data ??
            managedRetryAxiosError.message ??
            managedRetryErr;
          if (!suppressErrorLog) {
            console.warn(
              'ApiCall managed-token retry error',
              route,
              managedRetryStatus,
              managedRetryMessage
            );
          }
        }
      }
    }

    if (canRetryWithRefresh) {
      const refreshed = await refreshAuthTokens();
      const refreshedAccess = refreshed?.accessToken;
      if (refreshedAccess) {
        try {
          const retryResponse = await executeRequest(requestUrl, refreshedAccess);
          if (retryResponse) {
            return { status: 200, response: retryResponse.data as T };
          }
        } catch (retryErr: unknown) {
          const retryAxiosError = retryErr as AxiosError;
          const retryStatus = retryAxiosError?.response?.status ?? 400;
          const retryMessage =
            retryAxiosError.response?.data ?? retryAxiosError.message ?? retryErr;
          if (!suppressErrorLog) {
            console.warn('ApiCall retry error', route, retryStatus, retryMessage);
          }
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
