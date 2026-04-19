import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { AccountType, User } from '@/utils/types';
import Profile from './Profile';
import { useProfileAvatarAnimation } from './useProfileAvatarAnimation';
import { useAvatarOverlayEligibility } from './avatarOverlayEligibility';

const mockAnimation = {
  backdropOpacity: { value: 0 },
  close: jest.fn(),
  closeBtnOpacity: { value: 0 },
  expandedSize: 240,
  imageScale: { value: 1 },
  imageSize: { value: 84 },
  imageXCoord: { value: 0 },
  imageYCoord: { value: 0 },
  isOpen: { value: 0 },
  onTargetLayout: jest.fn(),
  open: jest.fn(),
  reset: jest.fn(),
  targetRef: null,
};

jest.mock('@react-navigation/native', () => ({
  useTheme: jest.fn(() => ({
    colors: {
      background: '#FFFFFF',
      text: '#111111',
    },
    dark: false,
  })),
}));

jest.mock('./useProfileAvatarAnimation', () => ({
  useProfileAvatarAnimation: jest.fn(),
}));

jest.mock('./avatarOverlayEligibility', () => ({
  useAvatarOverlayEligibility: jest.fn(),
}));

jest.mock('./ProfileHeader', () => () => null);
const mockProfileAvatarOverlay = jest.fn(() => null);
jest.mock('./ProfileAvatarOverlay', () => (props: unknown) => mockProfileAvatarOverlay(props));
jest.mock('../SocialFlatlist', () => () => null);
jest.mock('../BlogFlatlist', () => () => null);
jest.mock('../WatchFlatlist', () => () => null);
jest.mock('@/src/hooks/useMountEffect', () => {
  const ReactLocal = require('react');
  return (callback: () => void | (() => void)) => {
    ReactLocal.useEffect(() => callback(), [callback]);
  };
});
jest.mock('@/src/services/recentCompletedWatchUploads', () => ({
  getRecentCompletedWatchUploadsSnapshot: jest.fn(() => []),
  subscribeRecentCompletedWatchUploads: jest.fn(() => jest.fn()),
}));

const mockedUseProfileAvatarAnimation = useProfileAvatarAnimation as jest.MockedFunction<
  typeof useProfileAvatarAnimation
>;
const mockedUseAvatarOverlayEligibility = useAvatarOverlayEligibility as jest.MockedFunction<
  typeof useAvatarOverlayEligibility
>;

const buildUser = (overrides: Partial<User> = {}): User =>
  ({
    _id: 'user-1',
    accountType: AccountType.individual,
    badges: [],
    badgesData: [],
    bio: '',
    createdAt: '2026-03-01T00:00:00.000Z',
    deactivated: { isDeactivated: false },
    email: 'user@example.com',
    following: [],
    gender: '',
    interests: [],
    isInfluencer: false,
    isProfileCompleted: true,
    name: 'Nick Building',
    profile: {
      isLocationPublic: false,
    } as User['profile'],
    pushNotificationsEnabled: true,
    emailNotificationsEnabled: true,
    subscribedToNewsletter: false,
    token: 'token',
    updatedAt: '2026-03-01T00:00:00.000Z',
    userId: 'user-1',
    username: 'nick',
    website: '',
    ...overrides,
  }) as User;

describe('Profile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseProfileAvatarAnimation.mockReturnValue(mockAnimation as any);
    mockedUseAvatarOverlayEligibility.mockReturnValue(true);
  });

  it('resets avatar animation state on mount, profile change, and unmount', () => {
    const currentUser = buildUser();
    const firstProfile = buildUser({
      _id: 'user-2',
      profileImage: 'https://cdn.example.com/one.jpg',
      username: 'one',
    });
    const secondProfile = buildUser({
      _id: 'user-3',
      profileImage: 'https://cdn.example.com/two.jpg',
      username: 'two',
    });

    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <Profile currentUser={currentUser} profileData={firstProfile} variant="public" />
      );
    });

    expect(mockAnimation.reset).toHaveBeenCalledTimes(1);

    act(() => {
      renderer!.update(
        <Profile currentUser={currentUser} profileData={secondProfile} variant="public" />
      );
    });

    expect(mockAnimation.reset).toHaveBeenCalledTimes(3);

    act(() => {
      renderer!.unmount();
    });

    expect(mockAnimation.reset).toHaveBeenCalledTimes(4);
  });

  it('requires avatar expansion to be enabled before mounting the overlay', () => {
    const currentUser = buildUser();
    const profile = buildUser({
      _id: 'user-2',
      profileImage: 'https://cdn.example.com/one.jpg',
      username: 'one',
    });

    act(() => {
      TestRenderer.create(
        <Profile
          currentUser={currentUser}
          profileData={profile}
          variant="public"
          avatarExpansionEnabled={false}
        />
      );
    });

    expect(mockProfileAvatarOverlay).not.toHaveBeenCalled();

    act(() => {
      TestRenderer.create(
        <Profile
          currentUser={currentUser}
          profileData={profile}
          variant="public"
          avatarExpansionEnabled
        />
      );
    });

    expect(mockProfileAvatarOverlay).toHaveBeenCalled();
  });
});
