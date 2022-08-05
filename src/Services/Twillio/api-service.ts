import axios from 'axios';

export const getToken = token =>
  axios
    .get(`https://one-body.herokuapp.com/api/chat/chat-token`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then(twilioUser => {
      console.log('sdfa', twilioUser.data);
      twilioUser.data.jwt;
    });
