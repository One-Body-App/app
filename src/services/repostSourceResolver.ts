import { ApiCall } from '@/services/api';
import type { SocialPost } from '@/utils/types';

export type RepostMeta = NonNullable<SocialPost['repost']>;

export type ResolvedRepostSourceSnapshot = {
  sourceType: RepostMeta['sourceType'];
  sourceId: string;
  sourceAuthorId?: string;
  sourceAuthorName?: string;
  sourceAuthorUsername?: string;
  sourceAuthorProfileImage?: string;
  sourceCreatedAt?: string;
  sourceTitle?: string;
  sourceDescription?: string;
  sourceContent?: string;
  sourceContentSnippet?: string;
  sourceLink?: string;
  sourceImage?: string;
  sourceImages: string[];
  sourceVideos: string[];
  sourceGif?: SocialPost['gif'];
  sourceCategory?: string;
  sourceMediaUrl?: string;
  sourceMediaType?: string;
  sourceTags?: string[];
  repostType: RepostMeta['repostType'];
  createdFromIndexId?: string;
};

const snapshotCache = new Map<string, ResolvedRepostSourceSnapshot>();
const inFlightSnapshotRequests = new Map<string, Promise<ResolvedRepostSourceSnapshot | null>>();

const toNonEmptyString = (value: unknown) => {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
};

const toObjectIdString = (value: unknown) => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  if (
    value &&
    typeof value === 'object' &&
    typeof (value as { toString?: () => string }).toString === 'function'
  ) {
    const stringValue = (value as { toString: () => string }).toString();
    if (typeof stringValue === 'string' && stringValue.trim().length > 0) {
      return stringValue.trim();
    }
  }

  return '';
};

const toIsoDateString = (value: unknown) => {
  if (!value) {
    return '';
  }

  const parsedDate = new Date(value as any);
  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  return parsedDate.toISOString();
};

const toStringArray = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const resolveTitle = (value: unknown) => {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (
    value &&
    typeof value === 'object' &&
    typeof (value as { a?: { $text?: string } }).a?.$text === 'string'
  ) {
    return (value as { a: { $text: string } }).a.$text.trim();
  }

  return '';
};

const toStringList = (value: unknown) => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const list = value
    .map((item) => {
      if (typeof item === 'string') {
        return item.trim();
      }
      if (
        item &&
        typeof item === 'object' &&
        typeof (item as { name?: unknown }).name === 'string'
      ) {
        return String((item as { name: string }).name).trim();
      }
      return '';
    })
    .filter((item) => item.length > 0);

  return list.length > 0 ? list : undefined;
};

const clipText = (value: string, maxLength: number) => {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1).trimEnd()}...`;
};

const ensureUnique = (values: string[]) => Array.from(new Set(values));

const buildSnapshotFromSource = (
  sourceType: RepostMeta['sourceType'],
  sourceId: string,
  repostType: RepostMeta['repostType'],
  source: Record<string, unknown>,
  createdFromIndexId?: string
): ResolvedRepostSourceSnapshot => {
  const sourceAuthorId = toObjectIdString(
    (source.userData as { _id?: unknown } | undefined)?._id ??
      (source.user as { _id?: unknown } | undefined)?._id ??
      source.user
  );
  const sourceAuthorName = toNonEmptyString(
    (source.userData as { name?: unknown } | undefined)?.name ??
      (source.user as { name?: unknown } | undefined)?.name ??
      source.handler
  );
  const sourceAuthorUsername = toNonEmptyString(
    (source.userData as { username?: unknown } | undefined)?.username ??
      (source.user as { username?: unknown } | undefined)?.username ??
      source.username ??
      source.handler
  );
  const sourceAuthorProfileImage = toNonEmptyString(
    (
      source.userData as
        | { profileImage?: unknown; profile_image?: unknown; avatar?: unknown }
        | undefined
    )?.profileImage ??
      (
        source.userData as
          | { profileImage?: unknown; profile_image?: unknown; avatar?: unknown }
          | undefined
      )?.profile_image ??
      (
        source.userData as
          | { profileImage?: unknown; profile_image?: unknown; avatar?: unknown }
          | undefined
      )?.avatar ??
      (
        source.user as
          | { profileImage?: unknown; profile_image?: unknown; avatar?: unknown }
          | undefined
      )?.profileImage ??
      (
        source.user as
          | { profileImage?: unknown; profile_image?: unknown; avatar?: unknown }
          | undefined
      )?.profile_image ??
      (
        source.user as
          | { profileImage?: unknown; profile_image?: unknown; avatar?: unknown }
          | undefined
      )?.avatar
  );
  const sourceCreatedAt = toIsoDateString(source.created ?? source.createdAt ?? source.date);
  const sourceTitle =
    resolveTitle(source.title) ||
    toNonEmptyString(source.linkTitle) ||
    toNonEmptyString(source.headline);
  const sourceDescription =
    toNonEmptyString(source.description) ||
    toNonEmptyString(source.summary) ||
    toNonEmptyString(source.excerpt) ||
    toNonEmptyString(source.subtitle);
  const sourceContent =
    toNonEmptyString(source.content) ||
    toNonEmptyString(source.body) ||
    toNonEmptyString(source.caption) ||
    toNonEmptyString((source.testimony as { content?: unknown } | undefined)?.content);
  const sourceLink = toNonEmptyString(source.link ?? source.permalink);
  const sourceCategory = toNonEmptyString(source.category ?? source.prayerCategory);
  const sourceMediaUrl =
    toNonEmptyString(source.mediaUrl) ||
    toNonEmptyString((source.image as { url?: unknown } | undefined)?.url) ||
    toNonEmptyString(
      (source.attachments as Array<{ image?: { url?: unknown }; url?: unknown }> | undefined)?.[0]
        ?.image?.url
    ) ||
    toNonEmptyString(
      (source.attachments as Array<{ image?: { url?: unknown }; url?: unknown }> | undefined)?.[0]
        ?.url
    );
  const sourceMediaType =
    toNonEmptyString(source.mediaType) ||
    toNonEmptyString((source.attachments as Array<{ type?: unknown }> | undefined)?.[0]?.type);

  const sourceImages = ensureUnique([
    ...toStringArray(source.images),
    toNonEmptyString((source.image as { url?: unknown } | undefined)?.url),
    sourceMediaType.startsWith('video') ? '' : sourceMediaUrl,
  ]).filter((value) => value.length > 0);

  const sourceVideos = ensureUnique([
    ...toStringArray(source.videos),
    sourceMediaType.startsWith('video') ? sourceMediaUrl : '',
  ]).filter((value) => value.length > 0);

  const sourceGif =
    source.gif && typeof source.gif === 'object' ? (source.gif as SocialPost['gif']) : undefined;

  const sourceContentSnippet = clipText(sourceContent || sourceTitle, 220);
  const sourceImage = sourceImages[0] || sourceMediaUrl || '';
  const sourceTags = toStringList(source.tags);

  return {
    sourceType,
    sourceId,
    sourceAuthorId: sourceAuthorId || undefined,
    sourceAuthorName: sourceAuthorName || undefined,
    sourceAuthorUsername: sourceAuthorUsername || undefined,
    sourceAuthorProfileImage: sourceAuthorProfileImage || undefined,
    sourceCreatedAt: sourceCreatedAt || undefined,
    sourceTitle: sourceTitle || undefined,
    sourceDescription: sourceDescription || undefined,
    sourceContent: sourceContent || undefined,
    sourceContentSnippet: sourceContentSnippet || undefined,
    sourceLink: sourceLink || undefined,
    sourceImage: sourceImage || undefined,
    sourceImages,
    sourceVideos,
    sourceGif,
    sourceCategory: sourceCategory || undefined,
    sourceMediaUrl: sourceMediaUrl || undefined,
    sourceMediaType: sourceMediaType || undefined,
    sourceTags,
    repostType,
    createdFromIndexId,
  };
};

const mergeSnapshots = (
  baseSnapshot: ResolvedRepostSourceSnapshot,
  resolvedSnapshot?: ResolvedRepostSourceSnapshot | null
): ResolvedRepostSourceSnapshot => {
  if (!resolvedSnapshot) {
    return baseSnapshot;
  }

  return {
    ...baseSnapshot,
    ...resolvedSnapshot,
    sourceImages:
      resolvedSnapshot.sourceImages.length > 0
        ? resolvedSnapshot.sourceImages
        : baseSnapshot.sourceImages,
    sourceVideos:
      resolvedSnapshot.sourceVideos.length > 0
        ? resolvedSnapshot.sourceVideos
        : baseSnapshot.sourceVideos,
    sourceTags:
      resolvedSnapshot.sourceTags && resolvedSnapshot.sourceTags.length > 0
        ? resolvedSnapshot.sourceTags
        : baseSnapshot.sourceTags,
  };
};

export const buildRepostSourceSnapshot = (
  repost?: SocialPost['repost']
): ResolvedRepostSourceSnapshot | null => {
  if (!repost?.sourceId || !repost.sourceType || !repost.repostType) {
    return null;
  }

  return {
    sourceType: repost.sourceType,
    sourceId: toObjectIdString(repost.sourceId) || repost.sourceId,
    sourceAuthorId: toObjectIdString(repost.sourceAuthorId) || undefined,
    sourceAuthorName: toNonEmptyString(repost.sourceAuthorName) || undefined,
    sourceAuthorUsername: toNonEmptyString(repost.sourceAuthorUsername) || undefined,
    sourceAuthorProfileImage: toNonEmptyString(repost.sourceAuthorProfileImage) || undefined,
    sourceCreatedAt: toIsoDateString(repost.sourceCreatedAt) || undefined,
    sourceTitle: toNonEmptyString(repost.sourceTitle) || undefined,
    sourceDescription: toNonEmptyString(repost.sourceDescription) || undefined,
    sourceContent: toNonEmptyString(repost.sourceContent) || undefined,
    sourceContentSnippet: toNonEmptyString(repost.sourceContentSnippet) || undefined,
    sourceLink: toNonEmptyString(repost.sourceLink) || undefined,
    sourceImage: toNonEmptyString(repost.sourceImage) || undefined,
    sourceImages: toStringArray(repost.sourceImages),
    sourceVideos: toStringArray(repost.sourceVideos),
    sourceGif:
      repost.sourceGif && typeof repost.sourceGif === 'object' ? repost.sourceGif : undefined,
    sourceCategory: toNonEmptyString(repost.sourceCategory) || undefined,
    sourceMediaUrl: toNonEmptyString(repost.sourceMediaUrl) || undefined,
    sourceMediaType: toNonEmptyString(repost.sourceMediaType) || undefined,
    sourceTags: toStringList(repost.sourceTags),
    repostType: repost.repostType,
    createdFromIndexId: toNonEmptyString(repost.createdFromIndexId) || undefined,
  };
};

export const isRepostSourceSnapshotMissing = (repost?: SocialPost['repost']): boolean => {
  const snapshot = buildRepostSourceSnapshot(repost);
  if (!snapshot) {
    return false;
  }

  const hasHeader = Boolean(
    snapshot.sourceAuthorName && snapshot.sourceAuthorUsername && snapshot.sourceCreatedAt
  );

  const hasBody = Boolean(
    snapshot.sourceContent ||
      snapshot.sourceContentSnippet ||
      snapshot.sourceTitle ||
      snapshot.sourceDescription ||
      snapshot.sourceLink ||
      snapshot.sourceImage ||
      snapshot.sourceMediaUrl ||
      snapshot.sourceImages.length > 0 ||
      snapshot.sourceVideos.length > 0 ||
      snapshot.sourceGif
  );

  return !hasHeader || !hasBody;
};

const normalizeSourceRouteId = (sourceType: RepostMeta['sourceType'], sourceId: string) => {
  const normalized = sourceId.replace(/^onebody_/, '').trim();
  if (sourceType === 'rss') {
    return sourceId.trim();
  }
  return normalized || sourceId.trim();
};

const getRouteForSource = (sourceType: RepostMeta['sourceType'], sourceId: string) => {
  const normalizedSourceId = normalizeSourceRouteId(sourceType, sourceId);

  switch (sourceType) {
    case 'prayer':
      return `prayer/${normalizedSourceId}`;
    case 'rss':
      return `rss/${normalizedSourceId}`;
    case 'social':
    default:
      return `social/post/${normalizedSourceId}`;
  }
};

export const resolveRepostSourceSnapshot = async (
  repost?: SocialPost['repost'],
  token?: string | boolean
): Promise<ResolvedRepostSourceSnapshot | null> => {
  const baseSnapshot = buildRepostSourceSnapshot(repost);
  if (!baseSnapshot) {
    return null;
  }

  const cacheKey = `${baseSnapshot.sourceType}:${baseSnapshot.sourceId}`;
  if (!isRepostSourceSnapshotMissing(repost)) {
    snapshotCache.set(cacheKey, baseSnapshot);
    return baseSnapshot;
  }

  const cachedSnapshot = snapshotCache.get(cacheKey);
  if (cachedSnapshot) {
    return mergeSnapshots(baseSnapshot, cachedSnapshot);
  }

  const existingRequest = inFlightSnapshotRequests.get(cacheKey);
  if (existingRequest) {
    const inFlightSnapshot = await existingRequest;
    return mergeSnapshots(baseSnapshot, inFlightSnapshot);
  }

  const fetchPromise = (async () => {
    const route = getRouteForSource(baseSnapshot.sourceType, baseSnapshot.sourceId);
    const response = await ApiCall<Record<string, unknown>>({
      route,
      verb: 'get',
      token: token ?? true,
    });

    if (response.status !== 200 || !response.response) {
      return null;
    }

    const source = response.response as Record<string, unknown>;
    const normalizedSourceId =
      toObjectIdString(source.postId ?? source.id ?? source._id) || baseSnapshot.sourceId;

    const resolvedSnapshot = buildSnapshotFromSource(
      baseSnapshot.sourceType,
      normalizedSourceId,
      baseSnapshot.repostType,
      source,
      baseSnapshot.createdFromIndexId
    );

    return mergeSnapshots(baseSnapshot, resolvedSnapshot);
  })();

  inFlightSnapshotRequests.set(cacheKey, fetchPromise);

  try {
    const resolvedSnapshot = await fetchPromise;
    if (resolvedSnapshot) {
      snapshotCache.set(cacheKey, resolvedSnapshot);
      return mergeSnapshots(baseSnapshot, resolvedSnapshot);
    }
    return baseSnapshot;
  } catch {
    return baseSnapshot;
  } finally {
    inFlightSnapshotRequests.delete(cacheKey);
  }
};

export const clearRepostSourceResolverCache = () => {
  snapshotCache.clear();
  inFlightSnapshotRequests.clear();
};
