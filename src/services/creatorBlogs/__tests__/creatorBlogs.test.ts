import { createCreatorBlogService } from '../index';

const createStorage = (seed: Record<string, string> = {}) => {
  const values = new Map(Object.entries(seed));

  return {
    getItem: jest.fn(async (key: string) => values.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      values.set(key, value);
    }),
  };
};

const author = {
  _id: 'user-1',
  name: 'Jordan Fields',
  username: 'jordanfields',
  role: 'creator',
  influencerProfile: {
    influencerStatus: 'approved',
  },
};

describe('creatorBlogService', () => {
  it('seeds author blogs once and returns summaries', async () => {
    const storage = createStorage();
    const service = createCreatorBlogService({
      storage: storage as any,
      now: () => '2026-04-13T12:00:00.000Z',
      createId: () => 'blog-new',
    });

    const items = await service.listBlogsForAuthor(author as any);
    const summary = await service.getBlogSummary(author as any);

    expect(items.length).toBeGreaterThan(1);
    expect(summary.publishedCount).toBeGreaterThan(0);
    expect(storage.setItem).toHaveBeenCalled();
  });

  it('saves and publishes drafts with validation', async () => {
    const storage = createStorage();
    const service = createCreatorBlogService({
      storage: storage as any,
      now: () => '2026-04-13T12:00:00.000Z',
      createId: () => 'blog-new',
    });

    const saved = await service.saveDraft(author as any, {
      title: 'A New Mercy Every Morning',
      subtitle: 'Learning steadiness',
      coverImage: null,
      tags: ['Faith'],
      body: 'Simple body copy',
    });

    expect(saved.id).toBe('blog-new');

    const publishAttempt = await service.publishBlog(author as any, {
      id: saved.id,
      title: saved.title,
      subtitle: saved.subtitle,
      coverImage: null,
      tags: saved.tags,
      body: saved.body,
    });
    expect(publishAttempt.blog).toBeNull();
    expect(publishAttempt.validationErrors.coverImage).toBeTruthy();

    const published = await service.publishBlog(author as any, {
      id: saved.id,
      title: saved.title,
      subtitle: saved.subtitle,
      coverImage: 'https://example.com/cover.jpg',
      tags: saved.tags,
      body: saved.body,
    });

    expect(published.blog?.status).toBe('published');
  });
});
