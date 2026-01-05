import axios, { AxiosResponse } from 'axios';
import { getAuth } from '@react-native-firebase/auth';
import { BASE_URL } from './constants';
import { getFirebaseApp } from './firebaseApp';

export const ApiCall = async ({
  params,
  route,
  verb,
  token,
  baseurl,
  external,
  isFormUrlEncode,
}: //
{
  params?: Record<string, any>;
  route: string;
  verb: 'post' | 'get' | 'delete' | 'patch';
  token?: string;
  baseurl?: string;
  external?: boolean;
  isFormUrlEncode?: boolean;
}): Promise<{ status: number; response: any }> => {
  try {
    let tokenToUse = '';
    if (token !== undefined) {
      if (typeof token === 'string' && token.length > 0) {
        tokenToUse = token;
      } else {
        const firebaseAuth = getAuth(getFirebaseApp());
        tokenToUse = (await firebaseAuth.currentUser?.getIdToken()) ?? '';
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
    let response: AxiosResponse<any, any> | null = null;
    switch (verb) {
      case 'get':
        response = await axios.get(url, authHeader ? { headers: authHeader } : undefined);

        break;
      case 'post':
        response = await axios.post(
          url,
          params,
          authHeader
            ? {
                headers: {
                  'Content-Type': isFormUrlEncode
                    ? 'multipart/form-data'
                    : 'application/x-www-form-urlencoded',
                  ...authHeader,
                },
              }
            : undefined
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
                  'Content-Type': isFormUrlEncode
                    ? 'multipart/form-data'
                    : 'application/x-www-form-urlencoded',
                  ...authHeader,
                },
              }
            : undefined
        );
        break;
      case 'delete':
        response = await axios.delete(url, {
          headers: authHeader,
          params,
        });
        break;

      default:
        return { status: 400, response: 'method not found' };
    }

    return { status: 200, response: response?.data };
  } catch (e: any) {
    //
    // handle error
    console.warn('ApiCall error', route, e?.response?.status, e?.response?.data ?? e?.message ?? e);
    return { status: 400, response: e?.response?.data ?? e.message };
  }
};

export default ApiCall;
