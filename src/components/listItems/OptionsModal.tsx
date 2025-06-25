import { CompositeNavigationProp, useTheme } from '@react-navigation/native';

import React, { useRef } from 'react';
import { View, Share, Platform, ScrollView, TouchableOpacity, Alert } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useDispatch, useSelector } from 'react-redux';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { StackNavigationProp } from '@react-navigation/stack';
import { Copy, InfoCircle, Profile } from 'iconsax-react-native';
import { Bookmark, EditPencil, ShareAndroid, ShareIos, Xmark } from 'iconoir-react-native';
// import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-notifications';
import { min } from 'lodash';
import Button from '../Button';

import { styles } from './style';
import { setLoader } from '@/src/redux/actions/GeneralActions';
import { ApiCall } from '@/services/api';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { PostType, PostUserData, SocialPostReaction } from '@/utils/types';
import { getuserGet } from '@/src/redux/actions/UserAction';
import {
  ExploreStackParamsList,
  MainDrawerParamsList,
  MainBottomStackParamsList,
} from '@/src/navigator/types';
import { Colors } from '@/src/styles';
import StyledText from '../styled/Text';
import { spacing } from '@/src/styles/spacing';
import { borderRadius } from '@/src/styles/outlines';
import { body, fontSize, header } from '@/src/styles/typography';
import CustomClipboard, { CustomClipboardHandle } from '@/src/components/CustomClipboard';
import CustomModal from '../CustomModal';

type ScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<ExploreStackParamsList, 'Explore'>,
  CompositeNavigationProp<
    DrawerNavigationProp<MainDrawerParamsList, 'Main'>,
    BottomTabNavigationProp<MainBottomStackParamsList, 'ExploreTab'>
  >
>;

export type PopupItem = {
  id?: string;
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
function OptionsModal({
  show,
  setShow,
  currentPopupItem,
  height,
  onProfilePress,
  removePost,
  editPost,
  hideSavePost,
  hideShare,
  isPrivate,
}: {
  show: boolean;
  setShow: (show: boolean) => void;
  removePost?: (type: string, postId: string) => void;
  editPost?: (postId: string) => void;
  currentPopupItem?: PopupItem;
  height?: number;
  onProfilePress?: Function;
  hideSavePost?: boolean;
  hideShare?: boolean;
  isPrivate?: boolean;
}) {
  const { colors, dark } = useTheme();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const dispatch = useDispatch();
  const toast = useRef<Toast>(null);
  const clipboardRef = useRef<CustomClipboardHandle>(null);
  const loader = useSelector((state: RootState) => state.general.loader);

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

      if (res?.status == 200) {
        dispatch(getuserGet({ token }));
      }
      dispatch(setLoader(false));
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
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

      if (res?.status == 200) {
        dispatch(getuserGet({ token }));
      }
      dispatch(setLoader(false));
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };
  let isThisPostSaved = false;
  if (
    currentPopupItem?.type == PostType.prayer &&
    user?.savedPrayers &&
    user?.savedPrayers.length > 0
  ) {
    user?.savedPrayers.forEach((savedPrayers) => {
      if (savedPrayers == currentPopupItem?.id) {
        isThisPostSaved = true;
      }
    });
  } else if (
    currentPopupItem?.type != PostType.prayer &&
    user?.savedPost &&
    user?.savedPost.length > 0
  ) {
    user?.savedPost.forEach((savedPost) => {
      if (
        (currentPopupItem &&
          savedPost.link != undefined &&
          savedPost.link == currentPopupItem?.postlink) ||
        (savedPost.postId != undefined && savedPost.postId == currentPopupItem?.id)
      ) {
        isThisPostSaved = true;
      }
    });
  }

  return (
    <CustomModal
      // backdropOpacity={0.3}
      modalVisible={show}
      onclose={() => setShow(false)}
      // onBackdropPress={() => setShow(false)}
      // onSwipeComplete={() => setShow(false)}
      // swipeDirection={['down']}
      style={{ ...styles.bottomView, height: '100%', minHeight: 500 }}
      // propagateSwipe
      // coverScreen
      // useNativeDriver
    >
      <CustomClipboard ref={clipboardRef} />
      <Toast ref={toast} />
      <View
        // style={[styles.content2, { height: height ?? '60%', backgroundColor: Colors.main.white }]}
        style={{
          paddingVertical: spacing.x16,
          paddingHorizontal: spacing.x24,
          borderTopRightRadius: borderRadius.large,
          borderTopLeftRadius: borderRadius.large,
          height: height ?? '100%',
          backgroundColor: colors.background,
        }}
      >
        <View style={{ alignItems: 'center' }}>
          <View style={[styles.headLine, { backgroundColor: dark ? '#000000' : '#EAEAEA' }]} />
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',

            paddingBottom: spacing.x10,
          }}
        >
          <StyledText style={header.h3}>Options</StyledText>
          <TouchableOpacity
            onPress={() => {
              setShow(false);
            }}
          >
            <MaterialCommunityIcons name="window-close" size={18} color={Colors.primary.brand} />
          </TouchableOpacity>
        </View>
        <ScrollView style={{ flexGrow: 1, minHeight: 200 }}>
          <View>
            {currentPopupItem?.userData?._id != user?._id && !isPrivate ? (
              <View style={{ marginVertical: spacing.x8 }}>
                <Button
                  text="View Account"
                  btnTextStyle={[body.x2, { color: colors.text }]}
                  leftIcon={
                    <Profile
                      style={{ marginRight: spacing.x5 }}
                      size={fontSize.x5.fontSize}
                      color={colors.text}
                    />
                  }
                  onPress={() => {
                    setShow(false);
                    if (onProfilePress) onProfilePress();
                  }}
                />
              </View>
            ) : null}

            {currentPopupItem?.userData?._id === user?._id ? (
              <>
                {editPost ? (
                  <View style={{ marginVertical: spacing.x8 }}>
                    <Button
                      text="Edit"
                      btnTextStyle={[body.x2, { color: colors.text }]}
                      leftIcon={
                        <EditPencil
                          style={{ marginRight: spacing.x5 }}
                          width={fontSize.x5.fontSize}
                          height={fontSize.x5.fontSize}
                          color={colors.text}
                          fill={isThisPostSaved ? colors.text : colors.background}
                        />
                      }
                      onPress={() => {
                        setShow(false);
                        if (currentPopupItem?.id) editPost(currentPopupItem?.id);
                      }}
                    />
                  </View>
                ) : null}

                {removePost ? (
                  <View style={{ marginVertical: spacing.x8 }}>
                    <Button
                      text="Remove"
                      btnTextStyle={[body.x2, { color: Colors.errorFeedback.background }]}
                      leftIcon={
                        <Xmark
                          style={{ marginRight: spacing.x5 }}
                          width={fontSize.x5.fontSize}
                          height={fontSize.x5.fontSize}
                          color={Colors.errorFeedback.background}
                          fill={isThisPostSaved ? colors.text : colors.background}
                        />
                      }
                      onPress={() => {
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
                      }}
                    />
                  </View>
                ) : null}
              </>
            ) : null}
            {!hideSavePost ? (
              <View style={{ marginVertical: spacing.x8 }}>
                <Button
                  text={isThisPostSaved ? 'Remove Saved Post' : 'Save Post'}
                  btnTextStyle={[body.x2, { color: colors.text }]}
                  disabled={loader}
                  leftIcon={
                    <Bookmark
                      style={{ marginRight: spacing.x5 }}
                      width={fontSize.x5.fontSize}
                      height={fontSize.x5.fontSize}
                      color={colors.text}
                      fill={isThisPostSaved ? colors.text : colors.background}
                    />
                  }
                  onPress={() => {
                    if (isThisPostSaved) {
                      if (currentPopupItem?.id)
                        removeSavedPost(currentPopupItem?.type, undefined, currentPopupItem?.id);
                      else if (currentPopupItem?.postlink)
                        removeSavedPost(currentPopupItem?.type, currentPopupItem?.postlink);
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
                  }}
                />
              </View>
            ) : null}

            {!hideShare ? (
              <View style={{ marginVertical: spacing.x8 }}>
                <Button
                  btnStyle={{ backgroundColor: colors.card, flexDirection: 'row' }}
                  text="Share"
                  leftIcon={
                    Platform.OS === 'ios' ? (
                      <ShareIos
                        style={{ marginRight: spacing.x5 }}
                        color={colors.text}
                        height={fontSize.x5.fontSize}
                        width={fontSize.x5.fontSize}
                      />
                    ) : (
                      <ShareAndroid
                        style={{ marginRight: spacing.x5 }}
                        color={colors.text}
                        height={fontSize.x5.fontSize}
                        width={fontSize.x5.fontSize}
                      />
                    )
                  }
                  btnTextStyle={[body.x2, { color: colors.text }]}
                  onPress={async () => {
                    await Share.share({
                      title: `${currentPopupItem?.title}`,
                      url:
                        Platform.OS == 'ios' && currentPopupItem?.postlink
                          ? currentPopupItem?.postlink
                          : '',
                      message:
                        Platform.OS == 'android' && currentPopupItem?.postlink
                          ? currentPopupItem?.postlink
                          : '',
                    });
                  }}
                />
              </View>
            ) : null}
          </View>

          {currentPopupItem?.postlink ? (
            <View style={{ marginVertical: spacing.x8 }}>
              <Button
                text="Copy Link!"
                btnTextStyle={[body.x2, { color: colors.text }]}
                leftIcon={
                  <Copy
                    style={{ marginRight: spacing.x5 }}
                    size={fontSize.x5.fontSize}
                    color={colors.text}
                  />
                }
                onPress={() => {
                  if (currentPopupItem?.postlink) {
                    // Clipboard.setString(currentPopupItem?.postlink);
                    clipboardRef.current?.copy(currentPopupItem?.postlink || '');
                    toast.current?.show('Link copied to the clipboard', {
                      placement: 'bottom',
                    });
                  }
                }}
              />
            </View>
          ) : null}

          <View style={{ marginVertical: spacing.x8 }}>
            <Button
              text="Block Account"
              leftIcon={
                <MaterialCommunityIcons
                  name="block-helper"
                  style={{ marginRight: spacing.x5 }}
                  size={fontSize.x5.fontSize}
                  color={Colors.errorFeedback.background}
                />
              }
              btnTextStyle={[body.x2, { color: Colors.errorFeedback.background }]}
              onPress={() => console.log('press')}
            />
          </View>

          <View style={{ marginVertical: spacing.x8 }}>
            <Button
              text="Report Post"
              leftIcon={
                <InfoCircle
                  style={{ marginRight: spacing.x5 }}
                  size={fontSize.x5.fontSize}
                  color={Colors.errorFeedback.background}
                />
              }
              btnTextStyle={[body.x2, { color: Colors.errorFeedback.background }]}
              onPress={() => console.log('press')}
            />
          </View>
        </ScrollView>
      </View>
    </CustomModal>
  );
}

export default OptionsModal;
