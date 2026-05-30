import {
  getNotificationCategories,
  getPrimaryNotificationCategory,
} from './notificationCategories';

describe('notificationCategories', () => {
  it('classifies prayer notifications from postType metadata', () => {
    expect(
      getNotificationCategories({
        title: 'Someone reacted',
        body: 'You have a new update',
        data: { postType: 'prayer' },
      })
    ).toEqual(['prayers']);
  });

  it('classifies rss notifications as blog posts from metadata', () => {
    expect(
      getNotificationCategories({
        title: 'Fresh update',
        body: 'Tap to open',
        data: { postType: 'rss' },
      })
    ).toEqual(['blog_posts']);
  });

  it('uses mention metadata before generic feed text', () => {
    expect(
      getNotificationCategories({
        title: 'New activity on your post',
        body: 'Someone mentioned you',
        notificationType: 'mention',
        notificationSource: 'activity',
      })
    ).toEqual(['tagged', 'feed']);
  });

  it('falls back to text when metadata is only generic feed activity', () => {
    expect(
      getNotificationCategories({
        title: 'Prayer request update',
        body: 'A new comment was added',
        notificationType: 'activity',
      })
    ).toEqual(['prayers', 'feed']);
  });

  it('classifies serve and go notifications from metadata tokens', () => {
    expect(
      getNotificationCategories({
        notificationSource: 'serve_application',
      })
    ).toEqual(['serve']);

    expect(
      getNotificationCategories({
        notificationType: 'connect_event_invite',
      })
    ).toEqual(['go']);
  });

  it('defaults to feed when no structured or textual signal is present', () => {
    expect(
      getNotificationCategories({
        title: 'Notification',
        body: 'Open the app',
      })
    ).toEqual(['feed']);
  });

  it('returns the first matching category as the primary category', () => {
    expect(
      getPrimaryNotificationCategory({
        title: 'Mission opportunity',
        body: 'Join this outreach event',
        notificationType: 'activity',
      })
    ).toBe('go');
  });
});
