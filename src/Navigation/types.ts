export type RootStackParamList = {
  Home: undefined;
  Login: {
    oauth_token?: string;
    oauth_verifier?: string;
    showConfirmationEmailMessage?: boolean;
  };
  Bootombar: undefined;
  InfluencerStepOne: undefined;
  InfluencerStepTwo: undefined;
  InfluencerStepThree: undefined;
  AccountType: undefined;
  forget: undefined;
  SignUp: {
    oauth_token?: string;
    oauth_verifier?: string;
    showConfirmationEmailMessage?: boolean;
  };
  SignupForm: undefined;
  OrgnizationSteps: undefined;
  IndividualSteps: undefined;
  Settings: undefined;
  PasswordChange: {
    setError: (errorText: string) => void;
  };
  NotificationsAndEmail: undefined;
  RemoveAccount: undefined;
  ConfirmLogin: {
    toScreen: string;
    error?: string;
  };
  EmailChange: {
    setError: (errorText: string) => void;
  };
};
