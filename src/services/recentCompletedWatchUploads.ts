import type { PendingVideoUpload } from '@/src/services/videoProcessing/types';
import { AccountType, type User, type WatchPost } from '@/utils/types';

export type RecentCompletedWatchUpload = {
  itemId: string;
  ownerUserId?: string;
  watchId?: string;
  playBackId: string;
  content: string;
  videoWidth?: number;
  videoHeight?: number;
  aspectRatio?: number;
  createdAt: string;
  updatedAt: string;
};

type RecentCompletedWatchUploadListener = (uploads: RecentCompletedWatchUpload[]) => void;

const MAX_RECENT_COMPLETED_WATCH_UPLOADS = 20;

let recentCompletedWatchUploads: RecentCompletedWatchUpload[] = [];
const listeners = new Set<RecentCompletedWatchUploadListener>();

const notifyListeners = () => {
  const snapshot = [...recentCompletedWatchUploads];
  listeners.forEach((listener) => {
    listener(snapshot);
  });
};

export const getRecentCompletedWatchUploadsSnapshot = () => [...recentCompletedWatchUploads];

export const clearRecentCompletedWatchUploadsForTests = () => {
  recentCompletedWatchUploads = [];
  notifyListeners();
};

export const subscribeRecentCompletedWatchUploads = (
  listener: RecentCompletedWatchUploadListener
) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const publishRecentCompletedWatchUpload = (upload: RecentCompletedWatchUpload) => {
  const deduped = recentCompletedWatchUploads.filter(
    (existing) =>
      existing.playBackId !== upload.playBackId &&
      existing.watchId !== upload.watchId &&
      existing.itemId !== upload.itemId
  );

  recentCompletedWatchUploads = [upload, ...deduped].slice(0, MAX_RECENT_COMPLETED_WATCH_UPLOADS);
  notifyListeners();
};

export const buildRecentCompletedWatchUpload = ({
  item,
  playBackId,
  ownerUserId,
}: {
  item: PendingVideoUpload;
  playBackId?: string;
  ownerUserId?: string;
}): RecentCompletedWatchUpload | null => {
  const normalizedPlaybackId = String(playBackId ?? '').trim();
  if (!normalizedPlaybackId) {
    return null;
  }

  const width = Number.isFinite(item.processedWidth) ? Number(item.processedWidth) : undefined;
  const height = Number.isFinite(item.processedHeight) ? Number(item.processedHeight) : undefined;
  const aspectRatio = width && height && width > 0 && height > 0 ? width / height : undefined;

  return {
    itemId: item.id,
    ownerUserId,
    watchId: item.watchId,
    playBackId: normalizedPlaybackId,
    content: item.recipe.caption,
    videoWidth: width,
    videoHeight: height,
    aspectRatio,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

const toComparableTimestamp = (value?: Date | string) => {
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = new Date(value).getTime();
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return 0;
};

const createSyntheticWatchPost = ({
  upload,
  user,
}: {
  upload: RecentCompletedWatchUpload;
  user: User;
}): WatchPost => {
  const syntheticId = upload.watchId || upload.itemId;

  return {
    _id: syntheticId,
    id: syntheticId,
    postId: syntheticId,
    playBackId: upload.playBackId,
    aspectRatio: upload.aspectRatio,
    videoWidth: upload.videoWidth,
    videoHeight: upload.videoHeight,
    content: upload.content,
    date: upload.createdAt,
    handler: user.username,
    link: '',
    title: '',
    mediaUrl: `https://stream.mux.com/${upload.playBackId}.m3u8`,
    comments: [],
    commentNumber: 0,
    userData: {
      _id: user._id,
      name: user.name,
      username: user.username,
      accountType: user.accountType ?? AccountType.individual,
      profileImage: user.profileImage || '',
      instagramHandler: user.influencerProfile?.instagramHandler,
      isApprovedInfluencer: user.influencerProfile?.influencerStatus === 'approved',
    },
    created: new Date(upload.createdAt),
    updated: new Date(upload.updatedAt),
    reactions: [],
  };
};

export const mergeRecentCompletedWatchUploads = ({
  posts,
  recentUploads,
  user,
}: {
  posts: WatchPost[];
  recentUploads: RecentCompletedWatchUpload[];
  user?: User | null;
}) => {
  if (!user) {
    return posts;
  }

  const knownIds = new Set<string>();
  const knownPlaybackIds = new Set<string>();

  posts.forEach((post) => {
    const postId = post.postId ?? post.id ?? post._id;
    if (postId) {
      knownIds.add(String(postId));
    }
    if (post.playBackId) {
      knownPlaybackIds.add(String(post.playBackId));
    }
  });

  const optimisticPosts = recentUploads
    .filter((upload) => upload.ownerUserId === user._id)
    .filter((upload) => !knownPlaybackIds.has(upload.playBackId))
    .filter((upload) => !upload.watchId || !knownIds.has(upload.watchId))
    .map((upload) => createSyntheticWatchPost({ upload, user }));

  if (!optimisticPosts.length) {
    return posts;
  }

  return [...optimisticPosts, ...posts].sort(
    (left, right) => toComparableTimestamp(right.created) - toComparableTimestamp(left.created)
  );
};
