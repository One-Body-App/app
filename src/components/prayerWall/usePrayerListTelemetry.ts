import { useCallback, useMemo, useRef } from 'react';
import type { ViewToken } from 'react-native';

import type { PrayerPost } from '@/utils/types';
import {
  createPostTelemetryRequestId,
  maybeTrackQualifiedPostView,
  trackPostTelemetry,
  type CanonicalPostTelemetryEventName,
  type PostTelemetryEventInput,
} from '@/services/postTelemetry';

type PrayerListTelemetryOptions = {
  currentUserId?: string;
  entrypoint: string;
};

type PrayerVisibilityRecord = {
  index: number;
  item: PrayerPost;
  startedAt: number;
};

const getPrayerPostId = (item: PrayerPost) => String(item.postId ?? item.id ?? '');

export const usePrayerListTelemetry = ({
  currentUserId,
  entrypoint,
}: PrayerListTelemetryOptions) => {
  const requestIdRef = useRef(createPostTelemetryRequestId());
  const visiblePostsRef = useRef<Map<string, PrayerVisibilityRecord>>(new Map());
  const impressionKeysRef = useRef<Set<string>>(new Set());

  const buildContext = useCallback(
    (item: PrayerPost, index: number) => {
      const postId = getPrayerPostId(item);
      if (!postId) {
        return null;
      }

      return {
        postId,
        postType: 'prayer',
        contentType: item.category || 'prayer',
        authorId: item.userData?._id,
        userId: currentUserId,
        surface: 'prayer_portal' as const,
        surfaceTab: 'list',
        entrypoint,
        requestId: requestIdRef.current,
        rankPosition: index,
        feedAlgorithm: 'prayer_wall',
        isOwnPost:
          Boolean(currentUserId) && Boolean(item.userData?._id)
            ? String(currentUserId) === String(item.userData?._id)
            : undefined,
        isRepost: false,
        privacyState: item.private ? 'private' : 'public',
      };
    },
    [currentUserId, entrypoint]
  );

  const trackPrayerTelemetry = useCallback(
    (
      item: PrayerPost,
      index: number,
      eventName: CanonicalPostTelemetryEventName,
      metadata?: Record<string, unknown>,
      overrides?: Partial<PostTelemetryEventInput>
    ) => {
      const context = buildContext(item, index);
      if (!context) {
        return;
      }

      trackPostTelemetry({
        ...context,
        ...overrides,
        eventName,
        metadata: {
          source: 'prayer_portal',
          ...(metadata ?? {}),
          ...(overrides?.metadata ?? {}),
        },
      });
    },
    [buildContext]
  );

  const finalizeVisibleRecord = useCallback(
    (postId: string, reason: string) => {
      const record = visiblePostsRef.current.get(postId);
      if (!record) {
        return;
      }
      visiblePostsRef.current.delete(postId);
      const visibleMs = Date.now() - record.startedAt;
      if (visibleMs < 1200) {
        return;
      }

      trackPrayerTelemetry(
        record.item,
        record.index,
        'post_dwell',
        { reason },
        { dwellMs: visibleMs }
      );
      const context = buildContext(record.item, record.index);
      if (!context) {
        return;
      }
      maybeTrackQualifiedPostView(context, visibleMs, {
        source: 'prayer_portal',
        reason,
      });
    },
    [buildContext, trackPrayerTelemetry]
  );

  const onViewableItemsChanged = useCallback(
    ({ changed, viewableItems }: { changed?: ViewToken[]; viewableItems: ViewToken[] }) => {
      const relevantTokens = changed ?? viewableItems;
      relevantTokens.forEach((token) => {
        const item = token.item as PrayerPost | undefined;
        const index = typeof token.index === 'number' ? token.index : 0;
        if (!item) {
          return;
        }

        const postId = getPrayerPostId(item);
        if (!postId) {
          return;
        }

        const impressionKey = `${requestIdRef.current}:${postId}`;
        if (token.isViewable) {
          if (!visiblePostsRef.current.has(postId)) {
            visiblePostsRef.current.set(postId, {
              item,
              index,
              startedAt: Date.now(),
            });
          }
          if (!impressionKeysRef.current.has(impressionKey)) {
            impressionKeysRef.current.add(impressionKey);
            trackPrayerTelemetry(item, index, 'post_impression');
          }
          return;
        }

        finalizeVisibleRecord(postId, 'view_end');
      });
    },
    [finalizeVisibleRecord, trackPrayerTelemetry]
  );

  const resetPrayerTelemetryRequest = useCallback(() => {
    Array.from(visiblePostsRef.current.keys()).forEach((postId) =>
      finalizeVisibleRecord(postId, 'refresh_reset')
    );
    requestIdRef.current = createPostTelemetryRequestId();
    impressionKeysRef.current.clear();
  }, [finalizeVisibleRecord]);

  const finalizeAllVisible = useCallback(
    (reason: string) => {
      Array.from(visiblePostsRef.current.keys()).forEach((postId) =>
        finalizeVisibleRecord(postId, reason)
      );
    },
    [finalizeVisibleRecord]
  );

  const viewabilityConfig = useMemo(
    () => ({
      minimumViewTime: 40,
      itemVisiblePercentThreshold: 55,
    }),
    []
  );

  return {
    trackPrayerTelemetry,
    onViewableItemsChanged,
    resetPrayerTelemetryRequest,
    finalizeAllVisible,
    viewabilityConfig,
  };
};
