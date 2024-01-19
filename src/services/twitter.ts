import { requestTokenSignature, accessTokenSignature } from './signature';

interface TokenResponse {
  oauth_token: string;
  oauth_token_secret: string;
  oauth_callback_confirmed?: string;
}

const parseOAuthRequestToken = (response: TokenResponse) => {
  const oauth_token = response?.oauth_token;
  const oauth_token_secret = response?.oauth_token_secret;
  const oauth_callback_confirmed = response?.oauth_callback_confirmed;

  return { oauth_token, oauth_token_secret, oauth_callback_confirmed };
};

const parseOAuthAccessToken = (response: TokenResponse) => {
  const { oauth_token } = response;
  const { oauth_token_secret } = response;

  return { oauth_token, oauth_token_secret };
};

export const obtainOauthRequestToken = async ({
  consumerKey,
  consumerSecret,
  callbackUrl,
  method,
  apiUrl,
  requestTokenUrl,
}: {
  method: string;
  apiUrl: string;
  callbackUrl: string;
  consumerKey: string;
  consumerSecret: string;
  requestTokenUrl: string;
}) => {
  const oauthSignature = requestTokenSignature({
    method,
    apiUrl,
    callbackUrl,
    consumerKey,
    consumerSecret,
    requestTokenUrl,
  });

  try {
    const res = await fetch(requestTokenUrl, {
      method,

      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        // Authorization: `OAuth ${oauthSignature.}`,
        Authorization: `OAuth oauth_consumer_key="${oauthSignature.oauth_consumer_key}", oauth_nonce="bpLJQcNntFAmxPAP24hOIOTptyfBdZuZ", oauth_signature="WuyozdruPBrlMHexfMdHsxi8d9s", oauth_signature_method="HMAC-SHA1", oauth_timestamp="${oauthSignature.oauth_timestamp}", oauth_version="1.0"`,
      },
      body: JSON.stringify(oauthSignature),
    });
    const response = await res?.json();

    return parseOAuthRequestToken(response.data);
  } catch (err) {
    console.log(err);
  }
};

export const obtainOauthAccessToken = async ({
  consumerKey,
  consumerSecret,
  oauthToken,
  oauthVerifier,
  method,
  apiUrl,
}: {
  method: string;
  apiUrl: string;
  consumerKey: string;
  consumerSecret: string;
  oauthToken: string;
  oauthVerifier: string;
}) => {
  const oauthSignature = accessTokenSignature({
    method,
    apiUrl,
    consumerKey,
    consumerSecret,
    oauthToken,
    oauthVerifier,
  });
  try {
    const res = await fetch(`${apiUrl}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(oauthSignature),
    });
    const response = await res?.json();
    return parseOAuthAccessToken(response.data);
  } catch (err) {
    console.log(err);
  }
};
