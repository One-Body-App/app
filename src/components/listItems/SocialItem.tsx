import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleProp,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { CompositeNavigationProp, useNavigation, useTheme } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import Video from 'react-native-video';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { EmojiItemProp } from 'react-native-reactions/lib/components/ReactionView/types';

import ImageView from 'react-native-image-viewing';
import { GiphyMediaView } from '@giphy/react-native-sdk';
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
import ImageSlider, { ImageForSlider } from '../imageSlider/ImageSlider';

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
  itemData: SocialPost;
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
  let url = '';
  if (itemData?.source == 'twitter') {
    url = `https://twitter.com/${itemData?.handler}/status/${itemData?.id}`;
  } else {
    url = itemData?.permalink || '';
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

    if (itemData?.mediaUrl) {
      media = [
        {
          type: itemData.mediaType ?? '',
          url: itemData.mediaUrl,
        },
      ];
    } else if (itemData?.attachments && itemData?.attachments.length > 0) {
      itemData.attachments.forEach((attachment) => {
        if (attachment.type == 'photo' || attachment.type == 'video') {
          media?.push({
            type: attachment.type,
            url: attachment.url,
          });
        }
      });
    } else if (isArray(itemData.images) && itemData.images && itemData.images.length > 0) {
      itemData.images?.forEach((attachment) => {
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
  }, [itemData]);

  let linkData: LinkData;
  let hasLink = false;

  if (itemData?.attachments && itemData?.attachments.length > 0) {
    itemData.attachments.forEach((attachment) => {
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

  let myReaction: SocialPostReaction | undefined;

  itemData?.reactions?.forEach((reaction) => {
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
      width: itemData.gif.data.images.original.width,
      height: itemData.gif.data.images.original.height,

      type: 'gif',
    });
  }

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
        externalLink: url,
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
      onPress={() => {
        if (itemData.userData._id != user?._id) {
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
          media.map((mediaItem, index) => {
            if (mediaItem.type === 'VIDEO') {
              return (
                <Video
                  key={`${mediaItem.type}-${index}`}
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
