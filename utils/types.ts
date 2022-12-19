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
  longitude: number;
  latitude: number;
  address: string;
};

export type TGender = 'Male' | 'Female';

type Profile = {
  churchType?: string;
  oftenChurch?: string;
  dateOfBirth: string;
  gender: TGender;
  location: Location;
  companyName?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhoneNumber?: string;
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
  role: string;
  updatedAt: string;
  username: string;
  bio?: string;
  website: string;

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
  instagramId?: string;
  instagramHandler?: string;
  rssUrl: string;
  category: string[];
  comments: string;
  influencerStatus: 'approved' | 'pending';
  createdAt: string;
  updatedAt: string;
};

export type ArticleType = {
  link?: string;
  created: Date;
  image: { url: string };
  title: string | { a: any };
  userData: {
    _id: string;
    name: string;
    username: string;
    role: string;
    profileImage: string;
  };
};
