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
import { EditProfileRouteParams } from '@/src/screens/main/editProfile/mediaHelpers';
import type { VideoRatioId } from '@/src/services/videoProcessing/types';
import { AccountType, PostType, SerializableCommentSnapshot, WatchPost } from '@/utils/types';
import { FeedTypes } from '../screens/home';
import type { ConnectTab } from '../screens/connectportal/data';
import type { ConnectPortalMyEventsFilter } from '../services/connectPortal';

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
    data?: any;
    code?: string;
    action?: string;
    state?: string;
    oauth_token?: string;
    oauth_verifier?: string;
  };
  InfluencerStepFour: {
    data: any;
  };
  Search: undefined;
  Notifications: undefined;
  NotificationSettings: undefined;
  UserProfile: {
    id?: string;
    handle?: string;
  };
};

export type ExploreStackParamsList = {
  Explore: { openProfileSearch?: boolean } | undefined;
  UserProfile: {
    id?: string;
    handle?: string;
  };
};

export type SettingsStackParamsList = {
  RemoveAccount: undefined;
  SettingsMain: undefined;
  NotificationSettings: undefined;
  PrivacySettings: undefined;
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
    data?: any;
    code?: string;
    action?: string;
    state?: string;
    oauth_token?: string;
    oauth_verifier?: string;
  };
  InfluencerStepFour: {
    data: any;
  };
  CreatorReview: {
    data: any;
  };
  CreatorSuccess: undefined;

  RemoveAccountConfirmation: { reason: string };
  ConfirmLogin: ConfirmLoginScreen;
  NewPassword: undefined;
  Saved: undefined;
};

export type SearchStackParamsList = {
  Search: undefined;
  UserProfile: {
    id?: string;
    handle?: string;
  };
};

export type ConnectStackParamsList = {
  ConnectPortal:
    | {
        initialTab?: ConnectTab;
      }
    | undefined;
  ConnectMap:
    | {
        initialTab?: ConnectTab;
      }
    | undefined;
  ConnectGoLanding: undefined;
  ConnectGoEventDash: undefined;
  ConnectGoMyEvents:
    | {
        initialFilter?: ConnectPortalMyEventsFilter;
        resumeError?: string;
      }
    | undefined;
  ConnectGoEventView: {
    eventId: string;
  };
  ConnectGoEventAnalytics:
    | {
        eventId?: string;
      }
    | undefined;
  ConnectGoCreateStep1:
    | {
        draftId?: string;
        eventId?: string;
      }
    | undefined;
  ConnectGoCreateStep2: {
    draftId: string;
  };
  ConnectGoCreateStep3: {
    draftId: string;
  };
  ConnectGoCreateStep4: {
    draftId: string;
  };
  ConnectGoCreateStep5: {
    draftId: string;
  };
  ConnectGoCreateStep6Payout: {
    draftId: string;
  };
  ConnectGoCreateStep6Review: {
    draftId: string;
  };
  ConnectGoCreateStep7Success: {
    draftId: string;
  };
  ConnectPlacesHome: undefined;
  ConnectServeHome: { _animation?: 'slide_from_right' | 'slide_from_left' } | undefined;
  ConnectServeSaved: { _animation?: 'slide_from_right' | 'slide_from_left' } | undefined;
  ConnectServeApplied: { _animation?: 'slide_from_right' | 'slide_from_left' } | undefined;
  ConnectServeJobView: {
    jobId: string;
  };
  ConnectServeJobApply: {
    jobId: string;
  };
  ConnectServeAppliedJobView: {
    jobId: string;
  };
  ConnectServeApplications: {
    jobId: string;
  };
  ConnectServeCreateJobStep1:
    | {
        draftId?: string;
      }
    | undefined;
  ConnectServeCreateJobStep2: {
    draftId: string;
  };
  UserProfile: {
    id?: string;
    handle?: string;
  };
};

export type MyProfileStackParamsList = {
  MyProfile?: {
    openSettings?: boolean;
  };
  EditProfile: EditProfileRouteParams | undefined;
  InviteFriends: undefined;
};

export type MessagesStackParamsList = {
  MessagesList: undefined;
  NewMessage: undefined;
  CreateGroup: undefined;
  ChatDetail:
    | {
        conversationType: 'direct';
        peerUserId: string;
        peerName: string;
        peerUsername?: string;
        peerAvatarUri?: string;
        isMuted?: boolean;
        isArchived?: boolean;
        messageId?: string;
      }
    | {
        conversationType: 'group';
        groupId: string;
        groupName: string;
        isMuted?: boolean;
        isArchived?: boolean;
        messageId?: string;
      };
};

export type MainBottomStackParamsList = {
  ExploreTab: NavigatorScreenParams<ExploreStackParamsList>;
  ConnectTab: NavigatorScreenParams<ConnectStackParamsList>;
  PostTab: NavigatorScreenParams<PostStackParamsList>;
  HomeTab: NavigatorScreenParams<HomeStackParamsList>;
  Messages: NavigatorScreenParams<MessagesStackParamsList> | undefined;
  MyProfileTab: NavigatorScreenParams<MyProfileStackParamsList>;
};

export type MainDrawerParamsList = {
  Main: NavigatorScreenParams<MainBottomStackParamsList>;

  Connections: undefined;
  ZoeAI: undefined;
  Saved: undefined;
  Settings: NavigatorScreenParams<SettingsStackParamsList>;
  PrayerWall: undefined;
  Help: undefined;
};

export type PostStackParamsList = {};

export type PrayerWallReturnTarget = 'home_pray';

export type PrayerWallStackParamsList = {
  index: undefined;
  Prayer?: {
    postId?: string;
    returnTo?: PrayerWallReturnTarget;
  };
  UserProfile: {
    id?: string;
    handle?: string;
  };
  Single: {
    postId: string;
    threadRootCommentId?: string;
    threadRootCommentSnapshot?: SerializableCommentSnapshot;
    returnTo?: PrayerWallReturnTarget;
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
    noPhysicalLocation?: boolean;

    profileType: AccountType;

    selectedOrganizationCategory?: string;
    selectedOrganizationType?: string;
    selectedOrganizationSubType?: string;
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
    noPhysicalLocation?: boolean;
    profileType: AccountType;

    selectedOrganizationCategory?: string;
    selectedOrganizationType?: string;
    selectedOrganizationSubType?: string;
    organizationName?: string;
    organizationContactName?: string;
    organizationContactEmail?: string;
    organizationContactPhoneNumber?: string;
  };
  OnboardingOrganizationType: undefined;
  OnboardingOrganizationSubtype: {
    selectedOrganizationCategory: string;
  };
  OnboardingOrganizationInfo: {
    selectedOrganizationCategory: string;
    selectedOrganizationType: string;
    selectedOrganizationSubType: string;
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
      sourceType: 'social' | 'prayer' | 'rss' | 'comment';
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
  BlogComposer?:
    | {
        blogId?: string;
      }
    | undefined;
  CreatorBlogDashboard: undefined;
  UploadImage?: {
    requestId: string;
    imageUri: string;
    fileName?: string;
    fileSize?: number;
    type?: string;
    usageContext?: 'feed' | 'comment' | 'chat';
    orientation?: number;
  };
  ReportPost: {
    targetId: string;
    targetType: 'social' | 'prayer' | 'comment' | 'watch';
    title?: string;
    reportedUserId?: string;
  };
  ReportStatus: {
    reportedUserId?: string;
  };
  SinglePost: {
    postId: string;
    threadRootCommentId?: string;
    threadRootCommentSnapshot?: SerializableCommentSnapshot;
  };
  SingleRss: {
    postId: string;
    postType?: PostType;
    threadRootCommentId?: string;
    threadRootCommentSnapshot?: SerializableCommentSnapshot;
  };
  NewPassword: undefined;
  Intro: undefined;
  AccountType:
    | {
        continuePendingSocialSignup?: boolean;
      }
    | undefined;
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
    continuePendingSocialSignup?: boolean;
  };

  ForgotPassword: { email?: string } | undefined;

  ConfirmLogin: ConfirmLoginScreen;
  VideoPost:
    | {
        imagePath?: string;
        videoPath?: string;
        videoRatioId?: VideoRatioId;
        videoWidth?: number;
        videoHeight?: number;
        openCameraOnMount?: boolean;
      }
    | undefined;
  WatchPortal?: {
    initialPostId?: string;
    initialPlaybackId?: string;
    initialWatchPost?: WatchPost;
  };
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
