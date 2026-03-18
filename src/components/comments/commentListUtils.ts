import {
  CommentPost,
  SerializableCommentSnapshot,
  SocialPostReaction,
  SocialPostReactionType,
} from '@/utils/types';

export type CommentListFilter = 'relevant' | 'latest';

export type FlatCommentItem = {
  id: string;
  comment: CommentPost;
  parentCommentId?: string;
  parentAuthorName?: string;
  directReplyCount: number;
  createdAtMs: number;
  relevantScore: number;
};

type CommentTreeUpdateResult = {
  comments: CommentPost[];
  inserted: boolean;
};

export type CommentDeleteResult = {
  comments: CommentPost[];
  removedCount: number;
};

const HOUR_IN_MS = 1000 * 60 * 60;

export const getCommentId = (comment?: Partial<CommentPost> | null) => {
  const raw = comment?.commentId ?? comment?._id;
  return raw ? String(raw) : '';
};

export const getCommentReplies = (comment?: Partial<CommentPost> | null): CommentPost[] => {
  if (!comment) {
    return [];
  }
  const rawReplies = (comment as any)?.response ?? (comment as any)?.replies;
  return Array.isArray(rawReplies) ? (rawReplies as CommentPost[]) : [];
};

export const findCommentById = (
  nodes: CommentPost[],
  targetId: string
): CommentPost | undefined => {
  if (!targetId || !Array.isArray(nodes) || nodes.length < 1) {
    return undefined;
  }

  const directMatch = nodes.find((node) => getCommentId(node) === targetId);
  if (directMatch) {
    return directMatch;
  }

  let nestedMatch: CommentPost | undefined;
  nodes.some((node) => {
    const nested = getCommentReplies(node);
    if (nested.length < 1) {
      return false;
    }
    nestedMatch = findCommentById(nested, targetId);
    return Boolean(nestedMatch);
  });

  return nestedMatch;
};

const toSerializableDate = (value: unknown) => {
  if (!value) {
    return undefined;
  }

  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
};

export const toSerializableCommentSnapshot = (
  comment?: CommentPost | null
): SerializableCommentSnapshot | undefined => {
  if (!comment) {
    return undefined;
  }

  const createdAtIso = toSerializableDate(comment.created);
  const updatedAtIso = toSerializableDate(comment.updated);
  const commentDateIso = toSerializableDate(comment.date);
  const replies = getCommentReplies(comment)
    .map((reply) => toSerializableCommentSnapshot(reply))
    .filter((replySnapshot): replySnapshot is SerializableCommentSnapshot =>
      Boolean(replySnapshot)
    );

  return {
    _id: comment._id ? String(comment._id) : undefined,
    commentId: comment.commentId ? String(comment.commentId) : undefined,
    dateSeconds: Number.isFinite(comment.dateSeconds) ? Number(comment.dateSeconds) : undefined,
    date: commentDateIso ?? comment.date,
    objectId: comment.objectId ? String(comment.objectId) : undefined,
    objectType: comment.objectType ? String(comment.objectType) : undefined,
    content: comment.content,
    userData: comment.userData
      ? {
          _id: comment.userData._id ? String(comment.userData._id) : undefined,
          name: comment.userData.name,
          username: comment.userData.username,
          accountType: comment.userData.accountType,
          profileImage: comment.userData.profileImage,
          instagramHandler: comment.userData.instagramHandler,
          isApprovedInfluencer: comment.userData.isApprovedInfluencer,
        }
      : undefined,
    images: Array.isArray(comment.images) ? [...comment.images] : undefined,
    reactions: Array.isArray(comment.reactions) ? [...comment.reactions] : undefined,
    repostCount: typeof comment.repostCount === 'number' ? comment.repostCount : undefined,
    bookmarkCount: typeof comment.bookmarkCount === 'number' ? comment.bookmarkCount : undefined,
    bookmarkedByMe:
      typeof comment.bookmarkedByMe === 'boolean' ? comment.bookmarkedByMe : undefined,
    created: createdAtIso,
    updated: updatedAtIso,
    edited: Boolean(comment.edited),
    response: replies,
  } as SerializableCommentSnapshot;
};

export const fromSerializableCommentSnapshot = (
  snapshot?: SerializableCommentSnapshot | null
): CommentPost | undefined => {
  if (!snapshot) {
    return undefined;
  }

  const createdDate = toDateFromSource(snapshot.created, snapshot.date, new Date());
  const updatedDate = toDateFromSource(snapshot.updated, snapshot.created, createdDate);
  const fallbackId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const resolvedId =
    (snapshot.commentId ? String(snapshot.commentId) : undefined) ??
    (snapshot._id ? String(snapshot._id) : undefined) ??
    fallbackId;
  const dateIso = toSerializableDate(snapshot.date) ?? createdDate.toISOString();
  const normalizedReplies = Array.isArray(snapshot.response)
    ? snapshot.response
        .map((replySnapshot) => fromSerializableCommentSnapshot(replySnapshot))
        .filter((reply): reply is CommentPost => Boolean(reply))
    : [];

  return {
    _id: snapshot._id ? String(snapshot._id) : resolvedId,
    commentId: resolvedId,
    dateSeconds:
      typeof snapshot.dateSeconds === 'number'
        ? snapshot.dateSeconds
        : Math.ceil(createdDate.getTime() / 1000),
    date: dateIso,
    objectId: snapshot.objectId ? String(snapshot.objectId) : '',
    objectType: snapshot.objectType ? String(snapshot.objectType) : '',
    content: snapshot.content ?? '',
    userData: {
      _id: snapshot.userData?._id ? String(snapshot.userData._id) : undefined,
      name: snapshot.userData?.name ?? 'Unknown',
      username: snapshot.userData?.username,
      accountType: snapshot.userData?.accountType,
      profileImage: snapshot.userData?.profileImage,
      instagramHandler: snapshot.userData?.instagramHandler,
      isApprovedInfluencer: snapshot.userData?.isApprovedInfluencer,
    },
    images: Array.isArray(snapshot.images) ? [...snapshot.images] : undefined,
    videos: [],
    created: createdDate,
    updated: updatedDate,
    reactions: Array.isArray(snapshot.reactions) ? [...snapshot.reactions] : [],
    repostCount: typeof snapshot.repostCount === 'number' ? snapshot.repostCount : undefined,
    bookmarkCount: typeof snapshot.bookmarkCount === 'number' ? snapshot.bookmarkCount : undefined,
    bookmarkedByMe:
      typeof snapshot.bookmarkedByMe === 'boolean' ? snapshot.bookmarkedByMe : undefined,
    response: normalizedReplies,
    edited: Boolean(snapshot.edited),
  };
};

export const getParentCommentId = (comment?: Partial<CommentPost> | null) => {
  if (!comment) {
    return '';
  }
  const rawParentId =
    (comment as any)?.parentCommentId ??
    (comment as any)?.replyToCommentId ??
    (comment as any)?.parentId ??
    (comment as any)?.parent?._id ??
    (comment as any)?.parent?.commentId ??
    (typeof (comment as any)?.parent === 'string' ? (comment as any)?.parent : undefined);
  return rawParentId ? String(rawParentId) : '';
};

export const getCommentTimestampMs = (comment: Partial<CommentPost>) => {
  const createdValue =
    (comment as any)?.created ??
    (comment as any)?.createdAt ??
    (comment as any)?.updated ??
    (comment as any)?.updatedAt ??
    comment?.date;
  const parsed = createdValue ? new Date(createdValue).getTime() : Date.now();
  if (Number.isNaN(parsed)) {
    return Date.now();
  }
  return parsed;
};

export const toDateFromSource = (firstValue: unknown, secondValue: unknown, fallback: Date) => {
  const firstDate = firstValue ? new Date(String(firstValue)) : null;
  if (firstDate && !Number.isNaN(firstDate.getTime())) {
    return firstDate;
  }
  const secondDate = secondValue ? new Date(String(secondValue)) : null;
  if (secondDate && !Number.isNaN(secondDate.getTime())) {
    return secondDate;
  }
  return fallback;
};

export const countCommentsInTree = (nodes: CommentPost[]): number => {
  if (!Array.isArray(nodes) || nodes.length < 1) {
    return 0;
  }

  return nodes.reduce((total, node): number => {
    const replies = getCommentReplies(node);
    return total + 1 + countCommentsInTree(replies);
  }, 0);
};

const flattenCommentNodes = (nodes: CommentPost[]): CommentPost[] => {
  const flattened: CommentPost[] = [];
  const walk = (items: CommentPost[]) => {
    items.forEach((item) => {
      flattened.push(item);
      const replies = getCommentReplies(item);
      if (replies.length > 0) {
        walk(replies);
      }
    });
  };
  walk(nodes);
  return flattened;
};

export const normalizeCommentTreeFallback = (nodes: CommentPost[]): CommentPost[] => {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return [];
  }

  const flattened = flattenCommentNodes(nodes);
  const hasParentPointers = flattened.some((comment) => getParentCommentId(comment));
  if (!hasParentPointers) {
    return nodes;
  }

  const byId = new Map<string, CommentPost>();
  const ordered: CommentPost[] = [];
  const orphans: CommentPost[] = [];

  flattened.forEach((comment) => {
    const commentId = getCommentId(comment);
    const cloned: CommentPost = {
      ...comment,
      response: [],
    };

    if (!commentId) {
      orphans.push(cloned);
      return;
    }

    if (!byId.has(commentId)) {
      byId.set(commentId, cloned);
      ordered.push(cloned);
    }
  });

  const roots: CommentPost[] = [];
  ordered.forEach((comment) => {
    const commentId = getCommentId(comment);
    const parentId = getParentCommentId(comment);
    const parentComment = parentId ? byId.get(parentId) : undefined;

    if (parentComment && parentId !== commentId) {
      parentComment.response = [...(parentComment.response ?? []), comment];
      return;
    }

    roots.push(comment);
  });

  return [...roots, ...orphans];
};

export const updateCommentInTree = (
  nodes: CommentPost[],
  targetId: string,
  updater: (comment: CommentPost) => CommentPost
): CommentPost[] =>
  nodes.map((node) => {
    const nodeId = getCommentId(node);
    const hasReplies = Array.isArray(node.response);
    const nextReplies = hasReplies
      ? updateCommentInTree(node.response ?? [], targetId, updater)
      : undefined;

    if (nodeId === targetId) {
      const updated = updater(node);
      return {
        ...updated,
        response: nextReplies ?? [],
      };
    }

    if (hasReplies && nextReplies !== node.response) {
      return {
        ...node,
        response: nextReplies,
      };
    }

    return node;
  });

export const appendReplyToTree = (
  nodes: CommentPost[],
  targetId: string,
  reply: CommentPost
): CommentTreeUpdateResult => {
  let inserted = false;

  const comments = nodes.map((node) => {
    const nodeId = getCommentId(node);
    const currentReplies = Array.isArray(node.response) ? node.response : [];

    if (nodeId === targetId) {
      inserted = true;
      return {
        ...node,
        response: [...currentReplies, reply],
      };
    }

    if (currentReplies.length > 0) {
      const nested = appendReplyToTree(currentReplies, targetId, reply);
      if (nested.inserted) {
        inserted = true;
        return {
          ...node,
          response: nested.comments,
        };
      }
    }

    return node;
  });

  return {
    comments,
    inserted,
  };
};

export const removeCommentFromTree = (
  nodes: CommentPost[],
  targetId: string
): CommentDeleteResult => {
  let removedCount = 0;

  const comments = nodes
    .map((node) => {
      const nodeId = getCommentId(node);
      if (nodeId === targetId) {
        removedCount += countCommentsInTree([node]);
        return null;
      }

      const currentReplies = Array.isArray(node.response) ? node.response : [];
      if (currentReplies.length < 1) {
        return node;
      }

      const nested = removeCommentFromTree(currentReplies, targetId);
      if (nested.removedCount < 1) {
        return node;
      }

      removedCount += nested.removedCount;
      return {
        ...node,
        response: nested.comments,
      };
    })
    .filter(Boolean) as CommentPost[];

  return {
    comments,
    removedCount,
  };
};

const buildRelevantScore = (comment: CommentPost, directReplyCount: number, nowMs: number) => {
  const reactionCount = comment.reactions?.length ?? 0;
  const ageHours = Math.max(0, (nowMs - getCommentTimestampMs(comment)) / HOUR_IN_MS);
  const recencyBoost = Math.max(0, 72 - ageHours);
  return reactionCount * 10 + directReplyCount * 4 + recencyBoost;
};

export const flattenCommentsForList = (
  nodes: CommentPost[],
  nowMs = Date.now()
): FlatCommentItem[] => {
  return nodes.map((comment, index) => {
    const commentId = getCommentId(comment) || `comment_${index}`;
    const replies = getCommentReplies(comment);
    const createdAtMs = getCommentTimestampMs(comment);

    return {
      id: commentId,
      comment,
      directReplyCount: replies.length,
      createdAtMs,
      relevantScore: buildRelevantScore(comment, replies.length, nowMs),
    };
  });
};

export const sortFlatComments = (items: FlatCommentItem[], filter: CommentListFilter) => {
  const sorted = [...items];

  if (filter === 'latest') {
    sorted.sort((left, right) => {
      if (right.createdAtMs !== left.createdAtMs) {
        return right.createdAtMs - left.createdAtMs;
      }
      return right.id.localeCompare(left.id);
    });
    return sorted;
  }

  sorted.sort((left, right) => {
    if (right.relevantScore !== left.relevantScore) {
      return right.relevantScore - left.relevantScore;
    }
    if (right.createdAtMs !== left.createdAtMs) {
      return right.createdAtMs - left.createdAtMs;
    }
    return right.id.localeCompare(left.id);
  });

  return sorted;
};

export const applyOptimisticReaction = (
  nodes: CommentPost[],
  commentId: string,
  userId: string,
  reactionType?: SocialPostReactionType
) =>
  updateCommentInTree(nodes, commentId, (comment) => {
    const filtered = (comment.reactions ?? []).filter((reaction) => reaction.userId !== userId);
    const nextReactions: SocialPostReaction[] = reactionType
      ? [
          ...filtered,
          {
            type: reactionType,
            userId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]
      : filtered;

    return {
      ...comment,
      reactions: nextReactions,
    };
  });
