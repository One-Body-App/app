import { AccountType, User } from '@/utils/types';
import {
  getProfileDisplayName,
  getProfileRoleLabel,
  getProfileTypeLabel,
  getVisibleProfileTabs,
} from './profileUtils';

const createUser = (overrides: Partial<User> = {}): User =>
  ({
    _id: 'user-1',
    accountType: AccountType.individual,
    badges: [],
    badgesData: [],
    createdAt: '2026-03-01T00:00:00.000Z',
    deactivated: { isDeactivated: false },
    email: 'user@example.com',
    interests: [],
    isInfluencer: false,
    isProfileCompleted: true,
    name: 'Nick Crawford',
    profile: {
      dateOfBirth: '1990-01-01',
      gender: 'Male',
      location: {},
    },
    token: '',
    updatedAt: '2026-03-01T00:00:00.000Z',
    userId: 'user-1',
    username: 'nickcrawford',
    website: '',
    following: [],
    gender: 'Male',
    pushNotificationsEnabled: true,
    emailNotificationsEnabled: true,
    subscribedToNewsletter: false,
    ...overrides,
  }) as User;

describe('profileUtils', () => {
  it('prefers company name for organization display names', () => {
    const profile = createUser({
      accountType: AccountType.organization,
      name: 'Fallback Name',
      profile: {
        dateOfBirth: '1990-01-01',
        gender: 'Male',
        location: {},
        companyName: 'One Body Org',
      },
    });

    expect(getProfileDisplayName(profile)).toBe('One Body Org');
  });

  it('builds approved creator type labels', () => {
    const profile = createUser({
      accountType: AccountType.organization,
      influencerProfile: {
        _id: 'influencer-1',
        rssUrl: '',
        category: [],
        comments: '',
        influencerStatus: 'approved',
        createdAt: '',
        updatedAt: '',
      },
    });

    expect(getProfileTypeLabel(profile)).toBe('Organization Creator');
  });

  it('returns the expected visible tabs for a creator profile', () => {
    const profile = createUser({
      influencerProfile: {
        _id: 'influencer-1',
        instagramId: 'insta-1',
        rssUrl: 'https://example.com/feed.xml',
        category: [],
        comments: '',
        influencerStatus: 'approved',
        createdAt: '',
        updatedAt: '',
      },
      watchCount: 2,
    });

    expect(getVisibleProfileTabs(profile)).toEqual(['post', 'social', 'blog', 'watch']);
  });

  it('returns an empty role label when the role field is not a string', () => {
    const profile = createUser({
      profile: {
        dateOfBirth: '1990-01-01',
        gender: 'Male',
        location: {},
        typeOfOrganization: {
          organizationType: undefined,
          name: undefined,
        } as any,
      },
    });

    expect(getProfileRoleLabel(profile)).toBe('');
  });
});
