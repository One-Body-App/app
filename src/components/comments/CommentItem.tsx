import {
  ActivityIndicator,
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
import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';
import { NO_PROFILE_IMAGE } from '@/services/constants';
import { Colors } from '@/src/styles';
import { borderRadius, borderWidth } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import { PostType, PostUserData, SocialPostReaction } from '@/utils/types';
import StyledText from '../styled/Text';
import { fontSize, fontWeight } from '@/src/styles/typography';
import { timeSince } from '@/utils/ResponsiveFun';
import OptionsModal from '../listItems/OptionsModal';
import CommentField from './Field';

interface BaseItemProps {
  style?: StyleProp<ViewStyle>;
  onPress: Function;
  created?: Date;
  updated?: Date;
  edited?: boolean;
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
  };
  userData: PostUserData;

  isApprovedInfluencer?: boolean;

  removePost?: (type: string, postId: string) => void;
  editPost?: (postId: string) => void;
  editCommentAction?: (postId: string, content: string) => void;
  setEditingComment: (isEditingComment: boolean) => void;
  isPrivate?: boolean;
}

function CommentItem({
  style,
  onPress,
  created,
  updated,
  edited,
  source,
  userData,
  isApprovedInfluencer,
  postData,
  removePost,
  editPost,
  editCommentAction,
  setEditingComment,
  isPrivate,
}: BaseItemProps) {
  const [showOptions, setShowOptions] = useState(false);
  const { colors, dark } = useTheme();
  const [isEditingComment, setIsEditingComment] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mediaGif, setGif] = useState<GiphyMedia | null>(postData.gif ?? null);
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
  const canUseGiphy = Platform.OS !== 'android';
  const reactionCount = postData.reactions?.length ?? 0;
  const textMain = dark ? '#ffffff' : '#0e181b';
  const textSecondary = '#4f8596';
  const bubbleColor = dark ? '#1a2c32' : '#f2f4f5';
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
                {!isEditingComment && postData.gif && hasGif && canUseGiphy ? (
                  <View
                    style={{
                      marginTop: spacing.x8,
                      borderRadius: borderRadius.small,
                      overflow: 'hidden',
                    }}
                  >
                    <GiphyMediaView
                      media={postData.gif}
                      resizeMode="cover"
                      style={{
                        aspectRatio: safeGifAspectRatio,
                        borderRadius: borderRadius.small,
                      }}
                    />
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
                  marginTop: spacing.x8,
                  marginLeft: spacing.x5,
                  gap: spacing.x16,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialIcons name="favorite" size={14} color="#e04b4b" />
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
                <TouchableOpacity>
                  <StyledText
                    style={{
                      color: actionColor,
                      fontSize: 11,
                      fontWeight: '700',
                    }}
                  >
                    Reply
                  </StyledText>
                </TouchableOpacity>
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
