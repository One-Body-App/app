import { type GiphyMedia } from '@giphy/react-native-sdk';
import { ReactElement } from 'react';

export type ChurchType = {
  churchType: string;
  children: ChurchType[];
  _id: string;
};

export type Interest = {
  name: string;
  deleteFlag: boolean;
  _id: string;
};
export type Tag = {
  _id: string;
  deleteFlag: boolean;
  name: string;
  createdAt: string;
  updatedAt: string;
  parent?: string;
};

export type Badge = {
  _id: string;
  deleteFlag: boolean;
  title: string;
  badge: string;
};

type Coordinates = {
  lon: number;
  lat: number;
};

type Point = {
  type: string;
  coordinates: number[];
};

export type Location = {
  address?: string;
  coordinates?: Coordinates;
  point?: Point;
};

export type TGender = 'Male' | 'Female';

type Profile = {
  churchType?: string;
  churchSubType?: string;
  oftenChurch?: string;
  dateOfBirth: string;
  gender: TGender;
  location: Location;
  companyName?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhoneNumber?: string;
  whatIDo?: Tag;
  typeOfOrganization?: Tag;
  isLocationPublic?: boolean;
  isChurchTypePublic?: boolean;
};

export enum PostType {
  social = 'social',
  rss = 'rss',
  prayer = 'prayer',
  comment = 'comment',
  watch = 'watch',
}

export type SavedPost = {
  postId: string;
  type: PostType;
  title: string;
  image?: string;
  created?: Date;
  userId?: string;
  link?: string;
};

export type User = {
  badges: string[];
  createdAt: string;
  deactivated: { isDeactivated: boolean };
  email: string;
  interests: Interest[];
  isInfluencer: boolean;
  isProfileCompleted: boolean;
  name: string;
  profileImage?: string;
  profileHeader?: string;
  accountType: AccountType;
  updatedAt: string;
  username: string;
  bio?: string;
  website: string;

  _id: string;
  id?: string;
  badgesData: Badge[];
  gender: string;
  token: string;
  userId: string;
  followers?: User[];
  followerCount?: number;
  following: string[];
  pushNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  subscribedToNewsletter: boolean;
  influencerProfile?: InfluencerProfile;
  profile: Profile;
  savedPrayers?: string[];
  savedPost?: SavedPost[];
  savedPostData?: SocialPost[];
  whatIDo?: Tag;
  typeOfOrganization?: Tag;
};

type InfluencerProfile = {
  _id: string;
  userID?: string;
  twitterId?: string;
  twitterHandler?: string;

  twitterTokenExpirationReal?: number;
  twitterTokenExpiration?: number;

  instagramId?: string;
  instagramHandler?: string;
  instagramTokenExpirationReal?: number;
  instagramTokenExpiration?: number;
  rssUrl: string;
  category: string[];
  comments: string;
  influencerStatus: 'approved' | 'pending';
  createdAt: string;
  updatedAt: string;
};

export type ArticleType = {
  id?: string;
  link?: string;
  created: Date;
  image?: { url: string };
  title: string | { a: any };
  comments?: CommentPost[];
  commentNumber?: number;
  userData: {
    _id: string;
    name: string;
    username: string;
    accountType: AccountType;
    profileImage?: string;

    website?: string;
    instagramHandler?: string;
    twitterHandler?: string;
    isApprovedInfluencer?: boolean;
    interests?: Interest[];
  };
  reactions: SocialPostReaction[];
};

export enum AccountType {
  individual = 'individual',
  organization = 'organization',
}

export enum SocialPostReactionType {
  love = 'love',
  praying = 'praying',
  happy = 'happy',
}

export type NotificationType = {
  _id: string;
  userID?: string;
  title: string;
  description: string;
};

export type RefreshListRef = { setRefreshing: Function };

export type SocialPostReaction = {
  type: SocialPostReactionType;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export interface ResponseGenerator {
  status: number;
  response: any;
}

// export interface SocialPost {
//   _id: string;
//   content?: string;
//   videos?: string[];
//   images?: string[];
//   user?: User;
//   edited?: boolean;
//   gif?: GiphyMedia;
//   locationName?: string;
//   location?: {
//     type: string;
//     coordinates: number[];
//   };
//   reactions: SocialPostReaction[];
//   createdAt?: Date;
//   updatedAt?: Date;
// }

export interface SocialPost {
  _id?: string;
  postId?: string;
  content: string;
  date: string;
  source: 'twitter' | 'instagram';
  handler: string;
  link: string;
  title: string;
  mediaUrl?: string;
  comments?: CommentPost[];
  commentNumber?: number;
  attachments?: [
    {
      media_key: string;
      type: string;
      url: string;
      title?: string;
      siteName?: string;
      image?: { height: string; type: string; url: string; width: string };
      description?: string;
    },
  ];
  mediaType?: string;
  permalink?: string;
  userData: {
    _id: string;
    name: string;
    username: string;
    accountType: AccountType;
    profileImage: string;
    twitterHandler?: string;
    instagramHandler?: string;
    isApprovedInfluencer?: boolean;
    interests?: Interest[];
  };
  images?: string[];
  gif?: GiphyMedia;
  videos?: string[];
  created: Date;
  updated: Date;
  id: string;

  reactions: SocialPostReaction[];
  location?: {
    type?: string;
    coordinates?: number[];
  };
  locationName?: string;
  edited?: boolean;
}

export interface WatchPost {
  _id?: string;
  playBackId?: string;
  postId?: string;
  content: string;
  date: string;
  handler: string;
  link: string;
  title: string;
  mediaUrl?: string;
  comments?: CommentPost[];
  commentNumber?: number;

  permalink?: string;
  userData: {
    _id: string;
    name: string;
    username: string;
    accountType: AccountType;
    profileImage: string;
    twitterHandler?: string;
    instagramHandler?: string;
    isApprovedInfluencer?: boolean;
  };

  videos?: string[];
  created: Date;
  updated: Date;
  id: string;

  reactions: SocialPostReaction[];
  location?: {
    type?: string;
    coordinates?: number[];
  };
  edited?: boolean;
}

export enum PrayerWallCategory {
  Request = 'request',
  Exhortation = 'exhortation',
  Testimony = 'testimony',
  AnsweredPrayer = 'answered',
  MyPrayers = 'myPrayers',
}

export interface PrayerPost {
  postId?: string;
  content: string;
  date: string;
  private: boolean;
  category: PrayerWallCategory;
  userData: {
    _id?: string;
    name: string;
    username?: string;
    accountType?: AccountType;
    profileImage?: string;
    twitterHandler?: string;
    instagramHandler?: string;
    isApprovedInfluencer?: boolean;
  };
  testimony?: {
    content: string;
    reactions: SocialPostReaction[];
  };
  answered?: boolean;
  images?: string[];
  gif?: GiphyMedia;
  videos?: string[];
  created: Date;
  updated: Date;
  id: string;
  comments: CommentPost[];
  commentNumber: number;

  reactions: SocialPostReaction[];
  location?: {
    type?: string;
    coordinates?: number[];
  };
  locationName?: string;
  edited?: boolean;
}

export interface PostUserData {
  twitterHandler?: string;
  instagramHandler?: string;
  name: string;
  username?: string;
  _id?: string;
  accountType?: AccountType;
  profileImage?: string;
  profileIcon?: ReactElement;
}

export interface CommentPost {
  commentId?: string;
  dateSeconds: number;
  date: string;
  objectId: string;
  objectType: string;
  content: string;
  userData: {
    _id?: string;
    name: string;
    username?: string;
    accountType?: AccountType;
    profileImage?: string;
    twitterHandler?: string;
    instagramHandler?: string;
    isApprovedInfluencer?: boolean;
  };

  images?: string[];
  gif?: GiphyMedia;
  videos?: string[];
  created: Date;
  updated: Date;

  reactions?: SocialPostReaction[];
  response?: CommentPost[];
  edited?: boolean;
}
