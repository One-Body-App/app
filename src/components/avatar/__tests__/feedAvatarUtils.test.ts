import {
  isFeedAvatarPlaceholderUri,
  resolveFeedAvatarUri,
  resolveProfileAvatarUri,
} from '../feedAvatarUtils';

jest.mock('@/services/constants', () => ({
  NO_PROFILE_IMAGE: 'https://cdn.onebodyapp.com/user/no-image.png',
}));

describe('feedAvatarUtils', () => {
  it('prefers a real feed avatar over placeholder values', () => {
    expect(
      resolveFeedAvatarUri({
        authorAvatar: 'https://cdn.onebodyapp.com/user/no-image.png',
        userData: {
          profileImage: ' https://cdn.example.com/real-avatar.png ',
        },
      })
    ).toBe('https://cdn.example.com/real-avatar.png');
  });

  it('supports avatar variants across user and userData payloads', () => {
    expect(
      resolveFeedAvatarUri({
        user: {
          profile_image: 'https://cdn.example.com/user-profile-image.png',
        },
      })
    ).toBe('https://cdn.example.com/user-profile-image.png');

    expect(
      resolveFeedAvatarUri({
        userData: {
          avatar: 'https://cdn.example.com/user-avatar.png',
        },
      })
    ).toBe('https://cdn.example.com/user-avatar.png');
  });

  it('returns the configured placeholder when no usable avatar exists', () => {
    expect(
      resolveFeedAvatarUri({
        authorAvatar: '   ',
        user: {
          profileImage: '',
          avatar: 'https://cdn.onebodyapp.com/user/no-image.png?cache=1',
        },
        userData: {
          profile_image: ' ',
        },
      })
    ).toBe('https://cdn.onebodyapp.com/user/no-image.png');
  });

  it('resolves profile snapshots using profileImage, avatar, and profile_image', () => {
    expect(
      resolveProfileAvatarUri({
        profileImage: '',
        avatar: 'https://cdn.example.com/profile-avatar.png',
      })
    ).toBe('https://cdn.example.com/profile-avatar.png');

    expect(
      resolveProfileAvatarUri({
        profileImage: 'https://cdn.onebodyapp.com/user/no-image.png',
        profile_image: 'https://cdn.example.com/profile-image.png',
      })
    ).toBe('https://cdn.example.com/profile-image.png');
  });

  it('detects configured placeholder avatar urls', () => {
    expect(isFeedAvatarPlaceholderUri('https://cdn.onebodyapp.com/user/no-image.png')).toBe(true);
    expect(isFeedAvatarPlaceholderUri('https://cdn.onebodyapp.com/user/no-image.png?cache=1')).toBe(
      true
    );
    expect(isFeedAvatarPlaceholderUri('https://cdn.example.com/real-avatar.png')).toBe(false);
  });
});
