export type RootStackParamList = {
  Home: undefined;
  Login: {
    oauth_token?: string;
    oauth_verifier?: string;
    showConfirmationEmailMessage?: boolean;
  };
};
