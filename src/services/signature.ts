type RequestTokenParams = {
  method: string;
  apiUrl: string;
  callbackUrl: string;
  consumerKey: string;
  consumerSecret: string;
  requestTokenUrl: string;
};

type AccessTokenParams = {
  method: string;
  apiUrl: string;
  consumerKey: string;
  consumerSecret: string;
  oauthToken: string;
  oauthVerifier: string;
};

type OAuthSignature = {
  oauth_consumer_key: string;
  oauth_nonce: string;
  oauth_signature: string;
  oauth_signature_method: string;
  oauth_timestamp: string;
  oauth_version: string;
  oauth_token?: string;
  oauth_verifier?: string;
  oauth_callback?: string;
};

const nowTimestamp = () => Math.floor(Date.now() / 1000).toString();
const nonce = () => Math.random().toString(36).slice(2);

export const requestTokenSignature = (params: RequestTokenParams): OAuthSignature => ({
  oauth_consumer_key: params.consumerKey,
  oauth_nonce: nonce(),
  oauth_signature: '',
  oauth_signature_method: 'HMAC-SHA1',
  oauth_timestamp: nowTimestamp(),
  oauth_version: '1.0',
  oauth_callback: params.callbackUrl,
});

export const accessTokenSignature = (params: AccessTokenParams): OAuthSignature => ({
  oauth_consumer_key: params.consumerKey,
  oauth_nonce: nonce(),
  oauth_signature: '',
  oauth_signature_method: 'HMAC-SHA1',
  oauth_timestamp: nowTimestamp(),
  oauth_version: '1.0',
  oauth_token: params.oauthToken,
  oauth_verifier: params.oauthVerifier,
});
