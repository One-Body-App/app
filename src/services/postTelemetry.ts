import { Platform } from 'react-native';

import {
  FeedTelemetryFeedType,
  trackFeedTelemetry,
  type FeedTelemetryEventInput,
} from '@/services/feedTelemetry';

export type PostTelemetrySurface = 'social_feed' | 'watch' | 'prayer_portal';

export type CanonicalPostTelemetryEventName =
  | 'post_impression'
  | 'post_view_qualified'
  | 'post_dwell'
  | 'post_open'
  | 'post_comment_open'
  | 'post_comment_add'
  | 'post_comment_edit'
  | 'post_comment_delete'
  | 'post_comment_reaction_add'
  | 'post_comment_reaction_remove'
  | 'post_media_open'
  | 'post_reaction_add'
  | 'post_reaction_remove'
  | 'post_share_initiated'
  | 'post_share_completed'
  | 'post_save_add'
  | 'post_save_remove'
  | 'post_repost'
  | 'post_quote_create'
  | 'post_video_start'
  | 'post_video_progress'
  | 'post_video_complete'
  | 'post_video_pause';

export type PostTelemetryContext = {
  postId: string;
  postType?: string;
  authorId?: string;
  contentType?: string;
  tags?: string[];
  userId?: string;
  surface: PostTelemetrySurface;
  surfaceTab?: string;
  entrypoint?: string;
  requestId?: string;
  rankPosition?: number;
  feedAlgorithm?: string;
  experimentBucket?: string;
  isOwnPost?: boolean;
  isRepost?: boolean;
  privacyState?: string;
  source?: string;
};

export type PostTelemetryEventInput = PostTelemetryContext & {
  eventName: CanonicalPostTelemetryEventName;
  eventId?: string;
  occurredAt?: string;
  visibleMs?: number;
  dwellMs?: number;
  playbackMs?: number;
  completionPct?: number;
  reactionType?: string;
  commentId?: string;
  shareChannel?: string;
  saveState?: string;
  result?: 'success' | 'cancel' | 'fail';
  metadata?: Record<string, unknown>;
  dedupeKey?: string;
};

export type PostTelemetryEventCallback = (
  eventName: CanonicalPostTelemetryEventName,
  metadata?: Record<string, unknown>,
  overrides?: Partial<PostTelemetryEventInput>
) => void;

const QUALIFIED_VIEW_THRESHOLD_MS = 2500;
const MAX_DEDUPE_ENTRIES = 1000;
const sessionId = `pts_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
const dedupeCache = new Map<string, true>();

const normalizeFeedType = (
  surface: PostTelemetrySurface,
  surfaceTab?: string
): FeedTelemetryFeedType => {
  if (surface === 'watch') {
    return 'watch';
  }
  if (surface === 'prayer_portal') {
    return 'pray';
  }
  if (surfaceTab === 'connected' || surfaceTab === 'foryou' || surfaceTab === 'read') {
    return surfaceTab;
  }
  return 'connected';
};

const createRandomId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export const createPostTelemetryRequestId = () => createRandomId('req');

const rememberDedupeKey = (dedupeKey: string) => {
  dedupeCache.set(dedupeKey, true);
  while (dedupeCache.size > MAX_DEDUPE_ENTRIES) {
    const oldestKey = dedupeCache.keys().next().value;
    if (!oldestKey) {
      break;
    }
    dedupeCache.delete(oldestKey);
  }
};

const shouldDedupeEvent = (
  eventName: CanonicalPostTelemetryEventName,
  dedupeKey?: string
): boolean => {
  if (!dedupeKey) {
    return false;
  }
  if (
    eventName !== 'post_impression' &&
    eventName !== 'post_open' &&
    eventName !== 'post_comment_open'
  ) {
    return false;
  }
  if (dedupeCache.has(dedupeKey)) {
    return true;
  }
  rememberDedupeKey(dedupeKey);
  return false;
};

const resolveLegacyEventType = (
  eventName: CanonicalPostTelemetryEventName,
  postType?: string
): FeedTelemetryEventInput['eventType'] => {
  switch (eventName) {
    case 'post_impression':
      return 'impression';
    case 'post_view_qualified':
      return 'qualified_view';
    case 'post_dwell':
      return 'dwell';
    case 'post_open':
      if (postType === 'rss') {
        return 'open_article';
      }
      if (postType === 'watch') {
        return 'open_watch';
      }
      return 'open_post';
    case 'post_comment_open':
      return 'open_comments';
    case 'post_comment_add':
      return 'post_comment';
    case 'post_comment_edit':
      return 'edit_comment';
    case 'post_comment_delete':
      return 'delete_comment';
    case 'post_comment_reaction_add':
      return 'comment_reaction';
    case 'post_comment_reaction_remove':
      return 'comment_reaction_removed';
    case 'post_media_open':
      return 'media_open';
    case 'post_reaction_add':
      return 'reaction';
    case 'post_reaction_remove':
      return 'reaction_removed';
    case 'post_share_initiated':
      return 'share_initiated';
    case 'post_share_completed':
      return 'share';
    case 'post_save_add':
      return 'save';
    case 'post_save_remove':
      return 'unsave';
    case 'post_repost':
      return 'repost';
    case 'post_quote_create':
      return 'quote_create';
    case 'post_video_start':
      return 'video_play';
    case 'post_video_progress':
      return 'video_progress';
    case 'post_video_complete':
      return 'video_complete';
    case 'post_video_pause':
      return 'video_pause';
    default:
      return eventName;
  }
};

const resolveDurationMs = (event: PostTelemetryEventInput) => {
  if (typeof event.dwellMs === 'number') {
    return event.dwellMs;
  }
  if (typeof event.visibleMs === 'number') {
    return event.visibleMs;
  }
  if (typeof event.playbackMs === 'number') {
    return event.playbackMs;
  }
  return undefined;
};

export const trackPostTelemetry = (event: PostTelemetryEventInput) => {
  if (!event.postId || !event.surface || !event.eventName) {
    return;
  }

  const dedupeKey =
    event.dedupeKey ??
    [
      event.eventName,
      event.requestId || 'no_request',
      event.surface,
      event.postId,
      event.commentId || '',
    ].join(':');
  if (shouldDedupeEvent(event.eventName, dedupeKey)) {
    return;
  }

  const legacyEventType = resolveLegacyEventType(event.eventName, event.postType);
  trackFeedTelemetry({
    eventId: event.eventId ?? createRandomId('evt'),
    eventType: legacyEventType,
    canonicalEventName: event.eventName,
    feedType: normalizeFeedType(event.surface, event.surfaceTab),
    postId: event.postId,
    postType: event.postType,
    contentType: event.contentType,
    tags: event.tags,
    durationMs: resolveDurationMs(event),
    position: event.rankPosition,
    rankPosition: event.rankPosition,
    source: event.source ?? event.entrypoint,
    occurredAt: event.occurredAt,
    timestamp: event.occurredAt,
    sessionId,
    requestId: event.requestId,
    userId: event.userId,
    authorId: event.authorId,
    surface: event.surface,
    surfaceTab: event.surfaceTab,
    entrypoint: event.entrypoint,
    feedAlgorithm: event.feedAlgorithm,
    experimentBucket: event.experimentBucket,
    isOwnPost: event.isOwnPost,
    isRepost: event.isRepost,
    privacyState: event.privacyState,
    result: event.result,
    metadata: {
      canonicalEventName: event.eventName,
      visibleMs: event.visibleMs,
      dwellMs: event.dwellMs,
      playbackMs: event.playbackMs,
      completionPct: event.completionPct,
      reactionType: event.reactionType,
      commentId: event.commentId,
      shareChannel: event.shareChannel,
      saveState: event.saveState,
      dedupeKey,
      clientPlatform: Platform.OS,
      ...event.metadata,
    },
  });
};

export const createPostTelemetryTracker =
  (context: PostTelemetryContext): PostTelemetryEventCallback =>
  (eventName, metadata, overrides) => {
    trackPostTelemetry({
      ...context,
      ...overrides,
      eventName,
      metadata: {
        ...(metadata ?? {}),
        ...(overrides?.metadata ?? {}),
      },
    });
  };

export const maybeTrackQualifiedPostView = (
  context: PostTelemetryContext,
  visibleMs: number,
  metadata?: Record<string, unknown>
) => {
  if (!Number.isFinite(visibleMs) || visibleMs < QUALIFIED_VIEW_THRESHOLD_MS) {
    return;
  }
  trackPostTelemetry({
    ...context,
    eventName: 'post_view_qualified',
    visibleMs,
    metadata,
  });
};
