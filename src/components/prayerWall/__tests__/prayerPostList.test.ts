import {
  appendUniquePrayerPosts,
  dedupePrayerPosts,
  getPrayerPostIdentity,
} from '../prayerPostList';

describe('prayerPostList', () => {
  it('reads the canonical prayer id from postId before id', () => {
    expect(
      getPrayerPostIdentity({
        postId: 'post-1',
        id: 'fallback-id',
      } as any)
    ).toBe('post-1');
  });

  it('dedupes repeated prayer posts while preserving the first occurrence order', () => {
    const deduped = dedupePrayerPosts([
      { postId: 'post-1', id: 'a' } as any,
      { postId: 'post-1', id: 'b' } as any,
      { id: 'post-2' } as any,
    ]);

    expect(deduped).toHaveLength(2);
    expect(deduped[0].postId).toBe('post-1');
    expect(deduped[1].id).toBe('post-2');
  });

  it('prevents overlapping paginated prayer batches from re-adding an existing row', () => {
    const merged = appendUniquePrayerPosts(
      [
        { postId: 'post-1', id: 'a' } as any,
        { postId: 'post-2', id: 'b' } as any,
      ],
      [
        { postId: 'post-2', id: 'c' } as any,
        { postId: 'post-3', id: 'd' } as any,
      ]
    );

    expect(merged.map((post) => post.postId ?? post.id)).toEqual(['post-1', 'post-2', 'post-3']);
  });
});
