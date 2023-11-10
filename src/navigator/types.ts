// export type RootStackParamList = {
//   Home: {
//     tabs?: string;
//   };
//   Explore: undefined;
//   Channel: undefined;
//   Login: {
//     state?: string;
//     code?: string;
//     oauth_token?: string;
//     oauth_verifier?: string;
//     showConfirmationEmailMessage?: boolean;
//   };
//   Bootombar: undefined;
//   LoadingPage: undefined;
//   InfluencerStepOne: undefined;
//   InfluencerStepTwo: {
//     code?: string;
//     action?: string;
//     state?: string;
//     oauth_token?: string;
//     oauth_verifier?: string;
//   };
//   InfluencerStepThree: {
//     data: any;
//   };
//   InfluencerStepFour: {
//     data: any;
//   };
//   AccountType: undefined;
//   forget: undefined;
//   SignUp: {
//     oauth_token?: string;
//     oauth_verifier?: string;
//     showConfirmationEmailMessage?: boolean;
//   };
//   SignupForm: undefined;
//   OrgnizationSteps: undefined;
//   IndividualSteps: undefined;
//   Settings: undefined;
//   PasswordChange: {
//     setError: (errorText: string) => void;
//   };

import { AccountType } from '@/utils/types';
import { NavigatorScreenParams } from '@react-navigation/native';

//   RemoveAccount: undefined;
//   DeactivateAccountConfirm: { reason: string };
//   ConfirmLogin: {
//     toScreen: keyof RootStackParamList;
//     error?: string;
//     onlyPassword?: boolean;
//     mode?: string;
//     toScreenRouteParams?: Record<string, string>;
//   };
//   EmailChange: {
//     setError: (errorText: string) => void;
//   };
//   NotificationSettings: undefined;
//   InfluencerSettings: {
//     code?: string;
//     state?: string;
//     action?: string;
//     service?: string;
//     oauth_token?: string;
//     oauth_verifier?: string;
//   };
//   Bottombar: {
//     tabs: string;
//   };
//   Search: undefined;
//   BottomTabs: {
//     tabs?: string;
//   };
//   BlogView: {
//     url?: string;
//   };
//   HomeNewsComponent: undefined;
//   MyProfile: undefined;
//   EditProfile: undefined;
//   UserProfile: {
//     id: string;
//   };
//   Social: undefined;
//   Saved: undefined;
// };

export type HomeStackParamsList = {
  Home: {
    tabs?: string;
  };
  InfluencerSettings: {
    code?: string;
    state?: string;
    action?: string;
    service?: string;
    oauth_token?: string;
    oauth_verifier?: string;
  };
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
  Search: undefined;
  Notifications: undefined;

  UserProfile: {
    id: string;
  };
};

export type ExploreStackParamsList = {
  Explore: undefined;
  UserProfile: {
    id: string;
  };
};

export type SettingsStackParamsList = {
  RemoveAccount: undefined;
  SettingsMain: undefined;
  NotificationSettings: undefined;
  InfluencerSettings?: {
    code?: string;
    state?: string;
    action?: string;
    service?: string;
    oauth_token?: string;
    oauth_verifier?: string;
  };

  EmailChange: {
    setError: (errorText: string) => void;
  };
  PasswordChange: {
    setError: (errorText: string) => void;
  };
  InfluencerStepOne: undefined;
  InfluencerStepTwo?: {
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

  RemoveAccountConfirmation: { reason: string };
  ConfirmLogin: ConfirmLoginScreen;
  NewPassword: undefined;
};

export type SearchStackParamsList = {
  Search: undefined;
};

export type MyProfileStackParamsList = {
  MyProfile?: {
    openSettings?: boolean;
  };
  EditProfile: undefined;
};

export type MainBottomStackParamsList = {
  ExploreTab: NavigatorScreenParams<ExploreStackParamsList>;
  SearchTab: NavigatorScreenParams<SearchStackParamsList>;
  PostTab: NavigatorScreenParams<PostStackParamsList>;
  HomeTab: NavigatorScreenParams<HomeStackParamsList>;
  MyProfileTab: NavigatorScreenParams<MyProfileStackParamsList>;
};

export type MainDrawerParamsList = {
  Main: NavigatorScreenParams<MainBottomStackParamsList>;

  Connections: undefined;
  Saved: undefined;
  Settings: NavigatorScreenParams<SettingsStackParamsList>;
  Help: undefined;
};

export type PostStackParamsList = {};

export type OnboardingStackParamList = {
  OnboardingIntro: undefined;
  OnboardingChurchAttend: {
    selectedChurchType: string;
    selectedChurchSubType?: string;
  };
  OnboardingChurchType: undefined;
  OnboardingDateOfBirth: {
    selectedChurchType: string;
    selectedChurchSubType?: string;

    selectedChurchAttendence: string;
  };
  OnboardingLocation: {
    selectedChurchType: string;
    selectedChurchSubType?: string;
    selectedChurchAttendence: string;

    dateOfBirth: string;
  };
  OnboardingInterests: {
    selectedChurchType?: string;
    selectedChurchSubType?: string;
    selectedChurchAttendence?: string;
    dateOfBirth?: string;

    longitude?: number;
    latitude?: number;
    address?: string;

    profileType: AccountType;

    selectedOrganizationType?: string;
    organizationName?: string;
    organizationContactName?: string;
    organizationContactEmail?: string;
    organizationContactPhoneNumber?: string;
  };
  OnboardingInfluencers: {
    selectedChurchType?: string;
    selectedChurchSubType?: string;
    selectedChurchAttendence?: string;
    dateOfBirth?: string;
    longitude?: number;
    latitude?: number;
    address?: string;
    profileType: AccountType;

    selectedOrganizationType?: string;
    organizationName?: string;
    organizationContactName?: string;
    organizationContactEmail?: string;
    organizationContactPhoneNumber?: string;
  };
  OnboardingOrganizationType: undefined;
  OnboardingOrganizationInfo: {
    selectedOrganizationType: string;
  };
  OnboardingOrganizationContact: {
    selectedOrganizationType: string;
    organizationName: string;
    longitude: number;
    latitude: number;
    address: string;
  };
};

export type MainStackParamList = {
  MainRoot?: NavigatorScreenParams<MainDrawerParamsList>;
  Post: undefined;
  NewPassword: undefined;
  Intro: undefined;
  AccountType: undefined;
  PasswordChange: {
    setError: (errorText: string) => void;
  };
  EmailChange: {
    setError: (errorText: string) => void;
  };
  Login?: {
    state?: string;
    code?: string;
    oauth_token?: string;
    oauth_verifier?: string;
    showConfirmationEmailMessage?: boolean;
  };
  SignUp: {
    oauth_token?: string;
    oauth_verifier?: string;
    showConfirmationEmailMessage?: boolean;
    accountType?: AccountType;
  };

  ForgotPassword: undefined;

  ConfirmLogin: ConfirmLoginScreen;
};

type ConfirmLoginScreen = {
  toScreen?: keyof MainStackParamList | keyof SettingsStackParamsList;
  error?: string;
  onlyPassword?: boolean;
  mode?: string;
  toScreenRouteParams?: Record<string, string>;
  oobCode?: string;
  updateParent?: Function;

  action?: string;
  apiKey?: string;
  lang?: string;
};
