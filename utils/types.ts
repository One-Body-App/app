import { Badge } from '@/src/Redux/types';

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
export type whatIDo = {
  _id: string;
  deleteFlag: boolean;
  whatIDo: string;
  createdAt: string;
  updatedAt: string;
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
  profileImage: string;
  role: string;
  updatedAt: string;
  username: string;
  website: string;
  whatIDo: whatIDo;
  _id: string;
  badgesData: Badge[];
  gender: string;
  token: string;
  userId: string;
  followers: number;
  following: string[];
  pushNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  subscribedToNewsletter: boolean;
  influencerProfile?: InfluencerProfile;
};

type InfluencerProfile = {
  _id: string;
  userID?: string;
  twitterId?: string;
  twitterHandler?: string;
  instagramId?: string;
  instagramHandler?: string;
  rssUrl: string;
  category: string[];
  comments: string;
  influencerStatus: 'approved' | 'pending';
  createdAt: string;
  updatedAt: string;
};

export type OrganizationType = {
  organizationType: string;

  _id: string;
};
