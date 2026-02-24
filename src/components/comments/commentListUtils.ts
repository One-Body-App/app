import { CommentPost, SocialPostReaction, SocialPostReactionType } from '@/utils/types';

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
  const items: FlatCommentItem[] = [];

  const walk = (
    comments: CommentPost[],
    parentMeta?: {
      id: string;
      name?: string;
    }
  ) => {
    comments.forEach((comment, index) => {
      const commentId = getCommentId(comment) || `comment_${index}_${items.length}`;
      const replies = getCommentReplies(comment);
      const createdAtMs = getCommentTimestampMs(comment);

      items.push({
        id: commentId,
        comment,
        parentCommentId: parentMeta?.id,
        parentAuthorName: parentMeta?.name,
        directReplyCount: replies.length,
        createdAtMs,
        relevantScore: buildRelevantScore(comment, replies.length, nowMs),
      });

      if (replies.length > 0) {
        walk(replies, {
          id: commentId,
          name: comment.userData?.username || comment.userData?.name,
        });
      }
    });
  };

  walk(nodes);
  return items;
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
