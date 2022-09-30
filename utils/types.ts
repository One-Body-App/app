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
  OTP: { status: boolean };
  badges: string[];
  createdAt: string;
  deactivated: { isDeactivated: boolean };
  email: string;
  interests: string[];
  isInfluencer: boolean;
  isProfileCompleted: boolean;
  name: string;
  profileImage: string;
  role: string;
  updatedAt: string;
  userName: string;
  website: string;
  whatIDo: whatIDo;
  _id: string;
};

export type OrganizationType = {
  organizationType: string;

  _id: string;
};
