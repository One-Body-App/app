import { NO_PROFILE_IMAGE } from '@/src/Services/constants';
import { Colors } from '@/src/styles';
import { borderRadius, borderWidth } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import { PostType, PostUserData, SocialPostReaction } from '@/utils/types';
import { StyleProp, TouchableOpacity, View, ViewStyle } from 'react-native';
import FastImage from 'react-native-fast-image';
import { StyledText } from '../styled/Text';
import { fontSize } from '@/src/styles/typography';
import { timeSince } from '@/utils/ResponsiveFun';
import { useTheme } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { GiphyMedia, GiphyMediaView } from '@giphy/react-native-sdk';
import OptionsModal from '../listItems/OptionsModal';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';
import { StyledTextInput } from '../styled/TextInput';
import { Send } from 'iconsax-react-native';

interface BaseItemProps {
  style?: StyleProp<ViewStyle>;
  onPress: Function;
  created?: Date;
  updated?: Date;
  edited?: boolean;
  source?: string;
  fromSavedPosts?: boolean;
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

  onShowDismissCard?: (e?: boolean) => void;
  isScrollEnable?: boolean;
  index?: number;
  parentRefreshContent?: Function;
  removePost?: (type: string, postId: string) => void;
  editPost?: (postId: string) => void;
  editCommentAction?: (postId: string, content: string) => void;
}

const CommentItem = ({
  style,
  onPress,
  created,
  updated,
  edited,
  source,
  userData,
  isApprovedInfluencer,
  postData,
  parentRefreshContent,
  onShowDismissCard,
  removePost,
  editPost,
  editCommentAction,
}: BaseItemProps) => {
  const [showOptions, setShowOptions] = useState(false);
  const { colors } = useTheme();
  const [isEditingComment, setIsEditingComment] = useState<boolean>(false);
  const [commentContent, setCommentContent] = useState<string>(postData.content ?? '');

  const editComment = () => {
    setIsEditingComment(true);
  };

  return (
    <View
      style={[
        {
          flexGrow: 1,
          padding: spacing.x16,
        },
        style,
      ]}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.x10,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
          }}
        >
          {userData.profileIcon && !userData.profileImage ? (
            <View
              style={{
                borderRadius: borderRadius.max,
                borderColor: userData.profileImage != NO_PROFILE_IMAGE ? '#032F3C' : '#09aadb',
                borderWidth: borderWidth.thin,
                padding: spacing.x5,
              }}
            >
              {userData.profileIcon}
            </View>
          ) : (
            <FastImage
              source={{
                uri: userData.profileImage != '' ? userData.profileImage : NO_PROFILE_IMAGE,
              }}
              style={{
                width: 40,
                height: 40,
                borderRadius: borderRadius.max,
                // marginBottom: 5,
                borderColor: userData.profileImage != NO_PROFILE_IMAGE ? '#032F3C' : '#09aadb',
                borderWidth: borderWidth.thin,
              }}
              resizeMode={'contain'}
            />
          )}
        </View>
        <View
          style={{
            flexGrow: 1,
            backgroundColor: Colors.neutral[800],
            padding: spacing.x10,
            borderRadius: borderRadius.small,
          }}
        >
          {userData ? (
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
                  <View style={{ flexDirection: 'row' }}>
                    <StyledText
                      style={{
                        color: Colors.neutral.brand,
                        alignItems: 'center',
                        ...fontSize.x1,
                      }}
                      numberOfLines={2}
                    >
                      {userData?.name}
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
                      color: Colors.neutral[300],
                      alignItems: 'center',
                      ...fontSize.x1,
                    }}
                  >
                    {(source == 'twitter' && userData?.twitterHandler) ||
                    (source == 'instagram' && userData?.instagramHandler) ||
                    userData?.username
                      ? `@${
                          source == 'twitter'
                            ? userData?.twitterHandler
                            : source == 'instagram'
                            ? userData?.instagramHandler
                            : userData?.username
                        }`
                      : ''}

                    {created ? (
                      <>
                        {(source == 'twitter' && userData?.twitterHandler) ||
                        (source == 'instagram' && userData?.instagramHandler) ||
                        userData?.username
                          ? ` • `
                          : ''}
                        <StyledText
                          style={[
                            fontSize.x1,
                            { color: Colors.neutral[300], alignItems: 'center' },
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
                            { color: Colors.neutral[300], alignItems: 'center' },
                          ]}
                        >
                          {timeSince(updated)} ago
                        </StyledText>
                      </>
                    ) : null}
                  </StyledText>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowOptions(true);
                }}
              >
                <FontAwesomeIcon icon={faEllipsisVertical} color={colors.text} />
              </TouchableOpacity>
            </View>
          ) : null}
          {isEditingComment ? (
            <View>
              <StyledTextInput
                placeholder="Comment"
                value={commentContent}
                onChangeText={(value) => {
                  setCommentContent(value);
                }}
                inputStyle={{ marginVertical: spacing.x10 }}
                rightIcon={
                  <View style={{ justifyContent: 'center' }}>
                    <TouchableOpacity
                      onPress={() => {
                        setIsEditingComment(false);
                        if (editCommentAction && postData.id) {
                          editCommentAction(postData.id, commentContent);
                        }
                      }}
                    >
                      <Send variant="Bold" color={Colors.primarySapphire.brand} />
                    </TouchableOpacity>
                  </View>
                }
              />
            </View>
          ) : (
            <StyledText style={{ marginVertical: spacing.x10 }}>{postData.content}</StyledText>
          )}
          {postData.gif && (
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
                  aspectRatio: postData.gif.aspectRatio,
                  borderRadius: borderRadius.small,

                  overflow: 'hidden',
                }}
              />
            </View>
          )}
        </View>
      </View>

      <OptionsModal
        show={showOptions ?? false}
        setShow={setShowOptions}
        currentPopupItem={{ ...postData, type: PostType.comment, userData, created }}
        onProfilePress={onPress}
        removePost={removePost}
        hideShare
        hideSavePost
        editPost={editPost ?? editComment}
      />
    </View>
  );
};

export default CommentItem;
