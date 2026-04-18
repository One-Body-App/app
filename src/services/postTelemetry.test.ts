const mockTrackFeedTelemetry = jest.fn();

jest.mock('./feedTelemetry', () => ({
  trackFeedTelemetry: (...args: unknown[]) => mockTrackFeedTelemetry(...args),
}));

describe('postTelemetry', () => {
  beforeEach(() => {
    jest.resetModules();
    mockTrackFeedTelemetry.mockClear();
  });

  // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
  const loadModule = () => require('./postTelemetry') as typeof import('./postTelemetry');

  it('maps canonical post events to the legacy feed telemetry contract', () => {
    const { trackPostTelemetry } = loadModule();

    trackPostTelemetry({
      eventName: 'post_open',
      postId: 'watch-post-1',
      postType: 'watch',
      contentType: 'watch',
      surface: 'watch',
      surfaceTab: 'watch',
      entrypoint: 'watch_feed',
      requestId: 'req_watch_1',
      rankPosition: 3,
      metadata: {
        origin: 'watch_card',
      },
    });

    expect(mockTrackFeedTelemetry).toHaveBeenCalledTimes(1);
    expect(mockTrackFeedTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'open_watch',
        canonicalEventName: 'post_open',
        feedType: 'watch',
        postId: 'watch-post-1',
        postType: 'watch',
        contentType: 'watch',
        requestId: 'req_watch_1',
        rankPosition: 3,
        metadata: expect.objectContaining({
          canonicalEventName: 'post_open',
          origin: 'watch_card',
          dedupeKey: 'post_open:req_watch_1:watch:watch-post-1:',
        }),
      })
    );
  });

  it('dedupes impression, open, and comment-open events within a request scope', () => {
    const { trackPostTelemetry } = loadModule();

    trackPostTelemetry({
      eventName: 'post_impression',
      postId: 'post-1',
      postType: 'social',
      surface: 'social_feed',
      requestId: 'req_a',
    });
    trackPostTelemetry({
      eventName: 'post_impression',
      postId: 'post-1',
      postType: 'social',
      surface: 'social_feed',
      requestId: 'req_a',
    });
    trackPostTelemetry({
      eventName: 'post_open',
      postId: 'post-1',
      postType: 'social',
      surface: 'social_feed',
      requestId: 'req_a',
    });
    trackPostTelemetry({
      eventName: 'post_open',
      postId: 'post-1',
      postType: 'social',
      surface: 'social_feed',
      requestId: 'req_a',
    });
    trackPostTelemetry({
      eventName: 'post_comment_open',
      postId: 'post-1',
      postType: 'social',
      surface: 'social_feed',
      requestId: 'req_a',
    });
    trackPostTelemetry({
      eventName: 'post_comment_open',
      postId: 'post-1',
      postType: 'social',
      surface: 'social_feed',
      requestId: 'req_a',
    });
    trackPostTelemetry({
      eventName: 'post_impression',
      postId: 'post-1',
      postType: 'social',
      surface: 'social_feed',
      requestId: 'req_b',
    });

    expect(mockTrackFeedTelemetry).toHaveBeenCalledTimes(4);
    expect(mockTrackFeedTelemetry.mock.calls.map((call) => call[0].eventType)).toEqual([
      'impression',
      'open_post',
      'open_comments',
      'impression',
    ]);
  });
});
