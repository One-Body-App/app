import React, { useCallback, useEffect, useState } from 'react';
import { Image, StyleProp, TouchableOpacity, View, ViewStyle } from 'react-native';
import { CompositeNavigationProp, useNavigation, useTheme } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';

import ImageView from 'react-native-image-viewing';

import { isArray } from 'lodash';
import { NO_POST_IMAGE_URL, OpenURLButton } from '@/services/constants';

import { PostType, SocialPost, SocialPostReaction } from '@/utils/types';
import {
  ExploreStackParamsList,
  MainDrawerParamsList,
  MainBottomStackParamsList,
} from '@/src/navigator/types';
import { borderRadius, borderWidth } from '@/src/styles/outlines';
import StyledText from '../styled/Text';
import { spacing } from '@/src/styles/spacing';
import BaseItem from './BaseItem';
import { RootState } from '@/src/redux/reducers/rootReducer';
import ImageSlider from '../imageSlider/ImageSlider';
import { ImageForSlider } from '../imageSlider/types';
import CustomVideo from '../CustomVideo';

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

const toSafeNumber = (value: unknown, fallback = 1) => {
  let parsed: number;
  if (typeof value === 'string') {
    parsed = parseFloat(value);
  } else if (typeof value === 'number') {
    parsed = value;
  } else {
    parsed = Number(value);
  }
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};
type SocialItemProps = {
  visible?: boolean;
  itemData: SocialPost;
  socialPostviewStyle?: StyleProp<ViewStyle>;
  onCommentsPress?: () => void;

  onShowDismissCard?: (e?: boolean) => void;
  index?: number;
  parentRefreshContent?: Function;
  removePost: (type: string, postId: string) => void;
  editPost?: (postId: string) => void;
  fromSavedPosts?: boolean;
};
function SocialItem({
  itemData,
  socialPostviewStyle,
  visible,
  index,
  onShowDismissCard,
  parentRefreshContent,
  removePost,
  editPost,
  fromSavedPosts,
  onCommentsPress,
}: SocialItemProps) {
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
  const [imageModalIndexVisible, setImageModalIndexVisible] = useState(-1);
  const navigation = useNavigation<ScreenNavigationProp>();
  const [width, setWidth] = useState<number>();

  const user = useSelector((state: RootState) => state.auth.getProfileData);
  let profileUrl = '';
  if (itemData?.source === 'twitter') {
    profileUrl = `https://twitter.com/${itemData?.handler}/status/${itemData?.id}`;
  } else {
    profileUrl = itemData?.permalink || '';
  }

  const getDomainName = (linkUrl: string) => {
    const domainText = linkUrl.replace('https://', '').replace('http://', '').replace('www.', '');

    const domainParts = domainText.split('/');

    if (domainParts.length > 0) {
      return domainParts[0];
    }

    return domainText;
  };

  useEffect(() => {
    setIsPlaying(visible ?? false);
    if (!visible && !isMuted) setIsMuted(true);
  }, [isMuted, visible]);

  const getMediaInfo = useCallback(async (mediaItems: Media[]) => {
    const photoMedia = mediaItems.filter((item) => item.type === 'photo');

    if (photoMedia.length > 0) {
      const imagePromises = photoMedia.map((img) => {
        return new Promise<{ url: string; width: number; height: number } | null>((resolve) => {
          Image.getSize(
            img.url,
            (imgWidth, imgHeight) => {
              // successfully got image dimensions
              resolve({ url: img.url, width: imgWidth, height: imgHeight });
            },
            () => {
              // error case
              console.warn(`Error with ${img}`);
              resolve(null);
            }
          );
        });
      });

      Promise.all(imagePromises)
        .then((resolvedImages) => resolvedImages.filter(Boolean))
        .then((resolvedImages) => {
          setImageInfo(
            resolvedImages
              .map((image) => ({
                url: typeof image?.url === 'string' ? image.url : '',
                width: toSafeNumber(image?.width),
                height: toSafeNumber(image?.height),
              }))
              .filter((image) => image.url.length > 0)
          );
        });
    }
  }, []);

  useEffect(() => {
    setImageInfo([]);
    let mediaItems: Media[] = [];

    if (itemData?.mediaUrl) {
      mediaItems = [
        {
          type: itemData.mediaType ?? '',
          url: itemData.mediaUrl,
        },
      ];
    } else if (itemData?.attachments && itemData?.attachments.length > 0) {
      itemData.attachments.forEach((attachment) => {
        if (attachment.type === 'photo' || attachment.type === 'video') {
          mediaItems.push({
            type: attachment.type,
            url: attachment.url,
          });
        }
      });
    } else if (isArray(itemData.images) && itemData.images && itemData.images.length > 0) {
      itemData.images?.forEach((attachment) => {
        mediaItems.push({
          type: 'photo',
          url: attachment,
        });
      });
    }

    if (mediaItems.length > 0) {
      setMedia(mediaItems);
      getMediaInfo(mediaItems);
    } else {
      setMedia([]);
    }
  }, [getMediaInfo, itemData]);

  const linkAttachment = itemData?.attachments?.find((attachment) => attachment.type === 'link');
  const linkData: LinkData | undefined = linkAttachment
    ? {
        description: linkAttachment.description,
        image: linkAttachment.image,
        siteName: linkAttachment.siteName,
        title: linkAttachment.title,
        url: linkAttachment.url,
      }
    : undefined;

  const hasLink = Boolean(linkData);

  let myReaction: SocialPostReaction | undefined;

  itemData?.reactions?.forEach((reaction) => {
    if (reaction.userId === user?._id) {
      myReaction = reaction;
    }
  });

  const images: ImageForSlider[] = [];
  if (imageInfo && imageInfo.length > 0) {
    for (let i = 0; i < imageInfo.length; i++) {
      images.push({
        ...imageInfo[i],
        type: 'image',
      });
    }
  }

  if (itemData.gif) {
    images.push({
      url: itemData.gif.url,
      width: toSafeNumber(itemData.gif.data.images.original.width),
      height: toSafeNumber(itemData.gif.data.images.original.height),
      id: itemData.gif.id,
      gifAspectRatio: toSafeNumber(itemData.gif.aspectRatio),
      type: 'gif',
    });
  }

  const postId = itemData.postId ?? itemData.id ?? itemData._id;
  const handleCommentsPress =
    onCommentsPress ||
    (postId
      ? () => {
          const rootNavigation = navigation.getParent?.()?.getParent?.()?.getParent?.() as any;
          const navigator = rootNavigation ?? (navigation as any);
          navigator?.navigate?.('SinglePost', { postId });
        }
      : undefined);

  return (
    <BaseItem
      removePost={removePost}
      editPost={editPost}
      edited={itemData.edited}
      updated={itemData.updated}
      fromSavedPosts={fromSavedPosts}
      postData={{
        title: itemData?.title,
        id: itemData.postId ?? itemData.id ?? itemData._id,
        type: PostType.social,
        postlink: itemData.link,
        image:
          itemData.images && itemData.images.length > 0 ? { url: itemData.images[0] } : undefined,
        externalLink: profileUrl,
        reactions: itemData.reactions ?? [],
        myReaction,
        location: itemData.location,
        locationName: itemData.locationName,
        edited: itemData.edited,
        comments: itemData.comments,
        commentNumber: itemData.commentNumber,
      }}
      parentRefreshContent={parentRefreshContent}
      created={itemData?.created}
      source={itemData.source}
      userData={itemData.userData}
      isApprovedInfluencer={itemData.userData?.isApprovedInfluencer ?? false}
      onShowDismissCard={onShowDismissCard}
      index={index}
      onCommentsPress={handleCommentsPress}
      onPress={() => {
        if (itemData.userData._id !== user?._id) {
          navigation.navigate('Main', {
            screen: 'HomeTab',
            params: {
              screen: 'UserProfile',
              params: {
                id: itemData?.userData._id,
              },
            },
          });
        }
      }}
      style={socialPostviewStyle}
    >
      <View
        style={{ flexGrow: 1 }}
        onLayout={({ nativeEvent }) => {
          setWidth(nativeEvent.layout.width);
        }}
      >
        {itemData?.content && (
          <View style={{ flexGrow: 1 }}>
            <StyledText
              style={{
                color: colors.text,
                marginBottom: spacing.x8,
                flexGrow: 1,
              }}
            >
              {itemData?.content}
            </StyledText>
          </View>
        )}

        {hasLink && linkData ? (
          <TouchableOpacity
            onPress={() => {
              if (linkData.url) OpenURLButton(linkData.url);
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
              source={{ uri: linkData.image?.url ?? NO_POST_IMAGE_URL }}
            />
            <View style={{ padding: 10 }}>
              {linkData.siteName ? (
                <StyledText numberOfLines={1} style={{ color: '#979797' }}>
                  {getDomainName(linkData.url || '')}
                </StyledText>
              ) : null}
              <StyledText numberOfLines={1} style={{ fontWeight: 'bold' }}>
                {linkData.title}
              </StyledText>
              <StyledText numberOfLines={2}>{linkData.description}</StyledText>
            </View>
          </TouchableOpacity>
        ) : null}

        {media.length > 0 &&
          media.map((mediaItem, mediaIndex) => {
            if (mediaItem.type === 'VIDEO') {
              return (
                <CustomVideo
                  key={`${mediaItem.type}-${mediaItem.url ?? `video-${mediaIndex}`}`}
                  source={{
                    uri: mediaItem.url,
                  }}
                  style={{ height: 300, borderRadius: borderRadius.small, marginVertical: 10 }}
                  controls={false}
                  resizeMode="cover"
                  paused={!isPlaying}
                  muted={isMuted}
                  repeat
                  onEnd={() => {
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

        {images.length > 0 ? (
          <>
            <ImageView
              images={images.map((item) => ({
                uri: item.url,
              }))}
              presentationStyle="overFullScreen"
              imageIndex={imageModalIndexVisible}
              visible={imageModalIndexVisible > -1}
              onRequestClose={() => {
                setImageModalIndexVisible(-1);
              }}
            />

            <ImageSlider
              width={width ?? 0}
              images={images}
              setImageModalIndexVisible={(item) => {
                setImageModalIndexVisible(item);
              }}
            />
          </>
        ) : null}
      </View>
    </BaseItem>
  );
}

export default SocialItem;
