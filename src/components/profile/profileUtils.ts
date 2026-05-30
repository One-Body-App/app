import { AccountType, User } from '@/utils/types';

export type ProfileTabKey = 'post' | 'social' | 'blog' | 'watch';

export const getProfileDisplayName = (profile: User) => {
  if (profile.accountType === AccountType.organization && profile.profile?.companyName) {
    return profile.profile.companyName;
  }

  return profile.name;
};

export const getProfileRoleLabel = (profile: User) => {
  const organizationRole =
    profile.profile?.organizationCategory && profile.profile?.organizationSubType
      ? `${profile.profile.organizationCategory} - ${profile.profile.organizationSubType}`
      : profile.profile?.organizationSubType || profile.profile?.organizationCategory || '';

  const roleName =
    profile.profile?.whatIDo?.name ||
    organizationRole ||
    profile.profile?.typeOfOrganization?.organizationType ||
    profile.profile?.typeOfOrganization?.name ||
    '';

  return typeof roleName === 'string' ? roleName.trim() : '';
};

export const getProfileTypeLabel = (profile: User) => {
  const baseLabel =
    profile.accountType === AccountType.organization ? 'Organization' : 'Individual';

  if (profile.influencerProfile?.influencerStatus === 'approved') {
    return `${baseLabel} Creator`;
  }

  return baseLabel;
};

export const getVisibleProfileTabs = (profile: User): ProfileTabKey[] => {
  const tabs: ProfileTabKey[] = ['post'];

  if (profile.influencerProfile?.instagramId) {
    tabs.push('social');
  }

  if (
    profile.influencerProfile?.rssUrl ||
    profile.influencerProfile?.influencerStatus === 'approved'
  ) {
    tabs.push('blog');
  }

  if ((profile.watchCount ?? 0) > 0) {
    tabs.push('watch');
  }

  return tabs;
};
