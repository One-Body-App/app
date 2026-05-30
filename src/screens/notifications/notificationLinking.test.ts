import {
  buildNotificationPostDeepLink,
  normalizeNotificationTapUrl,
  resolveNotificationTargetUrl,
} from './notificationLinking';

describe('notificationLinking', () => {
  it('prefers the top-level notification url when present', () => {
    expect(
      resolveNotificationTargetUrl({
        url: 'onebodyapp://post/social/post-1',
        data: {
          url: 'onebodyapp://post/social/post-2',
        },
      })
    ).toBe('onebodyapp://post/social/post-1');
  });

  it('uses a nested notification url when the top-level url is missing', () => {
    expect(
      resolveNotificationTargetUrl({
        data: {
          url: 'onebodyapp://post/social/post-2',
        },
      })
    ).toBe('onebodyapp://post/social/post-2');
  });

  it('reconstructs a post deep link from postType and postId when no url exists', () => {
    expect(
      resolveNotificationTargetUrl({
        data: {
          postType: 'social',
          postId: 'post-3',
        },
      })
    ).toBe('onebodyapp://post/social/post-3');
  });

  it('preserves malformed direct urls so the existing invalid-link alert path can handle them', () => {
    expect(
      resolveNotificationTargetUrl({
        url: 'not a valid url',
        data: {
          postType: 'social',
          postId: 'post-4',
        },
      })
    ).toBe('not a valid url');
  });

  it('normalizes onebody web notification urls into app deep links', () => {
    expect(normalizeNotificationTapUrl('https://app.onebodyapp.com/post/social/post-5')).toBe(
      'onebodyapp://post/social/post-5'
    );
  });

  it('builds comment-aware deep links when a comment id is present', () => {
    expect(buildNotificationPostDeepLink('social', 'post-6', 'comment-1')).toBe(
      'onebodyapp://post/social/post-6?commentId=comment-1'
    );
  });
});
