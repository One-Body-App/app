import { canOpenAvatarOverlay } from './avatarOverlayEligibility';

describe('avatarOverlayEligibility', () => {
  it('returns false for an empty image uri', async () => {
    await expect(
      canOpenAvatarOverlay({
        expandedSize: 240,
        imageUri: '',
      })
    ).resolves.toBe(false);
  });

  it('returns false for a placeholder avatar uri', async () => {
    await expect(
      canOpenAvatarOverlay({
        expandedSize: 240,
        imageUri: 'https://cdn.onebodyapp.com/user/no-image.png',
      })
    ).resolves.toBe(false);
  });

  it('returns false for a low-resolution image', async () => {
    const getImageSize = jest.fn((uri, success: (width: number, height: number) => void) => {
      success(320, 320);
    });

    await expect(
      canOpenAvatarOverlay({
        expandedSize: 240,
        imageUri: 'https://cdn.example.com/avatar-small.jpg',
        pixelRatio: 3,
        getImageSize,
      })
    ).resolves.toBe(false);
  });

  it('returns true for a sufficiently large image', async () => {
    const getImageSize = jest.fn((uri, success: (width: number, height: number) => void) => {
      success(1200, 1200);
    });

    await expect(
      canOpenAvatarOverlay({
        expandedSize: 240,
        imageUri: 'https://cdn.example.com/avatar-large.jpg',
        pixelRatio: 3,
        getImageSize,
      })
    ).resolves.toBe(true);
  });
});
