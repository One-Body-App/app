import {
  ActivityIndicator,
  Animated,
  Image,
  Platform,
  StyleProp,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { useTheme } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/material-design-icons';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { GiphyMedia, GiphyMediaView } from '@giphy/react-native-sdk';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';
import { NO_PROFILE_IMAGE } from '@/services/constants';
import { HapticService } from '@/src/services/haptic';
import { Colors } from '@/src/styles';
import { borderRadius, borderWidth } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import { PostType, PostUserData, SocialPostReaction, SocialPostReactionType } from '@/utils/types';
import StyledText from '../styled/Text';
import { fontSize, fontWeight } from '@/src/styles/typography';
import { timeSince } from '@/utils/ResponsiveFun';
import OptionsModal from '../listItems/OptionsModal';
import CommentField from './Field';

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
  // eslint-disable-next-line no-restricted-syntax
  for (const renditionKey of renditionKeys) {
    const rendition = images[renditionKey] as Record<string, unknown> | undefined;
    if (!rendition || typeof rendition !== 'object') {
      // eslint-disable-next-line no-continue
      continue;
    }
    const renditionUrl = rendition.url;
    if (typeof renditionUrl === 'string' && renditionUrl.startsWith('http')) {
      return renditionUrl;
    }
  }

  return undefined;
};

const MEDIA_RADIUS = 12;
const REACTION_BAR_SCALE = 1;
const REACTION_BAR_OFFSET_X = 0;
const REACTION_BAR_OFFSET_Y = 44;
const REACTION_BAR_SCALE_FACTOR = 4 / 3;
const REACTION_BAR_WIDTH = Math.round(280 * REACTION_BAR_SCALE_FACTOR);
const REACTION_BAR_ICON_SIZE = Math.round(22 * REACTION_BAR_SCALE_FACTOR);
const REACTION_BAR_HORIZONTAL_MARGIN = Math.round(spacing.x5 * REACTION_BAR_SCALE_FACTOR);
const REACTION_BAR_VERTICAL_PADDING = Math.round(spacing.x8 * REACTION_BAR_SCALE_FACTOR);
const REACTION_BAR_HORIZONTAL_PADDING = Math.round(spacing.x10 * REACTION_BAR_SCALE_FACTOR);

type AnimatedReaction = {
  id: string;
  iconUrl: string;
};

type ReactionBarRef = {
  showReactions: () => void;
  dismissReactions: () => void;
};

const TWEMOJI_BASE = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72';
const REACTION_ICON_URLS: Record<string, string> = {
  pray: `${TWEMOJI_BASE}/1f64f.png`,
  praise: `${TWEMOJI_BASE}/1f64c.png`,
  like: `${TWEMOJI_BASE}/1f44d.png`,
  love: `${TWEMOJI_BASE}/2764.png`,
  haha: `${TWEMOJI_BASE}/1f602.png`,
  wow: `${TWEMOJI_BASE}/1f632.png`,
  sad: `${TWEMOJI_BASE}/1f622.png`,
  angry: `${TWEMOJI_BASE}/1f621.png`,
};

const REACTION_BAR_ITEMS: AnimatedReaction[] = [
  { id: 'pray', iconUrl: REACTION_ICON_URLS.pray },
  { id: 'praise', iconUrl: REACTION_ICON_URLS.praise },
  { id: 'like', iconUrl: REACTION_ICON_URLS.like },
  { id: 'love', iconUrl: REACTION_ICON_URLS.love },
  { id: 'haha', iconUrl: REACTION_ICON_URLS.haha },
  { id: 'wow', iconUrl: REACTION_ICON_URLS.wow },
  { id: 'sad', iconUrl: REACTION_ICON_URLS.sad },
  { id: 'angry', iconUrl: REACTION_ICON_URLS.angry },
];

const InlineReactionBar = forwardRef<
  ReactionBarRef,
  { onDismiss: () => void; onReactionSelect: (reaction: AnimatedReaction) => void }
>(({ onDismiss, onReactionSelect }, ref) => {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(false);

  const showReactions = useCallback(() => {
    setVisible(true);
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 22,
        bounciness: 8,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale]);

  const dismissReactions = useCallback(() => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      onDismiss();
    });
  }, [onDismiss, opacity, scale]);

  useImperativeHandle(
    ref,
    () => ({
      showReactions,
      dismissReactions,
    }),
    [dismissReactions, showReactions]
  );

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
        borderRadius: borderRadius.max,
        paddingVertical: REACTION_BAR_VERTICAL_PADDING,
        paddingHorizontal: REACTION_BAR_HORIZONTAL_PADDING,
        minWidth: REACTION_BAR_WIDTH,
        transform: [{ scale }],
        opacity,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
      }}
    >
      {REACTION_BAR_ITEMS.map((reaction) => (
        <TouchableOpacity
          key={reaction.id}
          onPress={() => {
            onReactionSelect(reaction);
            dismissReactions();
          }}
          activeOpacity={0.8}
          style={{ marginHorizontal: REACTION_BAR_HORIZONTAL_MARGIN }}
        >
          <Image
            source={{ uri: reaction.iconUrl }}
            style={{ width: REACTION_BAR_ICON_SIZE, height: REACTION_BAR_ICON_SIZE }}
          />
        </TouchableOpacity>
      ))}
    </Animated.View>
  );
});

const mapReactionIdToType = (reactionId: string): SocialPostReactionType => {
  switch (reactionId) {
    case 'pray':
      return SocialPostReactionType.praying;
    case 'praise':
      return SocialPostReactionType.happy;
    case 'haha':
    case 'wow':
      return SocialPostReactionType.happy;
    case 'sad':
    case 'angry':
      return SocialPostReactionType.praying;
    case 'like':
    case 'love':
    default:
      return SocialPostReactionType.love;
  }
};

const getFallbackReactionIdFromType = (type?: SocialPostReactionType): string | undefined => {
  if (!type) {
    return undefined;
  }
  if (type === SocialPostReactionType.praying) {
    return 'pray';
  }
  if (type === SocialPostReactionType.happy) {
    return 'praise';
  }
  return 'love';
};

interface BaseItemProps {
  style?: StyleProp<ViewStyle>;
  onPress: Function;
  created?: Date;
  source?: string;
  postData: {
    id?: string;
    objectId?: string;
    objectType?: string;
    content?: string;
    image?: {
      url: string;
    };
    externalLink?: string;
    reactions?: SocialPostReaction[];
    myReaction?: SocialPostReaction;
    location?: {
      type?: string;
      coordinates?: number[];
    };
    locationName?: string;
    edited?: boolean;
    gif?: GiphyMedia | null;
    images?: string[];
  };
  userData: PostUserData;

  isApprovedInfluencer?: boolean;

  removePost?: (type: string, postId: string) => void;
  editPost?: (postId: string) => void;
  editCommentAction?: (postId: string, content: string) => void;
  setEditingComment: (isEditingComment: boolean) => void;
  isPrivate?: boolean;
  useBrandDarkTheme?: boolean;
  allowMedia?: boolean;
  allowImageAttachments?: boolean;
  setThreadImages?: React.Dispatch<React.SetStateAction<string[]>>;
  onOpenGifPicker?: () => void;
  onReplyPress?: () => void;
  onReactPress?: (type?: SocialPostReactionType) => void;
  isReacting?: boolean;
}

function CommentItem({
  style,
  onPress,
  created,
  source,
  userData,
  isApprovedInfluencer,
  postData,
  removePost,
  editPost,
  editCommentAction,
  setEditingComment,
  isPrivate,
  useBrandDarkTheme,
  allowMedia,
  allowImageAttachments,
  setThreadImages,
  onOpenGifPicker,
  onReplyPress,
  onReactPress,
  isReacting,
}: BaseItemProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [isReactionBarVisible, setIsReactionBarVisible] = useState(false);
  const [selectedReactionId, setSelectedReactionId] = useState<string | undefined>(undefined);
  const { colors, dark } = useTheme();
  const [isEditingComment, setIsEditingComment] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mediaGif, setGif] = useState<GiphyMedia | null>(postData.gif ?? null);
  const reactionBarRef = useRef<ReactionBarRef>(null);
  const reactionIconScale = useRef(new Animated.Value(1)).current;
  const safeUserData = userData ?? ({} as PostUserData);
  const profileImageUri =
    safeUserData.profileImage && safeUserData.profileImage !== ''
      ? safeUserData.profileImage
      : NO_PROFILE_IMAGE;
  const safeProfileImageUri = profileImageUri || 'https://via.placeholder.com/72';
  const gifAspectRatioRaw = postData.gif?.aspectRatio;
  const gifAspectRatio = Number(gifAspectRatioRaw);
  const safeGifAspectRatio =
    Number.isFinite(gifAspectRatio) && gifAspectRatio > 0 ? gifAspectRatio : 1;
  const hasGif = Boolean(postData.gif?.id || postData.gif?.url);
  const canUseGiphy = allowMedia ?? Platform.OS !== 'android';
  const gifPreviewUrl = extractGifPreviewUrl(postData.gif);
  const reactionCount = postData.reactions?.length ?? 0;
  const { myReaction } = postData;
  const textMain = dark ? '#ffffff' : '#0e181b';
  const textSecondary = '#4f8596';
  let bubbleColor = '#f2f4f5';
  if (dark && useBrandDarkTheme) {
    bubbleColor = colors.card;
  } else if (dark) {
    bubbleColor = '#1a2c32';
  }
  const actionColor = textSecondary;
  let handleValue: string | undefined;
  if (source === 'twitter' && safeUserData?.twitterHandler) {
    handleValue = safeUserData.twitterHandler;
  } else if (source === 'instagram' && safeUserData?.instagramHandler) {
    handleValue = safeUserData.instagramHandler;
  } else if (safeUserData?.username) {
    handleValue = safeUserData.username;
  }
  const handleText = handleValue ? `@${handleValue}` : '';
  const hasHandle = Boolean(handleValue);
  const editComment = (status: boolean) => {
    setIsEditingComment(status);
    setEditingComment(status);
  };

  const dismissReactionBar = () => {
    reactionBarRef.current?.dismissReactions();
  };

  const showReactionBar = () => {
    HapticService.trigger('impactMedium');
    setIsReactionBarVisible(true);
    requestAnimationFrame(() => {
      reactionBarRef.current?.showReactions();
    });
  };

  const triggerReactionSelectionAnimation = () => {
    reactionIconScale.stopAnimation();
    reactionIconScale.setValue(0.9);
    Animated.sequence([
      Animated.spring(reactionIconScale, {
        toValue: 1.22,
        useNativeDriver: true,
        speed: 20,
        bounciness: 9,
      }),
      Animated.spring(reactionIconScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 7,
      }),
    ]).start();
  };

  const handleAnimatedReactionSelect = (reaction: AnimatedReaction) => {
    HapticService.trigger('impactMedium');
    triggerReactionSelectionAnimation();
    const selectedType = mapReactionIdToType(reaction.id);
    if (myReaction?.type === selectedType) {
      setSelectedReactionId(undefined);
      onReactPress?.(undefined);
      return;
    }
    setSelectedReactionId(reaction.id);
    onReactPress?.(selectedType);
  };

  useEffect(() => {
    const fallbackReactionId = getFallbackReactionIdFromType(myReaction?.type);
    setSelectedReactionId((currentReactionId) => {
      if (!fallbackReactionId) {
        return undefined;
      }
      if (currentReactionId && mapReactionIdToType(currentReactionId) === myReaction?.type) {
        return currentReactionId;
      }
      return fallbackReactionId;
    });
  }, [myReaction?.type]);

  const selectedReactionIconUrl =
    selectedReactionId &&
    Object.prototype.hasOwnProperty.call(REACTION_ICON_URLS, selectedReactionId)
      ? REACTION_ICON_URLS[selectedReactionId as keyof typeof REACTION_ICON_URLS]
      : undefined;
  const reactionIcon = (() => {
    if (isReacting) {
      return <ActivityIndicator size="small" color={actionColor} />;
    }
    if (selectedReactionIconUrl) {
      return <Image source={{ uri: selectedReactionIconUrl }} style={{ width: 16, height: 16 }} />;
    }
    return (
      <MaterialIcons
        name={myReaction ? 'favorite' : 'favorite-border'}
        size={16}
        color={myReaction ? '#e04b4b' : actionColor}
      />
    );
  })();

  useEffect(() => {
    if (postData.gif) {
      setGif(postData.gif);
    }
  }, [postData]);

  return (
    <View style={[{ flexGrow: 1, paddingHorizontal: spacing.x16 }, style]}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.x13,
          paddingTop: spacing.x8,
          paddingBottom: spacing.x20,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
          }}
        >
          {safeUserData.profileIcon && !safeUserData.profileImage ? (
            <View
              style={{
                borderRadius: borderRadius.max,
                borderColor: safeUserData.profileImage !== NO_PROFILE_IMAGE ? '#032F3C' : '#09aadb',
                borderWidth: borderWidth.thin,
                padding: spacing.x5,
              }}
            >
              {safeUserData.profileIcon}
            </View>
          ) : (
            <FastImage
              source={{
                uri: safeProfileImageUri,
              }}
              style={{
                width: 36,
                height: 36,
                borderRadius: borderRadius.max,
              }}
              resizeMode="contain"
            />
          )}
        </View>
        <View
          style={{
            flexGrow: 1,
          }}
        >
          {safeUserData ? (
            <TouchableOpacity
              onPress={() => {
                onPress();
              }}
              style={{ flexGrow: 1 }}
            >
              <View
                style={{
                  backgroundColor: bubbleColor,
                  paddingHorizontal: spacing.x13,
                  paddingVertical: spacing.x10,
                  borderRadius: borderRadius.large,
                  borderTopLeftRadius: spacing.x5,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <StyledText
                    style={{
                      color: textMain,
                      ...fontSize.x2,
                      ...fontWeight.semibold,
                    }}
                    numberOfLines={1}
                  >
                    {safeUserData?.name ?? 'Unknown'}
                  </StyledText>
                  {isApprovedInfluencer ? (
                    <Icon
                      name="check-decagram"
                      size={18}
                      style={{ marginLeft: spacing.x5 }}
                      color={Colors.primarySapphire.brand}
                    />
                  ) : null}
                  <View style={{ flex: 1 }} />
                  <StyledText
                    style={{
                      color: textSecondary,
                      fontSize: 10,
                    }}
                    numberOfLines={1}
                  >
                    {created ? `${timeSince(created)} ago` : ''}
                  </StyledText>
                  {!isEditingComment ? (
                    <TouchableOpacity
                      onPress={() => {
                        setShowOptions(true);
                      }}
                      style={{ marginLeft: spacing.x8 }}
                    >
                      <FontAwesomeIcon icon={faEllipsisVertical} color={textSecondary} />
                    </TouchableOpacity>
                  ) : null}
                </View>
                {hasHandle && !isEditingComment ? (
                  <StyledText
                    numberOfLines={1}
                    style={{
                      marginTop: spacing.x5,
                      color: textSecondary,
                      ...fontSize.x1,
                    }}
                  >
                    {handleText}
                  </StyledText>
                ) : null}
                {!isEditingComment && postData.content ? (
                  <StyledText
                    style={{
                      marginTop: spacing.x5,
                      color: textMain,
                      ...fontSize.x2,
                      lineHeight: 18,
                    }}
                  >
                    {postData.content}
                  </StyledText>
                ) : null}
                {!isEditingComment && postData.gif && hasGif && canUseGiphy ? (
                  <View
                    style={{
                      marginTop: spacing.x8,
                      borderRadius: MEDIA_RADIUS,
                      overflow: 'hidden',
                    }}
                  >
                    {Platform.OS === 'android' && gifPreviewUrl ? (
                      <FastImage
                        source={{ uri: gifPreviewUrl }}
                        resizeMode="contain"
                        style={{
                          width: '100%',
                          aspectRatio: safeGifAspectRatio,
                          borderRadius: MEDIA_RADIUS,
                        }}
                      />
                    ) : (
                      <GiphyMediaView
                        media={postData.gif}
                        resizeMode="contain"
                        style={{
                          aspectRatio: safeGifAspectRatio,
                          borderRadius: MEDIA_RADIUS,
                        }}
                      />
                    )}
                  </View>
                ) : null}
                {!isEditingComment &&
                allowImageAttachments &&
                (postData.images?.length ?? 0) > 0 ? (
                  <View style={{ marginTop: spacing.x8, gap: spacing.x8 }}>
                    {(postData.images ?? []).map((imageUrl) => (
                      <View
                        key={imageUrl}
                        style={{
                          borderRadius: MEDIA_RADIUS,
                          overflow: 'hidden',
                        }}
                      >
                        <FastImage
                          source={{ uri: imageUrl }}
                          style={{
                            width: '100%',
                            height: 180,
                            borderRadius: MEDIA_RADIUS,
                          }}
                          resizeMode="contain"
                        />
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
          ) : null}
          {isEditingComment ? (
            <View
              style={{
                minHeight: 140,
                marginTop: spacing.x10,
              }}
            >
              {isLoading ? (
                <View style={{ justifyContent: 'center' }}>
                  <ActivityIndicator animating={isLoading} size="small" color={colors.text} />
                </View>
              ) : (
                <CommentField
                  mediaGif={mediaGif}
                  setGif={setGif}
                  isEditingComment={isEditingComment}
                  setEditingComment={editComment}
                  text={postData.content}
                  useBrandDarkTheme={useBrandDarkTheme}
                  allowMedia={allowMedia}
                  allowImageAttachments={allowImageAttachments}
                  mediaImages={postData.images ?? []}
                  setImages={setThreadImages}
                  onOpenGifPicker={onOpenGifPicker}
                  publishComment={async (value: string) => {
                    if (editCommentAction && postData.id) {
                      setIsLoading(true);
                      await editCommentAction(postData.id, value);
                      editComment(false);
                      setIsLoading(false);
                    }
                  }}
                />
              )}
            </View>
          ) : (
            // eslint-disable-next-line react/jsx-no-useless-fragment
            <>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  position: 'relative',
                  marginTop: spacing.x8,
                  marginLeft: spacing.x5,
                  gap: spacing.x16,
                }}
              >
                {onReactPress ? (
                  <View style={{ position: 'relative' }}>
                    <TouchableOpacity
                      onLongPress={showReactionBar}
                      onPress={() => {
                        dismissReactionBar();
                        if (myReaction) {
                          setSelectedReactionId(undefined);
                          onReactPress(undefined);
                          return;
                        }
                        setSelectedReactionId('love');
                        onReactPress(SocialPostReactionType.love);
                      }}
                      delayLongPress={180}
                      activeOpacity={0.8}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Animated.View style={{ transform: [{ scale: reactionIconScale }] }}>
                          {reactionIcon}
                        </Animated.View>
                        <StyledText
                          style={{
                            marginLeft: spacing.x5,
                            color: actionColor,
                            fontSize: 11,
                            fontWeight: '700',
                          }}
                        >
                          {reactionCount}
                        </StyledText>
                      </View>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {selectedReactionIconUrl ? (
                      <Image
                        source={{ uri: selectedReactionIconUrl }}
                        style={{ width: 16, height: 16 }}
                      />
                    ) : (
                      <MaterialIcons name="favorite" size={16} color="#e04b4b" />
                    )}
                    <StyledText
                      style={{
                        marginLeft: spacing.x5,
                        color: actionColor,
                        fontSize: 11,
                        fontWeight: '700',
                      }}
                    >
                      {reactionCount}
                    </StyledText>
                  </View>
                )}
                <TouchableOpacity disabled={!onReplyPress} onPress={onReplyPress}>
                  <StyledText
                    style={{
                      color: actionColor,
                      fontSize: 11,
                      fontWeight: '700',
                      opacity: onReplyPress ? 1 : 0.6,
                    }}
                  >
                    Reply
                  </StyledText>
                </TouchableOpacity>
                {onReactPress && isReactionBarVisible ? (
                  <View
                    pointerEvents="box-none"
                    style={{
                      position: 'absolute',
                      left: REACTION_BAR_OFFSET_X,
                      bottom: REACTION_BAR_OFFSET_Y,
                      zIndex: 20,
                      elevation: 20,
                      transform: [{ scale: REACTION_BAR_SCALE }],
                    }}
                  >
                    <InlineReactionBar
                      ref={reactionBarRef}
                      onReactionSelect={handleAnimatedReactionSelect}
                      onDismiss={() => {
                        setIsReactionBarVisible(false);
                      }}
                    />
                  </View>
                ) : null}
              </View>
            </>
          )}
        </View>
      </View>

      <OptionsModal
        show={showOptions ?? false}
        setShow={setShowOptions}
        currentPopupItem={{ ...postData, type: PostType.comment, userData: safeUserData, created }}
        removePost={removePost}
        isPrivate={isPrivate}
        hideSavePost
        editPost={
          editPost ||
          (() => {
            editComment(true);
          })
        }
      />
    </View>
  );
}

export default CommentItem;
