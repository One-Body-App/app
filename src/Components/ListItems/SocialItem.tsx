import { getHeight, timeSince } from '@/utils/ResponsiveFun';
import React, { ReactElement, useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleProp,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import {
  CompositeNavigationProp,
  CompositeScreenProps,
  NavigationProp,
  useNavigation,
  useTheme,
} from '@react-navigation/native';
import { styles } from './style';
import { NO_POST_IMAGE_URL, NO_PROFILE_IMAGE, OpenURLButton } from '@/src/services/constants';
import FastImage from 'react-native-fast-image';

import Video from 'react-native-video';
import Twitter from '@/assets/svg/Twitter.svg';
import Instagram from '@/assets/svg/Instagram.svg';
import { AccountType, PostType, SocialPost, SocialPostReaction } from '@/utils/types';
import {
  ExploreStackParamsList,
  MainDrawerParamsList,
  MainBottomStackParamsList,
} from '@/src/navigator/types';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { StackNavigationProp } from '@react-navigation/stack';
import { borderRadius, borderWidth } from '@/src/styles/outlines';
import { StyledText } from '../styled/Text';
import { fontSize } from '@/src/styles/typography';
import { spacing } from '@/src/styles/spacing';
import { Colors, Spacing } from '@/src/styles';
import BaseItem from './BaseItem';
import { useSelector } from 'react-redux';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { useReducedMotion } from 'react-native-reanimated';
import { EmojiItemProp } from 'react-native-reactions/lib/components/ReactionView/types';
import ImageModal from '@dreamwalk-os/react-native-image-modal';
import { type GiphyMedia, GiphyMediaView } from '@giphy/react-native-sdk';

import { ApiCall } from '@/src/services/api';
import { setLoader } from '@/src/redux/actions/GeneralActions';
import { isArray } from 'lodash';
// type ScreenNavigationProp = NavigationProp<RootStackParamList, 'Home'>;
type ScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<ExploreStackParamsList, 'Explore'>,
  CompositeNavigationProp<
    DrawerNavigationProp<MainDrawerParamsList, 'Main'>,
    BottomTabNavigationProp<MainBottomStackParamsList, 'ExploreTab'>
  >
>;
type Media = { type: string; url: string };
type LinkData = {
  description?: string;
  image?: { height: string; type: string; url: string; width: string };
  siteName?: string;
  title?: string;
  url?: string;
};
type SocialItemProps = {
  currentPopupItemId?: string;
  visible?: boolean;
  item: SocialPost;
  socialPostviewStyle?: StyleProp<ViewStyle>;
  selectedEmoji?: EmojiItemProp;

  onShowDismissCard?: (e?: boolean) => void;
  isScrollEnable?: boolean;
  index?: number;
  parentRefreshContent?: Function;
  removePost: (type: string, postId: string) => void;
  editPost?: (postId: string) => void;
  fromSavedPosts?: boolean;
};
const SocialItem = ({
  item,
  socialPostviewStyle,
  visible,
  index,
  onShowDismissCard,
  parentRefreshContent,
  removePost,
  editPost,
  fromSavedPosts,
}: SocialItemProps) => {
  const { colors } = useTheme();
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [media, setMedia] = useState<Media[]>([]);

  const [imageInfo, setImageInfo] = useState<
    {
      url: string;
      height: number;
      width: number;
    }[]
  >([]);

  const [isPlaying, setIsPlaying] = useState<boolean>(visible ?? false);
  const navigation = useNavigation<ScreenNavigationProp>();
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  let url = '';
  if (item?.source == 'twitter') {
    url = `https://twitter.com/${item?.handler}/status/${item?.id}`;
  } else {
    url = item?.permalink || '';
  }

  const getDomainName = (url: string) => {
    const domainText = url.replace('https://', '').replace('http://', '').replace('www.', '');

    const domainParts = domainText.split('/');

    if (domainParts.length > 0) {
      return domainParts[0];
    }

    return domainText;
  };

  useEffect(() => {
    setIsPlaying(visible ?? false);
    if (!visible && !isMuted) setIsMuted(true);
  }, [visible]);

  useEffect(() => {
    setImageInfo([]);
    let media: Media[] = [];

    if (item?.mediaUrl) {
      media = [
        {
          type: item.mediaType ?? '',
          url: item.mediaUrl,
        },
      ];
    } else if (item.attachments && item.attachments.length > 0) {
      item.attachments.forEach((attachment) => {
        if (attachment.type == 'photo' || attachment.type == 'video') {
          media?.push({
            type: attachment.type,
            url: attachment.url,
          });
        }
      });
    } else if (isArray(item.images) && item.images && item.images.length > 0) {
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

  let linkData: LinkData;
  let hasLink = false;

  if (item.attachments && item.attachments.length > 0) {
    item.attachments.forEach((attachment) => {
      if (attachment.type == 'link') {
        hasLink = true;
        linkData = {
          description: attachment.description,
          image: attachment.image,
          siteName: attachment.siteName,
          title: attachment.title,
          url: attachment.url,
        };
      }
    });
  }

  let myReaction: SocialPostReaction | undefined = undefined;

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
        title: item?.title,
        id: item.postId ?? item.id ?? item._id,
        type: PostType.social,
        postlink: item.link,
        image: item.images && item.images.length > 0 ? { url: item.images[0] } : undefined,
        externalLink: url,
        reactions: item.reactions ?? [],
        myReaction,
        location: item.location,
        locationName: item.locationName,
        edited: item.edited,
        comments: item.comments,
        commentNumber: item.commentNumber,
      }}
      parentRefreshContent={parentRefreshContent}
      created={item?.created}
      source={item.source}
      userData={item.userData}
      isApprovedInfluencer={item.userData?.isApprovedInfluencer ?? false}
      onShowDismissCard={onShowDismissCard}
      index={index}
      onPress={() => {
        if (item.userData._id != user?._id) {
          navigation.navigate('Main', {
            screen: 'HomeTab',
            params: {
              screen: 'UserProfile',
              params: {
                id: item?.userData._id,
              },
            },
          });
        }
      }}
      style={socialPostviewStyle}
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

        {hasLink ? (
          <TouchableOpacity
            onPress={() => {
              if (linkData!.url) OpenURLButton(linkData!.url);
            }}
            style={[
              {
                borderRadius: borderRadius.small,
                marginVertical: 10,
                borderColor: '#808080',
                borderWidth: borderWidth.thin,
              },
            ]}
          >
            <FastImage
              style={{
                height: 200,
                // borderRadiusTop: 2,
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
              }}
              source={{ uri: linkData!.image?.url ?? NO_POST_IMAGE_URL }}
            />
            <View style={{ padding: 10 }}>
              {linkData!.siteName ? (
                <StyledText numberOfLines={1} style={{ color: '#979797' }}>
                  {getDomainName(linkData!.url || '')}
                </StyledText>
              ) : null}
              <StyledText numberOfLines={1} style={{ fontWeight: 'bold' }}>
                {linkData!.title}
              </StyledText>
              <StyledText numberOfLines={2}>{linkData!.description}</StyledText>
            </View>
          </TouchableOpacity>
        ) : null}

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
                  repeat={true}
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
          })}

        {imageInfo.length > 0 ? (
          <>
            {imageInfo.length > 1 ? (
              <ScrollView contentContainerStyle={{ flexGrow: 1 }} horizontal>
                {imageInfo.map((image, index) => {
                  return (
                    <View
                      style={{
                        flexGrow: 1,
                        aspectRatio: image.width / image.height,

                        padding: spacing.x10,
                      }}
                    >
                      <ImageModal
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
                        modalImageResizeMode="center"
                        source={{ uri: image?.url }}
                      />
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <ImageModal
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
                modalImageResizeMode="center"
                source={{ uri: imageInfo[0]?.url }}
              />
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
    </BaseItem>
  );
};

export default SocialItem;
