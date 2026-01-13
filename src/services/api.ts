import axios, { AxiosError, AxiosResponse } from 'axios';
import { getAuth, getIdToken } from '@react-native-firebase/auth';
import { DevSettings } from 'react-native';
import { BASE_URL } from './constants';

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
  token?: string;
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
        const firebaseAuth = getAuth();
        tokenToUse = firebaseAuth.currentUser ? await getIdToken(firebaseAuth.currentUser) : '';
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

    const authHeader = tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : undefined;
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
          // isFormUrlEncode ? formData : params,
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
        return { status: 400, response: 'method not found' as any };
    }

    return { status: 200, response: response?.data as T };
  } catch (err: unknown) {
    const axiosError = err as AxiosError;
    const message = axiosError.response?.data ?? axiosError.message ?? err;
    console.warn('ApiCall error', route, axiosError?.response?.status, message);
    if (
      axiosError?.code === 'ECONNABORTED' ||
      (typeof axiosError?.message === 'string' && axiosError.message.includes('timeout'))
    ) {
      // Reload to recover from a stuck session on timeout
      DevSettings.reload();
    }
    const status =
      axiosError?.response?.status ?? (axiosError?.code === 'ECONNABORTED' ? 408 : 400);
    const friendlyMessage = `That was a glitch on our part. Try again! (${status})`;
    return { status, response: { message: friendlyMessage } as any };
  }
};

export default ApiCall;
