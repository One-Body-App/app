import { ApiCall } from '@/services/api';
import {
  buildRepostSourceSnapshot,
  clearRepostSourceResolverCache,
  isRepostSourceSnapshotMissing,
  resolveRepostSourceSnapshot,
} from '@/services/repostSourceResolver';
import type { SocialPost } from '@/utils/types';

jest.mock('@/services/api', () => ({
  ApiCall: jest.fn(),
}));

const mockedApiCall = ApiCall as jest.MockedFunction<typeof ApiCall>;

describe('repostSourceResolver', () => {
  beforeEach(() => {
    mockedApiCall.mockReset();
    clearRepostSourceResolverCache();
  });

  it('uses existing repost metadata when source snapshot is complete', async () => {
    const repostMeta = {
      sourceType: 'social',
      sourceId: 'source-id',
      sourceAuthorName: 'Source User',
      sourceAuthorUsername: 'source_user',
      sourceAuthorProfileImage: 'https://example.com/source.jpg',
      sourceCreatedAt: '2026-02-22T08:00:00.000Z',
      sourceContent: 'Source content',
      repostType: 'repost',
    } as NonNullable<SocialPost['repost']>;

    expect(isRepostSourceSnapshotMissing(repostMeta)).toBe(false);

    const resolvedSnapshot = await resolveRepostSourceSnapshot(repostMeta, 'token');

    expect(mockedApiCall).not.toHaveBeenCalled();
    expect(resolvedSnapshot).toEqual(
      expect.objectContaining({
        sourceId: 'source-id',
        sourceAuthorName: 'Source User',
        sourceAuthorUsername: 'source_user',
        sourceContent: 'Source content',
      })
    );
  });

  it('fetches missing legacy metadata and caches by source key', async () => {
    mockedApiCall.mockResolvedValue({
      status: 200,
      response: {
        postId: 'source-id',
        created: '2026-02-22T08:00:00.000Z',
        content: 'Hydrated source content',
        userData: {
          _id: 'source-user-id',
          name: 'Hydrated User',
          username: 'hydrated_user',
          profileImage: 'https://example.com/hydrated.jpg',
        },
      },
    } as any);

    const legacyRepostMeta = {
      sourceType: 'social',
      sourceId: 'onebody_source-id',
      repostType: 'repost',
    } as NonNullable<SocialPost['repost']>;

    expect(isRepostSourceSnapshotMissing(legacyRepostMeta)).toBe(true);

    const firstResolved = await resolveRepostSourceSnapshot(legacyRepostMeta, 'token');
    const secondResolved = await resolveRepostSourceSnapshot(legacyRepostMeta, 'token');

    expect(mockedApiCall).toHaveBeenCalledTimes(1);
    expect(mockedApiCall).toHaveBeenCalledWith(
      expect.objectContaining({
        route: 'social/post/source-id',
        verb: 'get',
      })
    );
    expect(firstResolved).toEqual(
      expect.objectContaining({
        sourceId: 'source-id',
        sourceAuthorName: 'Hydrated User',
        sourceAuthorUsername: 'hydrated_user',
        sourceContent: 'Hydrated source content',
      })
    );
    expect(secondResolved).toEqual(firstResolved);

    const builtSnapshot = buildRepostSourceSnapshot(legacyRepostMeta);
    expect(builtSnapshot?.sourceId).toBe('onebody_source-id');
  });
});
