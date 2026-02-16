import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { CompositeNavigationProp, useNavigation, useTheme } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';

import ImageView from 'react-native-image-viewing';

import { isArray } from 'lodash';
import { decode } from 'html-entities';
import { NO_POST_IMAGE_URL } from '@/services/constants';

import { PostType, SocialPost, SocialPostReaction } from '@/utils/types';
import {
  ExploreStackParamsList,
  MainDrawerParamsList,
  MainBottomStackParamsList,
} from '@/src/navigator/types';
import { borderRadius, borderWidth } from '@/src/styles/outlines';
import { Colors } from '@/src/styles';
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

type LinkPreview = {
  url: string;
  title?: string;
  description?: string;
  siteName?: string;
  imageUrl?: string;
};

const URL_REGEX = /((https?:\/\/)?(www\.)?[\w.-]+\.[a-z]{2,}(?:\/[^\s]*)?)/i;
const COMMON_TLDS = ['.com', '.net', '.info', '.org', '.io'];

const stripTrailingPunctuation = (url: string) => url.replace(/[^A-Za-z0-9/?#&=._~:-]+$/g, '');

const normalizeUrl = (url: string) => {
  if (/^https?:\/\//i.test(url)) return url;
  if (url.toLowerCase().startsWith('www.')) return `https://${url}`;
  return url;
};

const findTokenWithTld = (text: string) => {
  const tokens = text.split(/\s+/).filter(Boolean);
  const matched = tokens.find((token) => {
    const cleaned = stripTrailingPunctuation(token);
    const lower = cleaned.toLowerCase();
    return COMMON_TLDS.some((tld) => lower.includes(tld));
  });
  return matched ? stripTrailingPunctuation(matched) : null;
};

const extractFirstUrl = (text?: string) => {
  if (!text) return null;
  const match = text.match(URL_REGEX);
  const rawCandidate = match?.[0] ?? findTokenWithTld(text);
  if (!rawCandidate) return null;
  const raw = stripTrailingPunctuation(rawCandidate);
  return { raw, normalized: normalizeUrl(raw) };
};

const isPrivateIp = (host: string) => {
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false;
  const parts = host.split('.').map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) return true;
  if (parts[0] === 10) return true;
  if (parts[0] === 127) return true;
  if (parts[0] === 0) return true;
  if (parts[0] === 169 && parts[1] === 254) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  return false;
};

const parseUrlParts = (url: string) => {
  const normalized = normalizeUrl(url);
  const match = normalized.match(/^(https?):\/\/([^/?#]+)(?:[/?#]|$)/i);
  if (!match) return null;
  const protocol = match[1]?.toLowerCase() ?? '';
  const hostWithPort = match[2]?.toLowerCase() ?? '';
  const host = hostWithPort.split(':')[0];
  return { protocol, host, normalized };
};

const isSafeHttpUrl = (url: string) => {
  const parts = parseUrlParts(url);
  if (!parts) return false;
  if (parts.protocol !== 'http' && parts.protocol !== 'https') return false;
  if (!parts.host || parts.host === 'localhost' || parts.host.endsWith('.local')) return false;
  if (isPrivateIp(parts.host)) return false;
  return true;
};

const getMetaTagContent = (html: string, key: string, attr: 'property' | 'name' = 'property') => {
  const regex = new RegExp(
    `<meta[^>]+${attr}=["']${key}["'][^>]*content=["']([^"']+)["'][^>]*>`,
    'i'
  );
  const match = html.match(regex);
  return match?.[1];
};

const getTitleTag = (html: string) => {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match?.[1];
};

const resolveUrl = (baseUrl: string, relative?: string) => {
  if (!relative) return undefined;
  if (/^https?:\/\//i.test(relative)) return relative;
  if (relative.startsWith('//')) {
    return `https:${relative}`;
  }
  const parts = parseUrlParts(baseUrl);
  if (!parts) return relative;
  return `${parts.protocol}://${parts.host}${relative.startsWith('/') ? '' : '/'}${relative}`;
};

const buildLinkPreview = (url: string, html: string): LinkPreview => {
  const title =
    getMetaTagContent(html, 'og:title') ||
    getMetaTagContent(html, 'twitter:title', 'name') ||
    getTitleTag(html) ||
    url;
  const description =
    getMetaTagContent(html, 'og:description') || getMetaTagContent(html, 'description', 'name');
  const siteName = getMetaTagContent(html, 'og:site_name');
  const image =
    getMetaTagContent(html, 'og:image') || getMetaTagContent(html, 'twitter:image', 'name');

  const absoluteImage = resolveUrl(url, image);

  return {
    url,
    title: title ? decode(title) : url,
    description: description ? decode(description) : undefined,
    siteName: siteName ? decode(siteName) : undefined,
    imageUrl: absoluteImage,
  };
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
  removePost?: (type: string, postId: string) => void;
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
  const [linkPreview, setLinkPreview] = useState<LinkPreview | null>(null);

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
      const photoMedia = mediaItems.filter((item) => item.type === 'photo' && item.url);
      if (photoMedia.length > 0) {
        // Keep feed row height stable while images load to prevent jumpy pagination scroll.
        setImageInfo(
          photoMedia.map((item) => ({
            url: item.url,
            width: 4,
            height: 5,
          }))
        );
      }
    } else {
      setMedia([]);
    }
  }, [itemData]);

  const linkAttachment = useMemo(
    () => itemData?.attachments?.find((attachment) => attachment.type === 'link'),
    [itemData?.attachments]
  );
  const attachmentLinkData: LinkData | undefined = useMemo(() => {
    if (!linkAttachment) return undefined;
    return {
      description: linkAttachment.description,
      image: linkAttachment.image,
      siteName: linkAttachment.siteName,
      title: linkAttachment.title,
      url: linkAttachment.url,
    };
  }, [linkAttachment]);

  const { contentText, contentUrl, rawContent } = useMemo(() => {
    const resolvedContent =
      itemData?.content ||
      (itemData as { body?: string }).body ||
      (typeof itemData?.title === 'string'
        ? itemData.title
        : (itemData?.title as { a?: { $text?: string } } | undefined)?.a?.$text) ||
      '';
    const extractedUrl = extractFirstUrl(resolvedContent);
    if (!extractedUrl) {
      return {
        contentText: resolvedContent,
        contentUrl: null,
        rawContent: resolvedContent,
        rawUrl: null,
      };
    }
    const cleanedText = resolvedContent.replace(extractedUrl.raw, '').replace(/\s+/g, ' ').trim();
    return {
      contentText: cleanedText,
      contentUrl: extractedUrl.normalized,
      rawContent: resolvedContent,
      rawUrl: extractedUrl.raw,
    };
  }, [itemData]);

  const safeContentUrl = useMemo(() => {
    if (!contentUrl || !isSafeHttpUrl(contentUrl)) return null;
    return contentUrl;
  }, [contentUrl]);

  useEffect(
    function handleLinkPreview() {
      let isActive = true;
      const controller = new AbortController();

      if (attachmentLinkData?.url || !safeContentUrl) {
        setLinkPreview(null);
      } else {
        setLinkPreview({
          url: safeContentUrl,
          title: safeContentUrl,
          siteName: undefined,
          description: undefined,
          imageUrl: undefined,
        });

        const loadPreview = async () => {
          try {
            const response = await fetch(safeContentUrl, {
              method: 'GET',
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; OneBodyApp/1.0)',
              },
              signal: controller.signal,
            });
            const html = await response.text();
            if (!isActive) return;
            const preview = buildLinkPreview(safeContentUrl, html);
            setLinkPreview(preview);
          } catch (e) {
            if (!isActive) return;
            setLinkPreview({
              url: safeContentUrl,
              title: safeContentUrl,
              siteName: undefined,
              description: undefined,
              imageUrl: undefined,
            });
          }
        };

        loadPreview();
      }

      return () => {
        isActive = false;
        controller.abort();
      };
    },
    [attachmentLinkData?.url, safeContentUrl]
  );

  const linkCardData: LinkData | null = useMemo(() => {
    if (attachmentLinkData?.url && isSafeHttpUrl(attachmentLinkData.url)) {
      return attachmentLinkData;
    }
    if (linkPreview?.url && isSafeHttpUrl(linkPreview.url)) {
      return {
        url: linkPreview.url,
        title: linkPreview.title,
        description: linkPreview.description,
        siteName: linkPreview.siteName,
        image: linkPreview.imageUrl
          ? { url: linkPreview.imageUrl, height: '0', width: '0', type: 'image' }
          : undefined,
      };
    }
    return null;
  }, [attachmentLinkData, linkPreview]);

  const linkUrl = linkCardData?.url ?? '';
  const hasLink = Boolean(linkUrl);

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
  const handleContentPress = () => {
    if (handleCommentsPress) {
      handleCommentsPress();
    }
  };

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
        {((safeContentUrl ? contentText : rawContent) ?? '').length > 0 ? (
          <Pressable onPress={handleContentPress} style={{ flexGrow: 1 }}>
            <StyledText
              style={{
                color: colors.text,
                marginBottom: spacing.x8,
                flexGrow: 1,
              }}
            >
              {safeContentUrl ? contentText : rawContent}
            </StyledText>
          </Pressable>
        ) : null}

        {hasLink && linkCardData
          ? (() => {
              return (
                <Pressable
                  onPress={handleContentPress}
                  style={{
                    borderRadius: borderRadius.base,
                    marginVertical: spacing.x10,
                    borderColor: colors.border,
                    borderWidth: borderWidth.thin,
                    backgroundColor: colors.card,
                    overflow: 'hidden',
                  }}
                >
                  {linkCardData.image?.url || NO_POST_IMAGE_URL ? (
                    <FastImage
                      style={{
                        width: '100%',
                        aspectRatio: 16 / 9,
                      }}
                      resizeMode="cover"
                      source={{ uri: linkCardData.image?.url ?? NO_POST_IMAGE_URL }}
                    />
                  ) : (
                    <View
                      style={{
                        width: '100%',
                        aspectRatio: 16 / 9,
                        backgroundColor: Colors.neutral[800],
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: spacing.x13,
                      }}
                    >
                      <StyledText numberOfLines={1} style={{ color: Colors.neutral[200] }}>
                        {linkUrl ? getDomainName(linkUrl) : ''}
                      </StyledText>
                    </View>
                  )}
                  <View style={{ padding: 10 }}>
                    {linkUrl ? (
                      <StyledText numberOfLines={1} style={{ color: Colors.neutral[400] }}>
                        {getDomainName(linkUrl)}
                      </StyledText>
                    ) : null}
                    {linkCardData.title ? (
                      <StyledText numberOfLines={2} style={{ fontWeight: '700' }}>
                        {linkCardData.title}
                      </StyledText>
                    ) : null}
                    {linkCardData.description ? (
                      <StyledText numberOfLines={2}>{linkCardData.description}</StyledText>
                    ) : null}
                  </View>
                </Pressable>
              );
            })()
          : null}

        {media.length > 0 &&
          media.map((mediaItem, mediaIndex) => {
            if (mediaItem.type === 'VIDEO') {
              return (
                <Pressable
                  key={`${mediaItem.type}-${mediaItem.url ?? `video-${mediaIndex}`}`}
                  onPress={handleContentPress}
                >
                  <CustomVideo
                    source={{
                      uri: mediaItem.url,
                    }}
                    style={{
                      width: '100%',
                      aspectRatio: 16 / 9,
                      borderRadius: borderRadius.small,
                      marginVertical: 10,
                    }}
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
                </Pressable>
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
              setImageModalIndexVisible={() => {
                if (handleCommentsPress) {
                  handleCommentsPress();
                }
              }}
            />
          </>
        ) : null}
      </View>
    </BaseItem>
  );
}

export default SocialItem;
