import { User } from '@/utils/types';
import { ProfileAvatarAnimationResult } from './useProfileAvatarAnimation';

export type ProfileVariant = 'self' | 'public';

export interface ProfileProps {
  profileData: User;
  currentUser: User;
  relatedUsers?: User[];
  handleSubscribe?: Function;
  handleUnSubscribe?: Function;
  refreshToken?: number;
  variant?: ProfileVariant;
  avatarExpansionEnabled?: boolean;
  avatarAnimation?: ProfileAvatarAnimationResult;
}
