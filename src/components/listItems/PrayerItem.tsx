import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleProp,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { CompositeNavigationProp, useNavigation, useTheme } from '@react-navigation/native';
import Video from 'react-native-video';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { EmojiItemProp } from 'react-native-reactions/lib/components/ReactionView/types';

import ImageView from 'react-native-image-viewing';
import { type GiphyMedia, GiphyMediaView } from '@giphy/react-native-sdk';

import { isArray } from 'lodash';
import Modal from 'react-native-modal';
import Toast, { useToast } from 'react-native-toast-notifications';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NO_PROFILE_IMAGE } from '@/services/constants';
import { PostType, PrayerPost, SocialPostReaction } from '@/utils/types';
import {
  MainDrawerParamsList,
  MainBottomStackParamsList,
  PrayerWallStackParamsList,
} from '@/src/navigator/types';
import { borderRadius } from '@/src/styles/outlines';
import StyledText from '../styled/Text';
import { fontSize, header } from '@/src/styles/typography';
import { spacing } from '@/src/styles/spacing';
import { Colors } from '@/src/styles';
import BaseItem from './BaseItem';
import { RootState } from '@/src/redux/reducers/rootReducer';

import { ApiCall } from '@/services/api';
import Anonymous from '@/assets/svg/anonymous.svg';
import Button from '../Button';
import { button } from '@/src/styles/buttons';
import StyledTextInput from '../styled/TextInput';

type ScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<PrayerWallStackParamsList, 'index'>,
  CompositeNavigationProp<
    DrawerNavigationProp<MainDrawerParamsList, 'Main'>,
    BottomTabNavigationProp<MainBottomStackParamsList, 'ExploreTab'>
  >
>;
type Media = { type: string; url: string };
type PrayerItemProps = {
  currentPopupItemId?: string;
  visible?: boolean;
  item: PrayerPost;
  style?: StyleProp<ViewStyle>;
  selectedEmoji?: EmojiItemProp;

  onShowDismissCard?: (e?: boolean) => void;
  isScrollEnable?: boolean;
  index?: number;
  parentRefreshContent?: Function;
  fromSavedPosts?: boolean;
  removePost?: (type: string, postId: string) => void;
  editPost?: (postId: string) => void;
};
function PrayerItem({
  removePost,
  editPost,
  item,
  style,
  visible,
  index,
  onShowDismissCard,
  parentRefreshContent,
  fromSavedPosts,
}: PrayerItemProps) {
  const { colors } = useTheme();
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [media, setMedia] = useState<Media[]>([]);
  const toastRef = useRef<Toast>(null);
  const [imageModalIndexVisible, setImageModalIndexVisible] = useState(-1);
  const [imageInfo, setImageInfo] = useState<
    {
      url: string;
      height: number;
      width: number;
    }[]
  >([]);

  const [isPlaying, setIsPlaying] = useState<boolean>(visible ?? false);
  const [testinomyContent, setTestinomyContent] = useState<string>('');
  const navigation = useNavigation<ScreenNavigationProp>();
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const token = useSelector((state: RootState) => state.auth.userToken);
  const toast = useToast();

  const answeredPrayer = async () => {
    try {
      setIsLoading(true);
      const res = await ApiCall({
        route: `prayer/answered/${item.postId}`,
        verb: 'patch',
        token,
        params: {
          testimony: testinomyContent,
          reactions: [],
        },
      });

      if (res?.status == 200) {
        setShowModal(false);

        toast.show('Prayer marked as answered', {
          id: 'successMessage',
          type: 'success',
          placement: 'bottom',
        });
      }
      throw res.response;
    } catch (e: any) {
      console.log('saga error -- ', e.toString());

      toastRef.current?.show('Error updating prayer. Please try again later.', {
        type: 'danger',
        placement: 'bottom',
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    setIsPlaying(visible ?? false);
    if (!visible && !isMuted) setIsMuted(true);
  }, [visible]);

  useEffect(() => {
    setImageInfo([]);
    const media: Media[] = [];

    if (isArray(item.images) && item.images && item.images.length > 0) {
      item.images?.forEach((attachment) => {
        media.push({
          type: 'photo',
          url: attachment,
        });
      });
    }

    if (media) {
      setMedia(media);
      getMediaInfo(media);
    }
  }, [item]);

  let myReaction: SocialPostReaction | undefined;

  item.reactions?.forEach((reaction) => {
    if (reaction.userId == user?._id) {
      myReaction = reaction;
    }
  });

  const getMediaInfo = async (media: Media[]) => {
    const images = media.filter((item) => item.type == 'photo');

    if (images.length > 0) {
      const imagePromises = images.map((img) => {
        return new Promise<{ url: string; width: number; height: number } | null>(
          (resolve, reject) => {
            Image.getSize(
              img.url,
              (width, height) => {
                // successfully got image dimensions
                resolve({ url: img.url, width, height });
              },
              () => {
                // error case
                console.warn(`Error with ${img}`);
                resolve(null);
              }
            );
          }
        );
      });

      Promise.all(imagePromises)
        .then((images) => images.filter(Boolean))
        .then((images) => {
          setImageInfo(
            images.map((image) => ({
              url: image?.url ?? '',
              width: image?.width ?? 0,
              height: image?.height ?? 0,
            }))
          );
        });
    }
  };

  return (
    <BaseItem
      removePost={removePost}
      editPost={editPost}
      edited={item.edited}
      updated={item.updated}
      fromSavedPosts={fromSavedPosts}
      postData={{
        id: item.postId ?? item.id,
        type: PostType.prayer,
        image: item.images && item.images.length > 0 ? { url: item.images[0] } : undefined,
        reactions: item.reactions ?? [],
        myReaction,
        location: item.location,
        locationName: item.locationName,
        edited: item.edited,
        isPrivate: item.private,
        comments: item.comments,
        commentNumber: item.commentNumber,
      }}
      parentRefreshContent={parentRefreshContent}
      created={item?.created}
      userData={
        item.private
          ? {
              name: 'Anonymous',
              profileIcon: <Anonymous color={Colors.main.black} />,
            }
          : {
              ...item.userData,
              profileImage:
                item?.userData?.profileImage && item?.userData?.profileImage !== ''
                  ? item?.userData?.profileImage
                  : NO_PROFILE_IMAGE,
            }
      }
      isApprovedInfluencer={item.userData?.isApprovedInfluencer ?? false}
      onShowDismissCard={onShowDismissCard}
      index={index}
      onPress={() => {
        if (!item.private && item?.userData._id && item.userData._id != user?._id) {
          navigation.navigate('UserProfile', {
            id: item?.userData._id,
          });
        }
      }}
      style={style}
    >
      <View style={{ flexGrow: 1 }}>
        {item?.content && (
          <View style={{ flexGrow: 1 }}>
            <StyledText
              style={{
                color: colors.text,
                marginBottom: spacing.x8,
                flexGrow: 1,
              }}
            >
              {item?.content}
            </StyledText>
          </View>
        )}

        {media.length > 0 &&
          media.map((mediaItem) => {
            if (mediaItem.type == 'VIDEO') {
              return (
                <Video
                  ignoreSilentSwitch="ignore"
                  source={{
                    uri: mediaItem.url,
                  }}
                  style={{ height: 300, borderRadius: borderRadius.small, marginVertical: 10 }}
                  controls={false}
                  resizeMode="cover"
                  paused={!isPlaying}
                  muted={isMuted}
                  repeat
                  onTouchEnd={() => {
                    if (!isPlaying) {
                      setIsPlaying(true);
                    }
                    setIsMuted(!isMuted);
                  }}
                  // hideShutterView={true}
                />
              );
            }

            return null;
          })}

        {imageInfo.length > 0 ? (
          <>
            <ImageView
              images={imageInfo.map((item) => ({
                uri: item.url,
              }))}
              presentationStyle="overFullScreen"
              imageIndex={imageModalIndexVisible}
              visible={imageModalIndexVisible > -1}
              onRequestClose={() => {
                setImageModalIndexVisible(-1);
              }}
            />
            {imageInfo.length > 1 ? (
              <ScrollView contentContainerStyle={{ flexGrow: 1 }} horizontal>
                {imageInfo.map((image, index) => {
                  return (
                    <TouchableOpacity
                      key={`${index}`}
                      style={{
                        flexGrow: 1,

                        padding: spacing.x10,
                      }}
                      onPress={() => {
                        setImageModalIndexVisible(index);
                      }}
                    >
                      <Image
                        key={index}
                        resizeMode={image.width > image.height ? 'contain' : 'stretch'}
                        style={{
                          borderRadius: borderRadius.small,
                          flexGrow: 1,
                          aspectRatio: image.width / image.height,
                          width: 250,
                          // height: 300,
                          // borderRadius: 2,
                          // marginVertical: 10,
                        }}
                        source={{ uri: image?.url }}
                      />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <TouchableOpacity
                key={`${index}`}
                style={{
                  flexGrow: 1,

                  padding: spacing.x10,
                }}
                onPress={() => {
                  setImageModalIndexVisible(0);
                }}
              >
                <Image
                  key={index}
                  resizeMode={imageInfo[0].width > imageInfo[0].height ? 'contain' : 'stretch'}
                  style={{
                    borderRadius: borderRadius.small,
                    // flexGrow: 1,
                    aspectRatio: imageInfo[0].width / imageInfo[0].height,
                    width: '100%',
                    // height: 300,
                    // borderRadius: 2,
                    // marginVertical: 10,
                  }}
                  source={{ uri: imageInfo[0]?.url }}
                />
              </TouchableOpacity>
            )}
          </>
        ) : null}
        {item.gif && (
          <View
            style={{
              padding: 10,
              // height: 100,
              // width: 100,
              borderRadius: borderRadius.small,
            }}
          >
            <GiphyMediaView
              media={item.gif}
              resizeMode="cover"
              style={{
                aspectRatio: item.gif.aspectRatio,
                borderRadius: borderRadius.small,

                overflow: 'hidden',
              }}
            />
          </View>
        )}
      </View>

      {item?.userData?._id == user?._id && !item.answered ? (
        <View
          style={{
            // paddingHorizontal: spacing.x10,
            alignItems: 'flex-end',
            justifyContent: 'center',
            marginTop: spacing.x10,
          }}
        >
          <Button
            text="Mark prayer as answered"
            onPress={() => {
              setShowModal(true);
            }}
            btnStyle={{
              ...button.primary,
              paddingHorizontal: spacing.x16,
              paddingVertical: spacing.x8,
            }}
            btnTextStyle={{ color: 'white' }}
          />
        </View>
      ) : null}

      {item.answered && item.testimony ? (
        <View
          style={{
            backgroundColor: Colors.neutral[700],
            padding: spacing.x16,
            marginVertical: spacing.x10,
            borderRadius: borderRadius.small,
          }}
        >
          <StyledText style={header.h4}>Prayer Answered</StyledText>
          <StyledText style={{ marginTop: spacing.x5, color: Colors.neutral[200] }}>
            {item.testimony.content}
          </StyledText>
        </View>
      ) : null}

      <Modal
        isVisible={showModal}
        onBackdropPress={() => setShowModal(false)}
        onSwipeComplete={() => setShowModal(false)}
        swipeDirection={['down']}
        propagateSwipe
        avoidKeyboard
      >
        <View
          style={{
            backgroundColor: colors.background,
            padding: spacing.x20,
            borderRadius: borderRadius.base,
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <View
              style={{
                flexGrow: 1,
                flexDirection: 'row',
              }}
            >
              <View style={{ flexGrow: 1 }} />
              <StyledText style={[header.h3, { flexGrow: 1 }]}>Answered Prayer</StyledText>
              <TouchableOpacity
                onPress={() => {
                  // setModalVisible(false);
                  setShowModal(false);
                }}
                style={{
                  alignSelf: 'center',

                  // justifyContent: 'flex-end',
                  // alignItems: 'flex-end',
                }}
              >
                <MaterialCommunityIcons
                  name="window-close"
                  size={18}
                  color={Colors.primary.brand}
                />
              </TouchableOpacity>
            </View>
            <StyledText style={[fontSize.x3, { marginTop: spacing.x16 }]}>
              Share what the Lord has done!
            </StyledText>
            <StyledText
              style={{ textAlign: 'center', marginTop: spacing.x10, color: Colors.neutral[300] }}
            >
              This will be public on Testimonies and your prayer will automatically be marked as
              answered.
            </StyledText>
          </View>

          <StyledTextInput
            label="Testify"
            multiline
            showCharCounter
            maxLength={150}
            enforceMaxLength
            value={testinomyContent}
            placeholder="Write something"
            inputStyle={{
              flexGrow: 1,
              height: 100,
              marginVertical: 10,
              color: colors.text,
              textAlignVertical: 'top',
            }}
            wrapperStyle={{ marginVertical: spacing.x10 }}
            onChangeText={(content) => {
              setTestinomyContent(content);
            }}
            counterContainerStyle={{
              position: 'absolute',
              bottom: 10,
              right: 10,
            }}
            counterTextStyleStyle={{
              color: Colors.neutral[300],
            }}
            placeholderTextColor={Colors.neutral[300]}
          />
          <Button
            text={isLoading ? '' : 'Share Testimony'}
            content={
              isLoading ? (
                <View style={{ justifyContent: 'center' }}>
                  <ActivityIndicator
                    animating={isLoading}
                    size="small"
                    color={Colors.main.white}
                    style={{ marginRight: spacing.x10 }}
                  />
                </View>
              ) : undefined
            }
            onPress={() => {
              if (item?.userData?._id == user?._id) {
                answeredPrayer();
              }
            }}
            disabled={!testinomyContent}
            disabledBtnStyle={[
              button.primary,

              {
                flexGrow: 1,
                marginVertical: spacing.x10,
                paddingVertical: spacing.x16,
                opacity: 0.5,
              },
            ]}
            btnTextStyle={{ color: colors.text }}
            btnStyle={[
              button.primary,
              { flexGrow: 1, marginVertical: spacing.x10, paddingVertical: spacing.x16 },
            ]}
          />
        </View>
        <Toast ref={toastRef} />
      </Modal>
    </BaseItem>
  );
}

export default PrayerItem;
