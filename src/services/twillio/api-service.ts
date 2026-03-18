import axios from 'axios';
import { BASE_URL } from '@/src/services/constants';

const getToken = (token: string) =>
  axios
    .get(`${BASE_URL}/chat/chat-token`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((twilioUser) => twilioUser.data?.jwt);

export default getToken;
