import type { User } from '@/utils/types';

type ZoeAccessUser = Pick<User, 'role' | 'influencerProfile'> | null | undefined;

export function isAdminTierRole(role?: string | null) {
  const normalizedRole = String(role ?? '')
    .trim()
    .toLowerCase();

  return normalizedRole === 'admin' || normalizedRole === 'superadmin';
}

export function isZoeAiEligibleUser(user?: ZoeAccessUser) {
  if (!user) {
    return false;
  }

  if (isAdminTierRole(user.role)) {
    return true;
  }

  return user.influencerProfile?.influencerStatus === 'approved';
}
