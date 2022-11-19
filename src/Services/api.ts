import { BASE_URL } from './constants';
import axios, { AxiosResponse } from 'axios';

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
  verb: string;
  token?: string;
  baseurl?: string;
  external?: boolean;
  isFormUrlEncode?: boolean;
}): Promise<{ status: number; response: any }> => {
  try {
    let url = null;
    if (baseurl) {
      url = `${baseurl}/${route}`;
    } else {
      //
      // url = `${!external ? `${BASE_URL}/` : ''}${route}`;
      url = `${!external ? `${BASE_URL}/` : ''}${route}`;
    }
    console.log(url, 'url', token, isFormUrlEncode);
    let response: AxiosResponse<any, any> | null = null;
    switch (verb) {
      case 'get':
        response = await axios.get(
          url,
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
        );

        break;
      case 'post':
        response = await axios.post(
          url,
          params,
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
        );
        break;
      case 'patch':
        response = await axios.patch(
          url,
          // isFormUrlEncode ? formData : params,
          params,
          token
            ? {
                headers: {
                  'Content-Type': isFormUrlEncode ? 'application/x-www-form-urlencoded' : '',
                  Authorization: `Bearer ${token}`,
                },
              }
            : undefined
        );
        break;
      case 'delete':
        response = await axios.delete(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          params,
        });
        break;

      default:
        return { status: 400, response: 'method not found' };
    }

    console.log(response);
    return { status: 200, response: response?.data };
  } catch (e: any) {
    console.log(e, 'eeeeee');
    // handle error
    return { status: 400, response: e.response.data };
  }
};
