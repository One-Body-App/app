import { emitNotificationRefresh } from './notificationRefreshSignal';
import { queueLocalNotificationItem } from './pushNotificationStorage';
import { nowUtcIso } from '@/src/utils/time';
import { buildNotificationPostDeepLink } from '@/src/screens/notifications/notificationLinking';

export type TaggedNotificationPayload = {
  notificationType: 'tagged';
  actorId: string;
  postId: string;
  postType: 'social' | 'watch' | 'comment';
  taggedUserIds: string[];
  commentId?: string;
};

const dedupeStringList = (values: string[]) =>
  Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)));

export const resolveNewTaggedUserIds = (
  previousUserIds: string[] = [],
  nextUserIds: string[] = []
) => {
  const previousSet = new Set(dedupeStringList(previousUserIds));
  return dedupeStringList(nextUserIds).filter((userId) => !previousSet.has(userId));
};

export const queueTaggedNotificationDemo = async (payload: TaggedNotificationPayload) => {
  const taggedUserIds = dedupeStringList(payload.taggedUserIds);
  if (!payload.postId || !payload.actorId || taggedUserIds.length < 1) {
    return null;
  }

  const notificationId = [
    'tagged',
    payload.postType,
    payload.postId,
    payload.commentId || 'root',
    Date.now().toString(),
  ].join(':');
  const createdAt = nowUtcIso();
  const url = buildNotificationPostDeepLink(
    payload.postType === 'comment' ? 'social' : payload.postType,
    payload.postId,
    payload.commentId
  );

  const queued = await queueLocalNotificationItem({
    id: notificationId,
    title: 'Tagged',
    body: 'You were tagged in a post.',
    type: payload.notificationType,
    url,
    createdAt,
    read: false,
    source: 'push',
    data: {
      actorId: payload.actorId,
      postId: payload.postId,
      postType: payload.postType,
      notificationType: payload.notificationType,
      taggedUserIds: JSON.stringify(taggedUserIds),
      ...(payload.commentId ? { commentId: payload.commentId } : undefined),
      createdAt,
    },
  });

  emitNotificationRefresh();
  return queued;
};
