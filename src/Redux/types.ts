export type UserProfile = {
  gender: string;
  name: string;
  website: string;
  whatIDo: string[];
  isProfileCompleted: boolean;
  role: string;

  badges: string[];
  createdAt: string;
  email: string;
  interests: string[];
  token: string;
  updatedAt: string;
  userId: string;
  isInfluencer: boolean;
  followers: number;

  pushNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  subscribeToNewsletter: boolean;

  profileImage?: string;
};
