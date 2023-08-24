export type RootStackParamList = {
  Home: {
    tabs?: string;
  };
  Explore: undefined;
  Connections: undefined;
  Login: {
    state?: string;
    code?: string;
    oauth_token?: string;
    oauth_verifier?: string;
    showConfirmationEmailMessage?: boolean;
  };
  Bootombar: undefined;
  LoadingPage: undefined;

  InfluencerStepOne: undefined;
  InfluencerStepTwo: {
    code?: string;
    action?: string;
    state?: string;
    oauth_token?: string;
    oauth_verifier?: string;
  };
  InfluencerStepThree: {
    data: any;
  };
  InfluencerStepFour: {
    data: any;
  };
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

  RemoveAccount: undefined;
  DeactivateAccountConfirm: { reason: string };
  ConfirmLogin: {
    toScreen: keyof RootStackParamList;
    error?: string;
    onlyPassword?: boolean;
    mode?: string;
    toScreenRouteParams?: Record<string, string>;
  };
  EmailChange: {
    setError: (errorText: string) => void;
  };
  NotificationSettings: undefined;
  InfluencerSettings: {
    code?: string;
    state?: string;
    action?: string;
    service?: string;
    oauth_token?: string;
    oauth_verifier?: string;
  };
  Bottombar: {
    tabs: string;
  };
  Search: undefined;
  Bottom: {
    tabs?: string;
  };
  BlogView: {
    url?: string;
  };
  HomeNewsComponent: undefined;
  MyProfile: undefined;
  EditProfile: undefined;
  UserProfile: {
    id: string;
  };
  Social: undefined;
  Saved: undefined;
};
