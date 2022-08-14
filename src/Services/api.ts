import { BASE_URL } from './constants';
import axios from 'axios';

export const ApiCall = async ({
  params,
  route,
  verb,
  token,
  baseurl,
  external,
}: {
  params?: Record<string, string>;
  route: string;
  verb: string;
  token?: string;
  baseurl?: string;
  external?: boolean;
}) => {
  try {
    let url = null;
    if (baseurl) {
      url = `${baseurl}/${route}`;
    } else {
      url = `${!external ? `${BASE_URL}/` : ''}${route}`;
    }
    console.log('url', url, token);

    let response = null;
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
          params,
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
        );
        break;
      case 'delete':
        response = await axios.delete(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          params,
        });
        break;

      default:
        return { code: '400', response: 'methord not found' };
    }

    if (response) {
      return await { status: 200, response: response.data };
    } else {
      return response;
    }
  } catch (e: any) {
    // handle error
    return { status: 400, response: e.response.data };
  }
};
