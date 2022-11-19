export type Badge = {
  _id: string;
  deleteFlag: boolean;
  title: string;
  badge: string;
};

export type WhatIDo = {
  _id: string;
  whatIDo: string;
  deletedFlag: boolean;
};
export type UserProfile = {
  _id: string;
  gender: string;
  name: string;
  website: string;
  whatIDo: WhatIDo;
  isProfileCompleted: boolean;
  role: string;

  badges: string[];
  badgesData: Badge[];
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
