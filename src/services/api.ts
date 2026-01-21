import axios, { AxiosError, AxiosResponse } from 'axios';
import { DevSettings } from 'react-native';
import { BASE_URL } from './constants';
import { getValidAccessToken, refreshAuthTokens } from './authTokens';

export const ApiCall = async <T = any>({
  params,
  route,
  verb,
  token,
  baseurl,
  external,
  isFormUrlEncode,
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
  timeoutMs?: number;
}): Promise<{ status: number; response: T }> => {
  try {
    let tokenToUse = '';
    if (token !== undefined) {
      if (typeof token === 'string' && token.length > 0) {
        tokenToUse = token;
      } else {
        tokenToUse = (await getValidAccessToken()) ?? '';
      }
    }

    let url = null;
    if (baseurl) {
      url = `${baseurl}/${route}`;
    } else {
      //
      // url = `${!external ? `${BASE_URL}/` : ''}${route}`;
      url = `${!external ? `${BASE_URL}/` : ''}${route}`;
    }

    const makeAuthHeader = (value: string) =>
      value ? { Authorization: `Bearer ${value}` } : undefined;

    const performRequest = async (authValue?: string) => {
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
          return null;
      }
      return response;
    };

    const response = await performRequest();
    if (!response) {
      return { status: 400, response: 'method not found' as any };
    }

    return { status: 200, response: response?.data as T };
  } catch (err: unknown) {
    const axiosError = err as AxiosError;
    const message = axiosError.response?.data ?? axiosError.message ?? err;
    console.warn('ApiCall error', route, axiosError?.response?.status, message);

    const status = axiosError?.response?.status;
    const isAuthEndpoint = route.startsWith('auth/login') || route.startsWith('auth/register');
    const isRefreshEndpoint = route.startsWith('auth/refresh');
    const canRetryWithRefresh =
      status === 401 && token !== undefined && !isRefreshEndpoint && !isAuthEndpoint;

    if (canRetryWithRefresh) {
      const refreshed = await refreshAuthTokens();
      const refreshedAccess = refreshed?.accessToken;
      if (refreshedAccess) {
        try {
          const retryUrl = baseurl
            ? `${baseurl}/${route}`
            : `${!external ? `${BASE_URL}/` : ''}${route}`;
          const retryHeaders = { Authorization: `Bearer ${refreshedAccess}` };
          let retryResponse: AxiosResponse<unknown, unknown> | null = null;
          switch (verb) {
            case 'get':
              retryResponse = await axios.get(retryUrl, {
                headers: retryHeaders,
                timeout: timeoutMs,
              });
              break;
            case 'post':
              retryResponse = await axios.post(retryUrl, params, {
                headers: {
                  'Content-Type': isFormUrlEncode ? 'multipart/form-data' : 'application/json',
                  ...retryHeaders,
                },
                timeout: timeoutMs,
              });
              break;
            case 'patch':
              retryResponse = await axios.patch(retryUrl, params, {
                headers: {
                  'Content-Type': isFormUrlEncode ? 'multipart/form-data' : 'application/json',
                  ...retryHeaders,
                },
                timeout: timeoutMs,
              });
              break;
            case 'delete':
              retryResponse = await axios.delete(retryUrl, {
                headers: retryHeaders,
                params,
                timeout: timeoutMs,
              });
              break;
            default:
              retryResponse = null;
          }
          if (retryResponse) {
            return { status: 200, response: retryResponse.data as T };
          }
        } catch (retryErr: unknown) {
          const retryAxiosError = retryErr as AxiosError;
          const retryStatus = retryAxiosError?.response?.status ?? 400;
          const retryMessage =
            retryAxiosError.response?.data ?? retryAxiosError.message ?? retryErr;
          console.warn('ApiCall retry error', route, retryStatus, retryMessage);
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
    const apiMessage =
      typeof responseData?.message === 'string'
        ? responseData.message
        : Array.isArray(responseData?.message)
          ? responseData.message.join(', ')
          : null;
    const friendlyMessage =
      apiMessage ?? `That was a glitch on our part. Try again! (${resolvedStatus})`;
    return { status: resolvedStatus, response: { message: friendlyMessage } as any };
  }
};

export default ApiCall;
