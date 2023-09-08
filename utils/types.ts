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

export type Location = {
  longitude?: number;
  latitude?: number;
  address: string;
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
};

export type SavedPost = {
  title: string;
  image: string;
  createdAt: Date;
  userId: string;
  link: string;
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
  accountType: AccountType;
  updatedAt: string;
  username: string;
  bio?: string;
  website: string;

  _id: string;
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
  savedPost?: SavedPost[];
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
  image: { url: string };
  title: string | { a: any };
  userData: {
    _id: string;
    name: string;
    username: string;
    accountType: AccountType;
    profileImage: string;
  };
};

export enum AccountType {
  individual = 'individual',
  organization = 'organization',
}

export type NotificationType = {
  _id: string;
  userID?: string;
  title: string;
  description: string;
};
