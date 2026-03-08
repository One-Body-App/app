import { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import FastImage from 'react-native-fast-image';
import { NO_PROFILE_IMAGE } from '@/services/constants';
import {
  FlatCommentItem,
  getCommentReplies,
  getCommentTimestampMs,
} from '@/components/comments/commentListUtils';
import { CommentPost, SocialPostReaction } from '@/utils/types';
import { timeSince } from '@/utils/ResponsiveFun';
import { COLORS, styles } from './commentstyles';

type WatchCommentRowProps = {
  item: FlatCommentItem;
  currentUserId?: string;
  isReacting: boolean;
  onToggleReaction: (commentId: string, hasReaction: boolean) => void;
  onReply: (comment: CommentPost) => void;
  onLongPress?: (comment: CommentPost) => void;
};

function WatchCommentRow({
  item,
  currentUserId,
  isReacting,
  onToggleReaction,
  onReply,
  onLongPress,
}: WatchCommentRowProps) {
  const { comment } = item;
  const commentId = item.id;
  const replies = getCommentReplies(comment);
  const previewReply = replies[0];
  const myReaction = (comment.reactions ?? []).find(
    (reaction: SocialPostReaction) => reaction.userId === currentUserId
  );
  const reactionCount = comment.reactions?.length ?? 0;
  const profileImage =
    comment.userData?.profileImage && comment.userData.profileImage !== ''
      ? comment.userData.profileImage
      : NO_PROFILE_IMAGE;

  const content = (
    <>
      <FastImage source={{ uri: profileImage }} style={styles.commentAvatar} resizeMode="cover" />

      <View style={styles.commentBody}>
        <View style={styles.commentHeaderRow}>
          <Text numberOfLines={1} style={styles.commentAuthor}>
            {comment.userData?.name ?? 'Unknown'}
          </Text>
          <Text style={styles.commentTime}>
            {timeSince(new Date(getCommentTimestampMs(comment)))}
          </Text>
        </View>

        <Text style={styles.commentContent}>{comment.content}</Text>

        {previewReply ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              onReply(comment);
            }}
            style={styles.replyPreview}
          >
            <Text numberOfLines={1} style={styles.replyPreviewAuthor}>
              {previewReply.userData?.name ?? 'Unknown'}
            </Text>
            <Text numberOfLines={2} style={styles.replyPreviewText}>
              {previewReply.content}
            </Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.commentActionsRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={isReacting}
            onPress={() => {
              onToggleReaction(commentId, Boolean(myReaction));
            }}
            style={styles.commentActionButton}
          >
            <MaterialCommunityIcons
              color={myReaction ? COLORS.primary : COLORS.slate400}
              name={myReaction ? 'heart' : 'heart-outline'}
              size={20}
            />
            <Text
              style={[styles.commentActionText, myReaction ? styles.commentActionTextActive : null]}
            >
              {reactionCount}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              onReply(comment);
            }}
            style={styles.replyButton}
          >
            <Text style={styles.replyButtonText}>Reply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  if (onLongPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.92}
        delayLongPress={220}
        onLongPress={() => {
          onLongPress(comment);
        }}
        style={styles.commentRow}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.commentRow}>{content}</View>;
}

export default memo(WatchCommentRow);
