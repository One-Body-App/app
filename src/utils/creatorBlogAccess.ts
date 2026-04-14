import type { User } from '@/utils/types';

type CreatorBlogEligibleUser = Pick<User, 'role' | 'influencerProfile'> | null | undefined;

export default function isCreatorBlogEligible(user?: CreatorBlogEligibleUser) {
  if (!user) {
    return false;
  }

  const normalizedRole = String(user.role ?? '')
    .trim()
    .toLowerCase();

  return normalizedRole === 'creator' || user.influencerProfile?.influencerStatus === 'approved';
}
