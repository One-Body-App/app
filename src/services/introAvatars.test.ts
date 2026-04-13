import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import getCachedIntroAvatars from './introAvatars';

jest.mock('./constants', () => ({
  BASE_URL: 'https://stagingapi.onebodyapp.com/api',
  NO_PROFILE_IMAGE: 'https://cdn.onebodyapp.com/user/no-image.png',
}));

describe('introAvatars', () => {
  const mockFetch = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    global.fetch = mockFetch as unknown as typeof fetch;
    await mockAsyncStorage.clear();
  });

  it('fetches intro avatars from the public origin and caches them', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [
        { profileImage: 'https://cdn.onebodyapp.com/user/no-image.png' },
        { profileImage: 'https://cdn.example.com/one.png' },
        { profileImage: 'https://cdn.example.com/two.png' },
      ],
    });

    await expect(getCachedIntroAvatars()).resolves.toEqual([
      'https://cdn.example.com/one.png',
      'https://cdn.example.com/two.png',
      null,
      null,
    ]);
    expect(mockFetch).toHaveBeenCalledWith('https://stagingapi.onebodyapp.com/intro-avatars.json', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    const rawCache = await mockAsyncStorage.getItem('@onebody:introAvatars');
    expect(rawCache).toContain('https://cdn.example.com/one.png');
    expect(rawCache).not.toContain('no-image.png');
  });

  it('revalidates on cold start even when the cache is fresh', async () => {
    await mockAsyncStorage.setItem(
      '@onebody:introAvatars',
      JSON.stringify({
        urls: ['https://cdn.example.com/cached.png'],
        fetchedAt: Date.now(),
      })
    );
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [{ profileImage: 'https://cdn.example.com/network.png' }],
    });

    await expect(getCachedIntroAvatars()).resolves.toEqual([
      'https://cdn.example.com/network.png',
      null,
      null,
      null,
    ]);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('falls back to stale cache when the network fetch fails', async () => {
    await mockAsyncStorage.setItem(
      '@onebody:introAvatars',
      JSON.stringify({
        urls: ['https://cdn.example.com/stale.png'],
        fetchedAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
      })
    );
    mockFetch.mockRejectedValue(new Error('network down'));

    await expect(getCachedIntroAvatars()).resolves.toEqual([
      'https://cdn.example.com/stale.png',
      null,
      null,
      null,
    ]);
  });

  it('falls back to cache when the network only returns placeholder avatars', async () => {
    await mockAsyncStorage.setItem(
      '@onebody:introAvatars',
      JSON.stringify({
        urls: ['https://cdn.example.com/cached.png'],
        fetchedAt: Date.now(),
      })
    );
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [{ profileImage: 'https://cdn.onebodyapp.com/user/no-image.png' }],
    });

    await expect(getCachedIntroAvatars()).resolves.toEqual([
      'https://cdn.example.com/cached.png',
      null,
      null,
      null,
    ]);
  });

  it('filters placeholder urls even when they include a query string', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [
        { profileImage: 'https://cdn.onebodyapp.com/user/no-image.png?cache=1' },
        { profileImage: 'https://cdn.example.com/real.png' },
      ],
    });

    await expect(getCachedIntroAvatars()).resolves.toEqual([
      'https://cdn.example.com/real.png',
      null,
      null,
      null,
    ]);
  });
});
