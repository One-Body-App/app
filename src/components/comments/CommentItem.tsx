import { ActivityIndicator, StyleProp, TouchableOpacity, View, ViewStyle } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useTheme } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/material-design-icons';
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
}: BaseItemProps) {
  const [showOptions, setShowOptions] = useState(false);
  const { colors } = useTheme();
  const [isEditingComment, setIsEditingComment] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mediaGif, setGif] = useState<GiphyMedia | null>(postData.gif ?? null);
  const safeUserData = userData ?? ({} as PostUserData);
  const profileImageUri =
    safeUserData.profileImage && safeUserData.profileImage !== ''
      ? safeUserData.profileImage
      : NO_PROFILE_IMAGE;
  const gifAspectRatioRaw = postData.gif?.aspectRatio;
  const gifAspectRatio = Number(gifAspectRatioRaw);
  const safeGifAspectRatio =
    Number.isFinite(gifAspectRatio) && gifAspectRatio > 0 ? gifAspectRatio : 1;
  const hasGif = Boolean(postData.gif?.id || postData.gif?.url);
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
    <View
      style={[
        {
          flexGrow: 1,
          padding: spacing.x13,
          marginBottom: spacing.x13,
          backgroundColor: colors.card,
          borderRadius: borderRadius.base,
          borderWidth: borderWidth.hairline,
          borderColor: Colors.neutral[700],
        },
        style,
      ]}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.x13,
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
                uri: profileImageUri,
              }}
              style={{
                width: 40,
                height: 40,
                borderRadius: borderRadius.max,
                // marginBottom: 5,
                borderColor: safeUserData.profileImage !== NO_PROFILE_IMAGE ? '#032F3C' : '#09aadb',
                borderWidth: borderWidth.thin,
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                onPress={() => {
                  // navigation.navigate('UserProfile', {
                  //   id: userData?._id,
                  // });
                  onPress();
                }}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  flexGrow: 1,
                  flex: 1,
                }}
              >
                <View style={{ flexDirection: 'column' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <StyledText
                      style={{
                        color: Colors.neutral.brand,
                        alignItems: 'center',
                        ...fontSize.x2,
                        ...fontWeight.semibold,
                      }}
                      numberOfLines={2}
                    >
                      {safeUserData?.name ?? 'Unknown'}
                    </StyledText>
                    {isApprovedInfluencer ? (
                      <Icon
                        name="check-decagram"
                        size={20}
                        style={{ marginLeft: spacing.x8 }}
                        color={Colors.primarySapphire.brand}
                      />
                    ) : null}
                  </View>
                  <StyledText
                    numberOfLines={2}
                    style={{
                      color: Colors.neutral[400],
                      alignItems: 'center',
                      ...fontSize.x1,
                    }}
                  >
                    {handleText}

                    {created ? (
                      <>
                        {hasHandle ? ` • ` : ''}
                        <StyledText
                          style={[
                            fontSize.x1,
                            { color: Colors.neutral[400], alignItems: 'center' },
                          ]}
                        >
                          {timeSince(created)} ago
                        </StyledText>
                      </>
                    ) : null}
                    {edited && updated ? (
                      <>
                        {' '}
                        • {' Edited '}
                        <StyledText
                          style={[
                            fontSize.x1,
                            { color: Colors.neutral[400], alignItems: 'center' },
                          ]}
                        >
                          {timeSince(updated)} ago
                        </StyledText>
                      </>
                    ) : null}
                  </StyledText>
                </View>
              </TouchableOpacity>
              {!isEditingComment ? (
                <TouchableOpacity
                  onPress={() => {
                    setShowOptions(true);
                  }}
                >
                  <FontAwesomeIcon icon={faEllipsisVertical} color={colors.text} />
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
          {isEditingComment ? (
            <View
              style={{
                minHeight: 140,
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
              {postData.content ? (
                <StyledText
                  style={{
                    marginTop: spacing.x8,
                    color: colors.text,
                    ...fontSize.x2,
                  }}
                >
                  {postData.content}
                </StyledText>
              ) : null}
            </>
          )}
          {!isEditingComment && postData.gif && hasGif ? (
            <View
              style={{
                padding: 10,
                // height: 100,
                // width: 100,
                borderRadius: borderRadius.small,
              }}
            >
              <GiphyMediaView
                media={postData.gif}
                resizeMode="cover"
                style={{
                  aspectRatio: safeGifAspectRatio,
                  borderRadius: borderRadius.small,

                  overflow: 'hidden',
                }}
              />
            </View>
          ) : null}
        </View>
      </View>

      <OptionsModal
        show={showOptions ?? false}
        setShow={setShowOptions}
        currentPopupItem={{ ...postData, type: PostType.comment, userData: safeUserData, created }}
        onProfilePress={onPress}
        removePost={removePost}
        hideShare
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
