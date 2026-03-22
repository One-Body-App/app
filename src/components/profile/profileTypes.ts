import { User } from '@/utils/types';

export type ProfileVariant = 'self' | 'public';

export interface ProfileProps {
  profileData: User;
  currentUser: User;
  relatedUsers?: User[];
  handleSubscribe?: Function;
  handleUnSubscribe?: Function;
  refreshToken?: number;
  variant?: ProfileVariant;
}
