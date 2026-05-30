export type TaggedNotificationPayload = {
  notificationType: 'tagged';
  actorId: string;
  postId: string;
  postType: 'social' | 'watch' | 'comment';
  taggedUserIds: string[];
  commentId?: string;
};

const dedupeStringList = (values: string[]) =>
  Array.from(
    new Set(
      values.flatMap((value) => {
        const trimmed = String(value || '').trim();
        return trimmed ? [trimmed] : [];
      })
    )
  );

export const resolveNewTaggedUserIds = (
  previousUserIds: string[] = [],
  nextUserIds: string[] = []
) => {
  const previousSet = new Set(dedupeStringList(previousUserIds));
  return dedupeStringList(nextUserIds).filter((userId) => !previousSet.has(userId));
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const queueTaggedNotificationDemo = async (payload: TaggedNotificationPayload) => {
  // Tag notifications are delivered by the backend so the authoring client
  // does not generate local demo notifications or duplicate server sends.
  return null;
};
