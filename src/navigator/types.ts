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

import { NavigatorScreenParams } from '@react-navigation/native';
import { Animated, StyleProp, TextProps, TextStyle } from 'react-native';
import { AccountType, PostType, WatchPost } from '@/utils/types';
import { FeedTypes } from '../screens/home';

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
    selectedTab?: FeedTypes;
    refreshToken?: number;
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
  WatchPortal?: {
    initialPostId?: string;
    initialPlaybackId?: string;
    initialWatchPost?: WatchPost;
  };
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
  Saved: undefined;
};

export type SearchStackParamsList = {
  Search: undefined;
  UserProfile: {
    id: string;
  };
};

export type ConnectStackParamsList = {
  ConnectPortal: undefined;
  ConnectMap: undefined;
  UserProfile: {
    id: string;
  };
};

export type MyProfileStackParamsList = {
  MyProfile?: {
    openSettings?: boolean;
  };
  EditProfile: undefined;
  InviteFriends: undefined;
};

export type MainBottomStackParamsList = {
  ExploreTab: NavigatorScreenParams<ConnectStackParamsList>;
  SearchTab: NavigatorScreenParams<ExploreStackParamsList>;
  PostTab: NavigatorScreenParams<PostStackParamsList>;
  HomeTab: NavigatorScreenParams<HomeStackParamsList>;
  ZoeTab: undefined;
  MyProfileTab: NavigatorScreenParams<MyProfileStackParamsList>;
};

export type MainDrawerParamsList = {
  Main: NavigatorScreenParams<MainBottomStackParamsList>;

  Connections: undefined;
  Saved: undefined;
  Settings: NavigatorScreenParams<SettingsStackParamsList>;
  PrayerWall: undefined;
  Help: undefined;
};

export type PostStackParamsList = {};

export type PrayerWallStackParamsList = {
  index: undefined;
  Prayer?: {
    postId?: string;
  };
  UserProfile: {
    id: string;
  };
  Single: {
    postId: string;
  };
};

export type OnboardingStackParamList = {
  OnboardingIntro: undefined;
  OnboardingDateOfBirth:
    | {
        selectedChurchType?: string;
        selectedChurchSubType?: string;
        selectedChurchAttendence?: string;
      }
    | undefined;
  OnboardingChurchType: undefined;
  OnboardingChurchAttend: {
    selectedChurchType?: string;
    selectedChurchSubType?: string;
  };
  OnboardingLocation: {
    dateOfBirth: string;
  };
  OnboardingInterests: {
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

type LoginMfaChallenge = {
  mfaRequired: true;
  enrollmentRequired: boolean;
  mfaToken: string;
  preferredMethod: 'passkey' | 'totp' | 'email' | 'backup';
  availableMethods: Array<'passkey' | 'totp' | 'email' | 'backup'>;
  emailMasked: string;
  reason: 'mandatory_mfa' | 'step_up';
};

export type MainStackParamList = {
  MainRoot?: NavigatorScreenParams<MainDrawerParamsList>;
  Post?: {
    postId?: string;
    repostDraft?: {
      sourceType: 'social' | 'prayer' | 'rss';
      sourceId: string;
      sourcePreview?: {
        title?: string;
        content?: string;
        link?: string;
        category?: string;
        isPrivate?: boolean;
      };
      originFeedType?: FeedTypes;
    };
  };
  UploadImage?: {
    requestId: string;
    imageUri: string;
    fileName?: string;
    fileSize?: number;
    type?: string;
    usageContext?: 'feed' | 'comment';
  };
  ReportPost: {
    targetId: string;
    targetType: 'social' | 'prayer' | 'comment';
    title?: string;
    reportedUserId?: string;
  };
  ReportStatus: {
    reportedUserId?: string;
  };
  SinglePost: {
    postId: string;
  };
  SingleRss: {
    postId: string;
    postType?: PostType;
  };
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
    action?: string;
    resetPassword?: boolean;
    initialMfaChallenge?: LoginMfaChallenge;
    prefillEmail?: string;
  };
  SignUp: {
    oauth_token?: string;
    oauth_verifier?: string;
    showConfirmationEmailMessage?: boolean;
    accountType?: AccountType;
  };

  ForgotPassword: { email?: string } | undefined;

  ConfirmLogin: ConfirmLoginScreen;
  VideoPost:
    | {
        imagePath?: string;
        videoPath?: string;
        openCameraOnMount?: boolean;
      }
    | undefined;
};

type ConfirmLoginScreen = {
  toScreen?: keyof MainStackParamList | keyof SettingsStackParamsList;
  error?: string;
  onlyPassword?: boolean;
  mode?: string;
  toScreenRouteParams?: Record<string, string>;
  showConfirmationEmailMessage?: boolean;
  oobCode?: string;
  updateParent?: Function;

  action?: string;
  token?: string;
  apiKey?: string;
  lang?: string;
  prefillEmail?: string;
};

export type HeaderProps = Omit<TextProps, 'style'> & {
  tintColor?: string;
  style?: Animated.WithAnimatedValue<StyleProp<TextStyle>>;
};
