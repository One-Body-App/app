import { useNavigation, useTheme } from '@react-navigation/native';

import React, { ReactNode, useRef } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  Share,
} from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useDispatch, useSelector } from 'react-redux';
import { Copy } from 'iconsax-react-native';
import { Bookmark, EditPencil, Xmark } from 'iconoir-react-native';
import Toast from 'react-native-toast-notifications';

import styles from './style';
import { setLoader } from '@/src/redux/actions/GeneralActions';
import { ApiCall } from '@/services/api';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { PostType, PostUserData, SocialPostReaction } from '@/utils/types';
import { getuserGet } from '@/src/redux/actions/UserAction';
import { getProfile } from '@/src/redux/actions/AuthActions';
import StyledText from '../styled/Text';
import { spacing } from '@/src/styles/spacing';
import { borderRadius } from '@/src/styles/outlines';
import { body, header } from '@/src/styles/typography';
import CustomClipboard, { CustomClipboardHandle } from '@/src/components/CustomClipboard';
import CustomModal from '../CustomModal';
import { MainStackParamList } from '@/src/navigator/types';
import CornerUpRightIcon from '@/assets/icons/corner-up-right.svg';

export type PopupItem = {
  id?: string;
  _id?: string;
  postId?: string;
  commentId?: string;
  objectType?: string;
  type: PostType;
  postlink?: string;
  title?: string;
  created?: Date;
  image?: {
    url: string;
  };
  externalLink?: string;
  reactions?: SocialPostReaction[];
  myReaction?: SocialPostReaction;
  userData: PostUserData;
};

type OptionRowProps = {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
  iconBackgroundColor: string;
  iconColor: string;
  destructive?: boolean;
  disabled?: boolean;
};

const MODAL_HEIGHT_RATIO = 0.65;
const ROW_HORIZONTAL_PADDING = 16;
const ROW_VERTICAL_PADDING = 16;
const ROW_ICON_GAP = 16;
const ONEBODY_APP_BASE_URL = 'https://app.onebodyapp.com';

function OptionsModal({
  show,
  setShow,
  currentPopupItem,
  height,
  removePost,
  editPost,
  hideSavePost,
  isPrivate,
}: {
  show: boolean;
  setShow: (show: boolean) => void;
  removePost?: (type: string, postId: string) => void;
  editPost?: (postId: string) => void;
  currentPopupItem?: PopupItem;
  height?: number;
  hideSavePost?: boolean;
  isPrivate?: boolean;
}) {
  const { dark } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const dispatch = useDispatch();
  const toast = useRef<Toast>(null);
  const clipboardRef = useRef<CustomClipboardHandle>(null);
  const token = useSelector((state: RootState) => state?.auth?.userToken);
  const user = useSelector((state: RootState) => state?.auth?.getProfileData);
  const loader = useSelector((state: RootState) => Boolean(state?.general?.loader));

  const surfaceColor = dark ? '#1a2c32' : '#ffffff';
  const sheetTitleColor = dark ? '#ffffff' : '#0e181b';
  const sheetSecondaryColor = dark ? '#8db5c2' : '#4f8596';
  const brandPrimary = '#116a88';
  const minimumSheetHeight = Math.round(Dimensions.get('window').height * MODAL_HEIGHT_RATIO);
  const sheetHeight =
    typeof height === 'number' && Number.isFinite(height)
      ? Math.max(height, minimumSheetHeight)
      : minimumSheetHeight;

  const removeSavedPost = async (type?: string, link?: string, id?: string) => {
    dispatch(setLoader(true));

    try {
      const res = await ApiCall({
        route: `user/remove-saved-post`,
        verb: 'delete',
        token,
        params: {
          id,
          link,
          type,
        },
      });

      if (res?.status === 200) {
        dispatch(getuserGet({ token }));
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    } finally {
      dispatch(setLoader(false));
    }
  };

  const savePost = async (
    postId?: string,
    type?: string,
    title?: string,
    createdAt?: Date,
    userId?: string,
    link?: string,
    image?: string
  ) => {
    dispatch(setLoader(true));

    try {
      const res = await ApiCall({
        route: `user/save-post`,
        verb: 'post',
        token,
        params: {
          postId,
          type,
          title,
          image,
          createdAt,
          userId,
          link,
        },
      });

      if (res?.status === 200) {
        dispatch(getuserGet({ token }));
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    } finally {
      dispatch(setLoader(false));
    }
  };

  const unfollowUser = async (userId?: string) => {
    if (!userId) {
      toast.current?.show('Unable to unfollow this user right now.', {
        placement: 'bottom',
      });
      return;
    }

    dispatch(setLoader(true));
    try {
      const res = await ApiCall({
        route: `user/unsubscribe/${userId}`,
        token,
        verb: 'patch',
      });

      if (res?.status === 200) {
        dispatch(getProfile.Request({ token }));
        toast.current?.show('User unfollowed.', { placement: 'bottom' });
      } else {
        toast.current?.show('Error unfollowing, please try again later.', {
          placement: 'bottom',
        });
      }
    } catch (error) {
      toast.current?.show('Error unfollowing, please try again later.', {
        placement: 'bottom',
      });
    } finally {
      dispatch(setLoader(false));
    }
  };

  let isThisPostSaved = false;
  if (
    currentPopupItem?.type === PostType.prayer &&
    user?.savedPrayers &&
    user?.savedPrayers.length > 0
  ) {
    user?.savedPrayers.forEach((savedPrayers) => {
      if (savedPrayers === currentPopupItem?.id) {
        isThisPostSaved = true;
      }
    });
  } else if (
    currentPopupItem?.type !== PostType.prayer &&
    user?.savedPost &&
    user?.savedPost.length > 0
  ) {
    user?.savedPost.forEach((savedPost) => {
      if (
        (currentPopupItem &&
          savedPost.link !== undefined &&
          savedPost.link === currentPopupItem?.postlink) ||
        (savedPost.postId !== undefined && savedPost.postId === currentPopupItem?.id)
      ) {
        isThisPostSaved = true;
      }
    });
  }
  let savedIconBackgroundColor = 'rgba(17, 106, 136, 0.12)';
  if (isThisPostSaved) {
    savedIconBackgroundColor = brandPrimary;
  } else if (dark) {
    savedIconBackgroundColor = '#22363d';
  }

  const getReportTargetType = (popupItem?: PopupItem): 'social' | 'prayer' | 'comment' | null => {
    if (!popupItem) return null;
    if (popupItem.type === PostType.social) return 'social';
    if (popupItem.type === PostType.prayer) return 'prayer';
    if (popupItem.type === PostType.comment) {
      if (
        popupItem.objectType &&
        popupItem.objectType !== PostType.social &&
        popupItem.objectType !== PostType.prayer
      ) {
        return null;
      }
      return 'comment';
    }
    return null;
  };

  const getReportTargetId = (popupItem?: PopupItem): string => {
    if (!popupItem) return '';
    return popupItem.id ?? popupItem.commentId ?? popupItem.postId ?? popupItem._id ?? '';
  };

  const getCanonicalPostType = (popupItem?: PopupItem): PostType | 'social' | 'prayer' => {
    if (!popupItem) return PostType.social;

    if (popupItem.type === PostType.comment) {
      const { objectType } = popupItem as PopupItem & { objectType?: string };
      if (objectType === PostType.prayer) return PostType.prayer;
      if (objectType === PostType.watch) return PostType.watch;
      if (objectType === PostType.rss) return PostType.rss;
      return PostType.social;
    }

    return popupItem.type;
  };

  const getCanonicalPostId = (popupItem?: PopupItem): string => {
    if (!popupItem) return '';

    if (popupItem.type === PostType.comment) {
      const { objectId } = popupItem as PopupItem & { objectId?: string };
      return objectId ?? popupItem.postId ?? popupItem.id ?? popupItem._id ?? '';
    }

    return popupItem.id ?? popupItem.postId ?? popupItem._id ?? '';
  };

  const getOneBodyPostLink = (popupItem?: PopupItem): string => {
    if (!popupItem) return '';

    const rawPostLink = popupItem.postlink?.trim();
    if (rawPostLink && rawPostLink.includes('onebodyapp.com')) {
      return rawPostLink;
    }

    const postId = getCanonicalPostId(popupItem);
    if (!postId) {
      return rawPostLink ?? '';
    }

    const postType = getCanonicalPostType(popupItem);
    let oneBodyUrl = `${ONEBODY_APP_BASE_URL}/post/${postType}/${postId}`;

    if (popupItem.type === PostType.comment) {
      const commentId = popupItem.commentId ?? popupItem.id ?? popupItem._id;
      if (commentId) {
        oneBodyUrl = `${oneBodyUrl}?commentId=${encodeURIComponent(commentId)}`;
      }
    }

    return oneBodyUrl;
  };

  const reportSupported = getReportTargetType(currentPopupItem) !== null;
  const isPrivateContent = Boolean(isPrivate);
  const canShowShareAction = (() => {
    if (!currentPopupItem) return false;

    if (currentPopupItem.type === PostType.social) {
      return true;
    }

    if (currentPopupItem.type === PostType.prayer) {
      return !isPrivateContent;
    }

    if (currentPopupItem.type === PostType.comment) {
      if (currentPopupItem.objectType === PostType.social) {
        return true;
      }
      if (currentPopupItem.objectType === PostType.prayer) {
        return !isPrivateContent;
      }
      return false;
    }

    return false;
  })();

  const shareCurrentItem = async () => {
    const postUrl = getOneBodyPostLink(currentPopupItem);
    if (!postUrl) {
      toast.current?.show('No link available for this post.', {
        placement: 'bottom',
      });
      return;
    }

    await Share.share({
      title: `${currentPopupItem?.title ?? ''}`,
      url: Platform.OS === 'ios' ? postUrl : '',
      message: Platform.OS === 'android' ? postUrl : postUrl,
    });
  };

  const renderOptionRow = ({
    icon,
    title,
    subtitle,
    onPress,
    iconBackgroundColor,
    iconColor,
    destructive,
    disabled,
  }: OptionRowProps) => {
    const textColor = destructive ? '#dc2626' : sheetTitleColor;
    const helperColor = destructive ? '#ef4444' : sheetSecondaryColor;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        disabled={disabled}
        onPress={onPress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: ROW_HORIZONTAL_PADDING,
          paddingVertical: ROW_VERTICAL_PADDING,
          borderRadius: borderRadius.large,
          marginBottom: 4,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: iconBackgroundColor,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {React.isValidElement(icon)
            ? React.cloneElement(icon as React.ReactElement<any>, {
                color: iconColor,
              })
            : icon}
        </View>

        <View style={{ flex: 1, marginLeft: ROW_ICON_GAP }}>
          <StyledText style={[body.x2, { color: textColor, fontWeight: '700', fontSize: 16 }]}>
            {title}
          </StyledText>
          <StyledText
            style={{
              color: helperColor,
              fontSize: 12,
              marginTop: 4,
            }}
          >
            {subtitle}
          </StyledText>
        </View>
      </TouchableOpacity>
    );
  };

  const isMine = currentPopupItem?.userData?._id === user?._id;

  return (
    <CustomModal
      modalVisible={show}
      onclose={() => setShow(false)}
      style={{
        ...styles.bottomView,
        height: sheetHeight,
        minHeight: sheetHeight,
        maxHeight: sheetHeight,
      }}
    >
      <CustomClipboard ref={clipboardRef} />
      <Toast ref={toast} />

      <View
        style={{
          backgroundColor: surfaceColor,
          borderTopLeftRadius: 40,
          borderTopRightRadius: 40,
          overflow: 'hidden',
          height: sheetHeight,
          minHeight: sheetHeight,
          maxHeight: sheetHeight,
        }}
      >
        <View style={{ alignItems: 'center', paddingTop: spacing.x10, paddingBottom: 8 }}>
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: borderRadius.max,
              backgroundColor: dark ? '#3a4a50' : '#d1d5db',
            }}
          />
        </View>

        <View
          style={{
            paddingHorizontal: spacing.x30,
            paddingTop: 8,
            paddingBottom: spacing.x8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <StyledText style={[header.h2, { color: sheetTitleColor }]}>Post Options</StyledText>
          <TouchableOpacity
            onPress={() => setShow(false)}
            style={{
              width: 32,
              height: 32,
              borderRadius: borderRadius.max,
              backgroundColor: dark ? '#032f3c' : '#f3f4f6',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons name="close" size={20} color={sheetSecondaryColor} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: ROW_HORIZONTAL_PADDING,
            paddingTop: spacing.x8,
            paddingBottom: spacing.x24,
          }}
          showsVerticalScrollIndicator={false}
        >
          {isMine && editPost
            ? renderOptionRow({
                icon: <EditPencil width={20} height={20} color={sheetSecondaryColor} />,
                title: 'Edit',
                subtitle: 'Update this post',
                iconBackgroundColor: dark ? '#22363d' : '#f3f4f6',
                iconColor: sheetSecondaryColor,
                onPress: () => {
                  setShow(false);
                  if (currentPopupItem?.id) editPost(currentPopupItem?.id);
                },
              })
            : null}

          {isMine && removePost
            ? renderOptionRow({
                icon: <Xmark width={20} height={20} color="#dc2626" />,
                title: 'Remove',
                subtitle: 'Delete this post',
                iconBackgroundColor: 'rgba(220, 38, 38, 0.14)',
                iconColor: '#dc2626',
                destructive: true,
                onPress: () => {
                  Alert.alert('Are you sure you want to remove this?', undefined, [
                    {
                      text: 'Yes',
                      onPress: () => {
                        setShow(false);
                        if (currentPopupItem) {
                          removePost(currentPopupItem.type, currentPopupItem?.id ?? '');
                        }
                      },
                      style: 'destructive',
                    },
                    {
                      text: 'No',
                      style: 'cancel',
                    },
                  ]);
                },
              })
            : null}

          {!hideSavePost
            ? renderOptionRow({
                icon: (
                  <Bookmark
                    width={20}
                    height={20}
                    color={isThisPostSaved ? '#ffffff' : brandPrimary}
                    fill={isThisPostSaved ? '#ffffff' : 'transparent'}
                  />
                ),
                title: isThisPostSaved ? 'Remove Saved Post' : 'Save Post',
                subtitle: 'Add this to your saved collection',
                iconBackgroundColor: savedIconBackgroundColor,
                iconColor: isThisPostSaved ? '#ffffff' : brandPrimary,
                onPress: () => {
                  if (isThisPostSaved) {
                    if (currentPopupItem?.id) {
                      removeSavedPost(currentPopupItem?.type, undefined, currentPopupItem?.id);
                    } else if (currentPopupItem?.postlink) {
                      removeSavedPost(currentPopupItem?.type, currentPopupItem?.postlink);
                    }
                  } else {
                    savePost(
                      currentPopupItem?.id,
                      currentPopupItem?.type,
                      currentPopupItem?.title,
                      currentPopupItem?.created,
                      currentPopupItem?.userData._id,
                      currentPopupItem?.postlink,
                      currentPopupItem?.image?.url
                    );
                  }
                },
                disabled: loader,
              })
            : null}

          {canShowShareAction
            ? renderOptionRow({
                icon: <CornerUpRightIcon width={20} height={20} color="#126b87" />,
                title: 'Share',
                subtitle: 'Share this post with others',
                iconBackgroundColor: dark ? 'rgba(18,107,135,0.18)' : 'rgba(18,107,135,0.12)',
                iconColor: '#126b87',
                onPress: shareCurrentItem,
              })
            : null}

          {renderOptionRow({
            icon: <Copy size={20} color={sheetSecondaryColor} />,
            title: 'Copy Link',
            subtitle: 'Copy post URL to clipboard',
            iconBackgroundColor: dark ? '#22363d' : '#f3f4f6',
            iconColor: sheetSecondaryColor,
            onPress: () => {
              const postUrl = getOneBodyPostLink(currentPopupItem);
              if (!postUrl) {
                toast.current?.show('No link available for this post.', {
                  placement: 'bottom',
                });
                return;
              }
              clipboardRef.current?.copy(postUrl);
              toast.current?.show('Link copied to the clipboard', {
                placement: 'bottom',
              });
            },
          })}

          {!isMine && !isPrivate
            ? renderOptionRow({
                icon: (
                  <MaterialCommunityIcons
                    name="eye-off-outline"
                    size={20}
                    color={sheetSecondaryColor}
                  />
                ),
                title: 'Hide Post',
                subtitle: 'See fewer posts like this',
                iconBackgroundColor: dark ? '#22363d' : '#f3f4f6',
                iconColor: sheetSecondaryColor,
                onPress: () => {
                  toast.current?.show('Hide Post is coming soon.', { placement: 'bottom' });
                },
              })
            : null}

          {!isMine && !isPrivate
            ? renderOptionRow({
                icon: (
                  <MaterialCommunityIcons
                    name="account-remove-outline"
                    size={20}
                    color={sheetSecondaryColor}
                  />
                ),
                title: 'Unfollow User',
                subtitle: 'Stop seeing posts from this author',
                iconBackgroundColor: dark ? '#22363d' : '#f3f4f6',
                iconColor: sheetSecondaryColor,
                onPress: () => {
                  unfollowUser(currentPopupItem?.userData?._id);
                },
                disabled: loader,
              })
            : null}

          <View
            style={{
              height: 1,
              backgroundColor: dark ? '#22363d' : '#eef2f3',
              marginVertical: spacing.x8,
              marginHorizontal: 16,
            }}
          />

          {renderOptionRow({
            icon: <MaterialCommunityIcons name="flag-outline" size={20} color="#dc2626" />,
            title: 'Report Post',
            subtitle: 'Report this post for community review',
            iconBackgroundColor: 'rgba(220, 38, 38, 0.14)',
            iconColor: '#dc2626',
            destructive: true,
            onPress: () => {
              const targetType = getReportTargetType(currentPopupItem);
              const targetId = getReportTargetId(currentPopupItem);

              if (!reportSupported || !targetType || !targetId) {
                toast.current?.show('Report is not available for this content type yet.', {
                  placement: 'bottom',
                });
                return;
              }

              setShow(false);
              navigation.navigate('ReportPost', {
                targetId,
                targetType,
                title: currentPopupItem?.title,
                reportedUserId: currentPopupItem?.userData?._id,
              });
            },
          })}
          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </CustomModal>
  );
}

export default OptionsModal;
