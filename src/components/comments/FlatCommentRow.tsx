import { memo } from 'react';
import { Image, Platform, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import FastImage from 'react-native-fast-image';
import { GiphyMedia, GiphyMediaView } from '@giphy/react-native-sdk';
import RepeatIcon from '@/assets/icons/repeat.svg';
import SendIcon from '@/assets/icons/send.svg';
import { NO_PROFILE_IMAGE } from '@/services/constants';
import { timeSince } from '@/utils/ResponsiveFun';
import { CommentPost, SocialPostReaction, SocialPostReactionType } from '@/utils/types';
import ParsedText from '@/components/mentions/ParsedText';
import { FlatCommentItem, getCommentTimestampMs } from './commentListUtils';
import flatStyles from './flatStyles';

type ReactionPickerItem = {
  id: string;
  iconUrl: string;
  type: SocialPostReactionType;
};

const TWEMOJI_BASE = 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@14.0.2/assets/72x72';
const REACTION_PICKER_ITEMS: ReactionPickerItem[] = [
  { id: 'pray', iconUrl: `${TWEMOJI_BASE}/1f64f.png`, type: SocialPostReactionType.praying },
  { id: 'praise', iconUrl: `${TWEMOJI_BASE}/1f64c.png`, type: SocialPostReactionType.praise },
  { id: 'like', iconUrl: `${TWEMOJI_BASE}/1f44d.png`, type: SocialPostReactionType.like },
  { id: 'love', iconUrl: `${TWEMOJI_BASE}/2764.png`, type: SocialPostReactionType.love },
  { id: 'haha', iconUrl: `${TWEMOJI_BASE}/1f602.png`, type: SocialPostReactionType.haha },
  { id: 'wow', iconUrl: `${TWEMOJI_BASE}/1f632.png`, type: SocialPostReactionType.wow },
  { id: 'sad', iconUrl: `${TWEMOJI_BASE}/1f622.png`, type: SocialPostReactionType.sad },
  { id: 'angry', iconUrl: `${TWEMOJI_BASE}/1f621.png`, type: SocialPostReactionType.angry },
];

const extractGifPreviewUrl = (media?: GiphyMedia | null): string | undefined => {
  if (!media || typeof media !== 'object') {
    return undefined;
  }

  const mediaRecord = media as unknown as Record<string, unknown>;
  const directUrl = mediaRecord.url;
  if (typeof directUrl === 'string' && directUrl.startsWith('http')) {
    return directUrl;
  }

  const images = mediaRecord.images as Record<string, unknown> | undefined;
  if (!images || typeof images !== 'object') {
    return undefined;
  }

  const renditionKeys = [
    'original',
    'fixed_width',
    'fixed_height',
    'downsized',
    'preview_gif',
    'fixed_width_small',
  ];

  const matchedKey = renditionKeys.find((renditionKey) => {
    const rendition = images[renditionKey] as Record<string, unknown> | undefined;
    const renditionUrl = rendition?.url;
    return typeof renditionUrl === 'string' && renditionUrl.startsWith('http');
  });

  if (!matchedKey) {
    return undefined;
  }

  const matchedRendition = images[matchedKey] as Record<string, unknown> | undefined;
  const matchedUrl = matchedRendition?.url;
  return typeof matchedUrl === 'string' ? matchedUrl : undefined;
};

const toHandle = (comment: CommentPost) => {
  const rawHandle = comment.userData?.username ?? comment.userData?.name ?? '';
  if (!rawHandle) {
    return '@unknown';
  }
  if (rawHandle.startsWith('@')) {
    return rawHandle;
  }
  return `@${rawHandle.replace(/\s+/g, '').toLowerCase()}`;
};

type FlatCommentRowProps = {
  item: FlatCommentItem;
  currentUserId?: string;
  isReacting: boolean;
  isReactionPickerVisible: boolean;
  allowMedia: boolean;
  backgroundColor: string;
  borderColor: string;
  primaryTextColor: string;
  secondaryTextColor: string;
  accentColor: string;
  mutedColor: string;
  onToggleReaction: (commentId: string, hasReaction: boolean) => void;
  onPressRepost?: (comment: CommentPost) => void;
  onSharePress?: (comment: CommentPost) => void;
  onToggleBookmark?: (commentId: string, isBookmarked: boolean) => void;
  onShowReactionPicker: (commentId: string) => void;
  onSelectReaction: (commentId: string, reactionType: SocialPostReactionType) => void;
  isReposting?: boolean;
  isBookmarking?: boolean;
  onActionsPress?: (comment: CommentPost) => void;
  onUserPress?: (userId: string) => void;
  onOpenThread?: (comment: CommentPost) => void;
};

function FlatCommentRow({
  item,
  currentUserId,
  isReacting,
  isReactionPickerVisible,
  allowMedia,
  backgroundColor,
  borderColor,
  primaryTextColor,
  secondaryTextColor,
  accentColor,
  mutedColor,
  onToggleReaction,
  onPressRepost,
  onSharePress,
  onToggleBookmark,
  onShowReactionPicker,
  onSelectReaction,
  isReposting,
  isBookmarking,
  onActionsPress,
  onUserPress,
  onOpenThread,
}: FlatCommentRowProps) {
  const { comment } = item;
  const commentId = item.id;
  const myReaction = (comment.reactions ?? []).find(
    (reaction: SocialPostReaction) => reaction.userId === currentUserId
  );
  const isOwnComment = Boolean(comment.userData?._id && comment.userData._id === currentUserId);
  const reactionCount = comment.reactions?.length ?? 0;
  const repostCount = Number(comment.repostCount ?? 0);
  const isBookmarked = Boolean(comment.bookmarkedByMe);
  const profileImage =
    comment.userData?.profileImage && comment.userData.profileImage !== ''
      ? comment.userData.profileImage
      : NO_PROFILE_IMAGE;

  const gifAspectRatioRaw = comment.gif?.aspectRatio;
  const gifAspectRatio = Number(gifAspectRatioRaw);
  const safeGifAspectRatio =
    Number.isFinite(gifAspectRatio) && gifAspectRatio > 0 ? gifAspectRatio : 1;
  const gifPreviewUrl = extractGifPreviewUrl(comment.gif);

  return (
    <View style={[flatStyles.commentRow, { backgroundColor, borderBottomColor: borderColor }]}>
      <TouchableOpacity
        disabled={!onUserPress || !comment.userData?._id}
        onPress={() => {
          if (onUserPress && comment.userData?._id) {
            onUserPress(comment.userData._id);
          }
        }}
      >
        <FastImage source={{ uri: profileImage }} style={flatStyles.avatar} resizeMode="cover" />
      </TouchableOpacity>

      <View style={flatStyles.commentBody}>
        <TouchableOpacity
          activeOpacity={onOpenThread ? 0.85 : 1}
          disabled={!onOpenThread}
          onPress={() => {
            onOpenThread?.(comment);
          }}
        >
          <View style={flatStyles.headerRow}>
            <View style={flatStyles.headerMeta}>
              <Text style={[flatStyles.authorName, { color: primaryTextColor }]} numberOfLines={1}>
                {comment.userData?.name ?? 'Unknown'}
              </Text>
              <View style={flatStyles.authorMetaRow}>
                <Text
                  style={[flatStyles.authorHandle, { color: secondaryTextColor }]}
                  numberOfLines={1}
                >
                  {toHandle(comment)}
                </Text>
                <Text style={[flatStyles.dot, { color: secondaryTextColor }]}>·</Text>
                <Text style={[flatStyles.time, { color: secondaryTextColor }]} numberOfLines={1}>
                  {timeSince(new Date(getCommentTimestampMs(comment)))}
                </Text>
              </View>
            </View>

            {isOwnComment && onActionsPress ? (
              <TouchableOpacity
                onPress={(event) => {
                  event.stopPropagation();
                  onActionsPress(comment);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons
                  name="dots-horizontal"
                  size={18}
                  color={secondaryTextColor}
                />
              </TouchableOpacity>
            ) : null}
          </View>

          {item.parentAuthorName ? (
            <Text style={[flatStyles.replyContext, { color: accentColor }]} numberOfLines={1}>
              Replying to @{item.parentAuthorName.replace(/\s+/g, '').toLowerCase()}
            </Text>
          ) : null}

          <ParsedText
            text={comment.content}
            textStyle={[flatStyles.contentText, { color: primaryTextColor }]}
          />

          {comment.edited ? (
            <Text style={{ marginTop: 4, color: secondaryTextColor, fontSize: 11 }}>Edited</Text>
          ) : null}

          {allowMedia && Array.isArray(comment.images) && comment.images.length > 0
            ? comment.images.map((imageUrl) => (
                <View key={`${commentId}_${imageUrl}`} style={flatStyles.imageWrap}>
                  <FastImage
                    source={{ uri: imageUrl }}
                    style={flatStyles.image}
                    resizeMode="cover"
                  />
                </View>
              ))
            : null}

          {allowMedia && comment.gif ? (
            <View style={flatStyles.imageWrap}>
              {Platform.OS === 'android' && gifPreviewUrl ? (
                <FastImage
                  source={{ uri: gifPreviewUrl }}
                  resizeMode="contain"
                  style={[flatStyles.gif, { aspectRatio: safeGifAspectRatio }]}
                />
              ) : (
                <GiphyMediaView
                  media={comment.gif}
                  resizeMode="contain"
                  style={[flatStyles.gif, { aspectRatio: safeGifAspectRatio }]}
                />
              )}
            </View>
          ) : null}
        </TouchableOpacity>

        <View style={flatStyles.actionsRow}>
          <View style={flatStyles.leftActions}>
            <TouchableOpacity
              disabled={isReacting}
              onLongPress={() => {
                onShowReactionPicker(commentId);
              }}
              delayLongPress={180}
              onPress={() => {
                onToggleReaction(commentId, Boolean(myReaction));
              }}
              style={flatStyles.reactionButton}
            >
              <MaterialIcons
                name={myReaction ? 'favorite' : 'favorite-border'}
                size={22}
                color={myReaction ? accentColor : mutedColor}
              />
              {reactionCount > 0 ? (
                <Text
                  style={[
                    flatStyles.reactionCount,
                    {
                      color: myReaction ? accentColor : mutedColor,
                    },
                  ]}
                >
                  {reactionCount}
                </Text>
              ) : null}
            </TouchableOpacity>
            <TouchableOpacity
              style={flatStyles.commentThreadButton}
              disabled={!onOpenThread}
              onPress={() => {
                onOpenThread?.(comment);
              }}
            >
              <MaterialIcons name="chat-bubble-outline" size={22} color={mutedColor} />
              {item.directReplyCount > 0 ? (
                <Text style={[flatStyles.commentThreadCount, { color: mutedColor }]}>
                  {item.directReplyCount}
                </Text>
              ) : null}
            </TouchableOpacity>
            <TouchableOpacity
              style={flatStyles.commentThreadButton}
              disabled={isReposting || !onPressRepost}
              onPress={() => {
                onPressRepost?.(comment);
              }}
            >
              <RepeatIcon width={22} height={22} color={mutedColor} />
              {repostCount > 0 ? (
                <Text style={[flatStyles.commentThreadCount, { color: mutedColor }]}>
                  {repostCount}
                </Text>
              ) : null}
            </TouchableOpacity>
            <TouchableOpacity
              style={flatStyles.commentThreadButton}
              disabled={!onSharePress}
              onPress={() => {
                onSharePress?.(comment);
              }}
            >
              <SendIcon width={22} height={22} color={mutedColor} />
            </TouchableOpacity>
            <TouchableOpacity
              style={flatStyles.commentThreadButton}
              disabled={isBookmarking || !onToggleBookmark}
              onPress={() => {
                onToggleBookmark?.(commentId, isBookmarked);
              }}
            >
              <MaterialIcons
                name={isBookmarked ? 'bookmark' : 'bookmark-border'}
                size={22}
                color={isBookmarked ? accentColor : mutedColor}
              />
            </TouchableOpacity>
          </View>
        </View>

        {isReactionPickerVisible ? (
          <View style={flatStyles.reactionPicker}>
            {REACTION_PICKER_ITEMS.map((reactionItem) => (
              <TouchableOpacity
                key={`${commentId}_${reactionItem.id}`}
                style={flatStyles.reactionPickerButton}
                onPress={() => {
                  onSelectReaction(commentId, reactionItem.type);
                }}
              >
                <Image
                  source={{ uri: reactionItem.iconUrl }}
                  style={flatStyles.reactionPickerIcon}
                />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default memo(FlatCommentRow);
