import axios from 'axios';

export const getToken = (token: string) =>
  axios
    .get(`https://one-body.herokuapp.com/api/chat/chat-token`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((twilioUser) => {
      twilioUser.data.jwt;
    });
