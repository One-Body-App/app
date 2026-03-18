import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { CompositeNavigationProp, useNavigation, useTheme } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import ImageView from 'react-native-image-viewing';
import { isArray } from 'lodash';
import { decode } from 'html-entities';

import { NO_POST_IMAGE_URL, NO_PROFILE_IMAGE } from '@/services/constants';
import { timeSince } from '@/utils/ResponsiveFun';
import CommentThread from '@/components/comments/Thread';
import {
  buildRepostSourceSnapshot,
  isRepostSourceSnapshotMissing,
  resolveRepostSourceSnapshot,
} from '@/services/repostSourceResolver';
import type { ResolvedRepostSourceSnapshot } from '@/services/repostSourceResolver';
import { PostType, SocialPost, SocialPostReaction } from '@/utils/types';
import {
  ExploreStackParamsList,
  MainDrawerParamsList,
  MainBottomStackParamsList,
} from '@/src/navigator/types';
import { borderWidth } from '@/src/styles/outlines';
import { Colors } from '@/src/styles';
import StyledText from '../styled/Text';
import { spacing } from '@/src/styles/spacing';
import BaseItem from './BaseItem';
import { RootState } from '@/src/redux/reducers/rootReducer';
import ImageSlider from '../imageSlider/ImageSlider';
import { ImageForSlider } from '../imageSlider/types';
import CustomVideo from '../CustomVideo';
import UniversalVideoCard from '@/src/components/video/UniversalVideoCard';
import { resolveVideoMetadata } from '@/src/components/video/universalVideoLayout';

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

const FEED_MEDIA_RADIUS = 12;
const CONTAIN_FRAME_BACKGROUND = Colors.containFrame;

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
  const title = getMetaTagContent(html, 'og:title') || getTitleTag(html) || url;
  const description =
    getMetaTagContent(html, 'og:description') || getMetaTagContent(html, 'description', 'name');
  const siteName = getMetaTagContent(html, 'og:site_name');
  const image = getMetaTagContent(html, 'og:image');

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

const toPositiveNumber = (value: unknown) => {
  let parsed: number;
  if (typeof value === 'string') {
    parsed = Number(value.trim());
  } else if (typeof value === 'number') {
    parsed = value;
  } else {
    parsed = Number(value);
  }

  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};
const getDomainName = (linkUrl: string) => {
  const domainText = linkUrl.replace('https://', '').replace('http://', '').replace('www.', '');

  const domainParts = domainText.split('/');

  if (domainParts.length > 0) {
    return domainParts[0];
  }

  return domainText;
};

const normalizeSourceIdForNavigation = (
  sourceType: ResolvedRepostSourceSnapshot['sourceType'] | 'watch',
  sourceId: string
) => {
  if (sourceType === 'rss') {
    return sourceId.trim();
  }

  const normalized = sourceId.replace(/^onebody_/, '').trim();
  return normalized || sourceId.trim();
};

type SocialItemProps = {
  visible?: boolean;
  itemData: SocialPost;
  postType?: PostType;
  socialPostviewStyle?: StyleProp<ViewStyle>;
  onCommentsPress?: () => void;
  onOpenVideoPress?: (params: {
    postId?: string;
    playBackId?: string;
    itemData: SocialPost;
    mediaUrl?: string;
    aspectRatio?: number;
    videoWidth?: number;
    videoHeight?: number;
  }) => void;
  onTelemetryEvent?: (eventType: string, metadata?: Record<string, unknown>) => void;
  onShowDismissCard?: (e?: boolean) => void;
  index?: number;
  parentRefreshContent?: Function;
  removePost?: (type: string, postId: string) => void;
  editPost?: (postId: string) => void;
  fromSavedPosts?: boolean;
  originFeedType?: string;
};

const areSocialItemPropsEqual = (prev: SocialItemProps, next: SocialItemProps) => {
  return (
    prev.itemData === next.itemData &&
    prev.visible === next.visible &&
    prev.index === next.index &&
    prev.postType === next.postType &&
    prev.fromSavedPosts === next.fromSavedPosts &&
    prev.socialPostviewStyle === next.socialPostviewStyle
  );
};

function SocialItem({
  itemData,
  postType = PostType.social,
  socialPostviewStyle,
  visible,
  index,
  onShowDismissCard,
  parentRefreshContent,
  removePost,
  editPost,
  fromSavedPosts,
  originFeedType,
  onCommentsPress,
  onOpenVideoPress,
  onTelemetryEvent,
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
  const [videoAspectByUrl, setVideoAspectByUrl] = useState<Record<string, number>>({});
  const [imageModalIndexVisible, setImageModalIndexVisible] = useState(-1);
  const [width, setWidth] = useState<number>();
  const [linkPreview, setLinkPreview] = useState<LinkPreview | null>(null);
  const [resolvedSourceSnapshot, setResolvedSourceSnapshot] =
    useState<ResolvedRepostSourceSnapshot | null>(null);
  const [inlineCommentCount, setInlineCommentCount] = useState<number>(
    itemData.commentNumber ?? itemData.comments?.length ?? 0
  );
  const [isInlineWatchCommentsVisible, setIsInlineWatchCommentsVisible] = useState(false);

  const navigation = useNavigation<ScreenNavigationProp>();
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const token = useSelector((state: RootState) => state.auth.userToken);

  const repostMeta = itemData?.repost;
  const isQuoteRepost = repostMeta?.repostType === 'quote';
  const isPlainRepost = repostMeta?.repostType === 'repost';
  const isWatchPost = postType === PostType.watch;
  const isPrimaryHomeFeed =
    originFeedType === 'connected' || originFeedType === 'forYou' || originFeedType === 'foryou';

  let profileUrl = '';
  profileUrl = itemData?.permalink || '';

  useEffect(() => {
    setIsPlaying(visible ?? false);
    if (!visible && !isMuted) setIsMuted(true);
  }, [isMuted, visible]);

  useEffect(() => {
    setInlineCommentCount(itemData.commentNumber ?? itemData.comments?.length ?? 0);
  }, [
    itemData.commentNumber,
    itemData.comments?.length,
    itemData.id,
    itemData.postId,
    itemData._id,
  ]);

  useEffect(() => {
    let isMounted = true;
    setVideoAspectByUrl({});
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
      itemData.images.forEach((attachment) => {
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
        setImageInfo((previous) =>
          photoMedia.map((item) => {
            const existing = previous.find((previousItem) => previousItem.url === item.url);
            if (existing && existing.width > 0 && existing.height > 0) {
              return existing;
            }
            return {
              url: item.url,
              width: 4,
              height: 5,
            };
          })
        );

        photoMedia.forEach((photoItem) => {
          Image.getSize(
            photoItem.url,
            (resolvedWidth, resolvedHeight) => {
              if (!isMounted || resolvedWidth <= 0 || resolvedHeight <= 0) {
                return;
              }
              setImageInfo((previous) => {
                return previous.map((imageItem) => {
                  if (imageItem.url !== photoItem.url) {
                    return imageItem;
                  }
                  return {
                    ...imageItem,
                    width: resolvedWidth,
                    height: resolvedHeight,
                  };
                });
              });
            },
            () => undefined
          );
        });
      } else {
        setImageInfo([]);
      }
    } else {
      setMedia([]);
      setImageInfo([]);
    }

    return () => {
      isMounted = false;
    };
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
      };
    }

    const cleanedText = resolvedContent.replace(extractedUrl.raw, '').replace(/\s+/g, ' ').trim();

    return {
      contentText: cleanedText,
      contentUrl: extractedUrl.normalized,
      rawContent: resolvedContent,
    };
  }, [itemData]);

  const safeContentUrl = useMemo(() => {
    if (!contentUrl || !isSafeHttpUrl(contentUrl)) return null;
    return contentUrl;
  }, [contentUrl]);

  useEffect(() => {
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
          setLinkPreview(buildLinkPreview(safeContentUrl, html));
        } catch {
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
  }, [attachmentLinkData?.url, safeContentUrl]);

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
  const primaryTextToRender = safeContentUrl ? contentText : rawContent;
  const shouldRenderPrimaryText =
    (primaryTextToRender ?? '').length > 0 && (!repostMeta || isQuoteRepost);
  const shouldRenderLinkPreview = hasLink && linkCardData && !isPlainRepost;

  const sourceSnapshotSeed = useMemo(() => buildRepostSourceSnapshot(repostMeta), [repostMeta]);

  useEffect(() => {
    let isActive = true;

    if (!repostMeta) {
      setResolvedSourceSnapshot(null);
      return () => {
        isActive = false;
      };
    }

    setResolvedSourceSnapshot(sourceSnapshotSeed);

    if (!isRepostSourceSnapshotMissing(repostMeta)) {
      return () => {
        isActive = false;
      };
    }

    const hydrateSourceSnapshot = async () => {
      const resolvedSnapshot = await resolveRepostSourceSnapshot(repostMeta, token ?? true);
      if (isActive && resolvedSnapshot) {
        setResolvedSourceSnapshot(resolvedSnapshot);
      }
    };

    hydrateSourceSnapshot();

    return () => {
      isActive = false;
    };
  }, [repostMeta, sourceSnapshotSeed, token]);

  const sourceSnapshot = resolvedSourceSnapshot ?? sourceSnapshotSeed;

  const sourceTimestampLabel = useMemo(() => {
    if (!sourceSnapshot?.sourceCreatedAt) {
      return '';
    }

    const sourceCreatedDate = new Date(sourceSnapshot.sourceCreatedAt);
    if (Number.isNaN(sourceCreatedDate.getTime())) {
      return '';
    }

    return `${timeSince(sourceCreatedDate)} ago`;
  }, [sourceSnapshot?.sourceCreatedAt]);

  const sourceMetaLine = useMemo(() => {
    if (!sourceSnapshot) {
      return '';
    }

    const sourceUsername = sourceSnapshot.sourceAuthorUsername
      ? `@${sourceSnapshot.sourceAuthorUsername.replace(/^@/, '')}`
      : '';

    return [sourceUsername, sourceTimestampLabel].filter((value) => value.length > 0).join(' • ');
  }, [sourceSnapshot, sourceTimestampLabel]);

  const sourceLink = sourceSnapshot?.sourceLink?.trim() ?? '';
  const sourceDomain = sourceLink ? getDomainName(sourceLink) : '';
  const sourceTitle = sourceSnapshot?.sourceTitle?.trim() ?? '';
  const sourceDescription = sourceSnapshot?.sourceDescription?.trim() ?? '';
  const sourceContent =
    sourceSnapshot?.sourceContent?.trim() ?? sourceSnapshot?.sourceContentSnippet?.trim() ?? '';
  const sourceMediaType = sourceSnapshot?.sourceMediaType?.toLowerCase() ?? '';
  const sourceMediaUrl = sourceSnapshot?.sourceMediaUrl?.trim() ?? '';

  const sourceImageUrls = useMemo(() => {
    if (!sourceSnapshot) {
      return [] as string[];
    }

    const urls = [...sourceSnapshot.sourceImages];

    if (sourceSnapshot.sourceImage && !urls.includes(sourceSnapshot.sourceImage)) {
      urls.unshift(sourceSnapshot.sourceImage);
    }

    if (sourceMediaUrl && !sourceMediaType.startsWith('video') && !urls.includes(sourceMediaUrl)) {
      urls.push(sourceMediaUrl);
    }

    return Array.from(
      new Set(urls.map((value) => value.trim()).filter((value) => value.length > 0))
    );
  }, [sourceMediaType, sourceMediaUrl, sourceSnapshot]);

  const sourceVideoUrls = useMemo(() => {
    if (!sourceSnapshot) {
      return [] as string[];
    }

    const urls = [...sourceSnapshot.sourceVideos];

    if (sourceMediaUrl && sourceMediaType.startsWith('video') && !urls.includes(sourceMediaUrl)) {
      urls.push(sourceMediaUrl);
    }

    return Array.from(
      new Set(urls.map((value) => value.trim()).filter((value) => value.length > 0))
    );
  }, [sourceMediaType, sourceMediaUrl, sourceSnapshot]);

  const sourceGifUrl = sourceSnapshot?.sourceGif?.url?.trim() ?? '';
  const shouldShowSourceHeader = Boolean(
    sourceSnapshot?.sourceAuthorName || sourceMetaLine || sourceSnapshot?.sourceAuthorProfileImage
  );
  const sourceIsRss = sourceSnapshot?.sourceType === 'rss';
  const hasSourceCardData = Boolean(
    sourceSnapshot &&
      (sourceContent ||
        sourceTitle ||
        sourceDescription ||
        sourceLink ||
        sourceImageUrls.length > 0 ||
        sourceVideoUrls.length > 0 ||
        sourceGifUrl)
  );

  const sourceLinkCardImage =
    sourceImageUrls[0] || sourceSnapshot?.sourceImage || sourceMediaUrl || '';

  const postId = itemData.postId ?? itemData.id ?? itemData._id;
  const { playBackId } = itemData as SocialPost & { playBackId?: string };
  const watchCommentPostId = postId ? String(postId) : '';
  const shouldInlineWatchComments =
    isWatchPost && isPrimaryHomeFeed && watchCommentPostId.length > 0;

  const openWatchPortal = useCallback(
    (mediaUrl?: string, aspectRatio?: number) => {
      if (!onOpenVideoPress || !playBackId) {
        return;
      }

      onTelemetryEvent?.('open_watch', {
        postType,
        playBackId,
      });
      onOpenVideoPress({
        postId: watchCommentPostId || undefined,
        playBackId,
        itemData,
        mediaUrl,
        aspectRatio,
        videoWidth: toPositiveNumber(itemData.videoWidth),
        videoHeight: toPositiveNumber(itemData.videoHeight),
      });
    },
    [itemData, onOpenVideoPress, onTelemetryEvent, playBackId, postType, watchCommentPostId]
  );

  const handleCommentsPress =
    (shouldInlineWatchComments
      ? () => {
          setIsInlineWatchCommentsVisible((previous) => !previous);
        }
      : onCommentsPress) ||
    (postId
      ? () => {
          const rootNavigation = navigation.getParent?.()?.getParent?.()?.getParent?.() as any;
          const navigator = rootNavigation ?? (navigation as any);
          navigator?.navigate?.('SinglePost', { postId });
        }
      : undefined);

  const handleContentPress = () => {
    if (handleCommentsPress) {
      onTelemetryEvent?.(isWatchPost ? 'open_watch' : 'open_post', {
        postType,
      });
      handleCommentsPress();
    }
  };

  const handleRepostSourcePress = useCallback(() => {
    if (!sourceSnapshot?.sourceId) {
      return;
    }

    const rootNavigation = navigation.getParent?.()?.getParent?.()?.getParent?.() as any;
    const navigator = rootNavigation ?? (navigation as any);
    if (sourceSnapshot.sourceType === 'comment') {
      const { sourceObjectType } = sourceSnapshot;
      const { sourceObjectId } = sourceSnapshot;
      const threadRootCommentId = sourceSnapshot.sourceCommentId || sourceSnapshot.sourceId;

      if (!sourceObjectType || !sourceObjectId || !threadRootCommentId) {
        return;
      }

      const targetPostId = normalizeSourceIdForNavigation(sourceObjectType, sourceObjectId);
      const targetCommentId = normalizeSourceIdForNavigation('comment', threadRootCommentId);

      if (!targetPostId || !targetCommentId) {
        return;
      }

      if (sourceObjectType === 'prayer') {
        navigator?.navigate?.('PrayerWall', {
          screen: 'Single',
          params: {
            postId: targetPostId,
            threadRootCommentId: targetCommentId,
          },
        });
        return;
      }

      if (sourceObjectType === 'rss' || sourceObjectType === 'watch') {
        navigator?.navigate?.('SingleRss', {
          postId: targetPostId,
          postType: sourceObjectType === 'watch' ? PostType.watch : PostType.rss,
          threadRootCommentId: targetCommentId,
        });
        return;
      }

      navigator?.navigate?.('SinglePost', {
        postId: targetPostId,
        threadRootCommentId: targetCommentId,
      });
      return;
    }

    const targetPostId = normalizeSourceIdForNavigation(
      sourceSnapshot.sourceType,
      sourceSnapshot.sourceId
    );
    if (!targetPostId) {
      return;
    }

    if (sourceSnapshot.sourceType === 'prayer') {
      navigator?.navigate?.('PrayerWall', {
        screen: 'Single',
        params: { postId: targetPostId },
      });
      return;
    }

    if (sourceSnapshot.sourceType === 'rss') {
      navigator?.navigate?.('SingleRss', { postId: targetPostId });
      return;
    }

    navigator?.navigate?.('SinglePost', { postId: targetPostId });
  }, [navigation, sourceSnapshot]);

  const handleRepostSourceOpen = () => {
    if (!sourceSnapshot?.sourceId) {
      return;
    }

    onTelemetryEvent?.('open_post', {
      postType:
        sourceSnapshot.sourceType === 'comment'
          ? sourceSnapshot.sourceObjectType || sourceSnapshot.sourceType
          : sourceSnapshot.sourceType,
    });
    handleRepostSourcePress();
  };

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

  return (
    <>
      <BaseItem
        removePost={removePost}
        editPost={editPost}
        edited={itemData.edited}
        updated={itemData.updated}
        fromSavedPosts={fromSavedPosts}
        postData={{
          title: itemData?.title,
          id: itemData.postId ?? itemData.id ?? itemData._id,
          type: postType,
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
          commentNumber: inlineCommentCount,
          repostCount: itemData.repostCount,
        }}
        repostPayload={
          isWatchPost
            ? undefined
            : {
                sourceType: 'social',
                sourceId: String(itemData.postId ?? itemData.id ?? itemData._id ?? ''),
                sourcePreview: {
                  title: itemData.title,
                  content: itemData.content,
                  link: itemData.link || itemData.permalink,
                },
                originFeedType,
              }
        }
        parentRefreshContent={parentRefreshContent}
        created={itemData?.created}
        source={itemData.source}
        userData={itemData.userData}
        isApprovedInfluencer={itemData.userData?.isApprovedInfluencer ?? false}
        onShowDismissCard={onShowDismissCard}
        index={index}
        onCommentsPress={handleCommentsPress}
        onTelemetryEvent={onTelemetryEvent}
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
          {shouldRenderPrimaryText ? (
            <Pressable onPress={handleContentPress} style={{ flexGrow: 1 }}>
              <StyledText
                style={{
                  color: colors.text,
                  marginBottom: spacing.x8,
                  flexGrow: 1,
                }}
              >
                {primaryTextToRender}
              </StyledText>
            </Pressable>
          ) : null}

          {repostMeta && hasSourceCardData ? (
            <View style={{ marginBottom: spacing.x10 }}>
              <Pressable
                onPress={handleRepostSourceOpen}
                style={{
                  borderRadius: FEED_MEDIA_RADIUS,
                  borderColor: 'rgba(3, 47, 60, 0.15)',
                  borderWidth: borderWidth.thin,
                  backgroundColor: 'transparent',
                  overflow: 'hidden',
                }}
              >
                <View style={{ padding: spacing.x10 }}>
                  {shouldShowSourceHeader ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom:
                          sourceContent ||
                          sourceTitle ||
                          sourceDescription ||
                          sourceImageUrls.length > 0 ||
                          sourceVideoUrls.length > 0 ||
                          sourceGifUrl
                            ? spacing.x8
                            : 0,
                      }}
                    >
                      <Image
                        source={{
                          uri: sourceSnapshot?.sourceAuthorProfileImage || NO_PROFILE_IMAGE,
                        }}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 17,
                          marginRight: spacing.x8,
                          backgroundColor: Colors.neutral[700],
                        }}
                      />

                      <View style={{ flex: 1 }}>
                        {sourceSnapshot?.sourceAuthorName ? (
                          <StyledText
                            numberOfLines={1}
                            style={{ color: colors.text, fontWeight: '700' }}
                          >
                            {sourceSnapshot.sourceAuthorName}
                          </StyledText>
                        ) : null}

                        {sourceMetaLine ? (
                          <StyledText
                            numberOfLines={1}
                            style={{
                              color: Colors.neutral[400],
                              marginTop: 1,
                            }}
                          >
                            {sourceMetaLine}
                          </StyledText>
                        ) : null}
                      </View>
                    </View>
                  ) : null}

                  {sourceIsRss ? (
                    <>
                      {sourceLinkCardImage ? (
                        <FastImage
                          style={{
                            width: '100%',
                            aspectRatio: 16 / 9,
                            borderRadius: FEED_MEDIA_RADIUS,
                            marginBottom: spacing.x8,
                          }}
                          resizeMode="cover"
                          source={{ uri: sourceLinkCardImage }}
                        />
                      ) : null}

                      {sourceDomain ? (
                        <StyledText
                          numberOfLines={1}
                          style={{
                            color: Colors.neutral[400],
                            fontSize: 11,
                            letterSpacing: 0.6,
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            marginBottom: 2,
                          }}
                        >
                          {sourceDomain}
                        </StyledText>
                      ) : null}

                      {sourceTitle ? (
                        <StyledText
                          numberOfLines={3}
                          style={{ color: colors.text, fontWeight: '700' }}
                        >
                          {decode(sourceTitle)}
                        </StyledText>
                      ) : null}

                      {sourceDescription ? (
                        <StyledText numberOfLines={3} style={{ color: Colors.neutral[400] }}>
                          {decode(sourceDescription)}
                        </StyledText>
                      ) : null}
                    </>
                  ) : (
                    <>
                      {sourceContent ? (
                        <StyledText
                          style={{
                            color: colors.text,
                            marginBottom:
                              sourceImageUrls.length > 0 ||
                              sourceVideoUrls.length > 0 ||
                              sourceGifUrl ||
                              sourceLink
                                ? spacing.x8
                                : 0,
                          }}
                        >
                          {sourceContent}
                        </StyledText>
                      ) : null}

                      {sourceImageUrls.map((url) => (
                        <FastImage
                          key={url}
                          style={{
                            width: '100%',
                            aspectRatio: 16 / 9,
                            borderRadius: FEED_MEDIA_RADIUS,
                            marginBottom: spacing.x8,
                          }}
                          resizeMode="cover"
                          source={{ uri: url }}
                        />
                      ))}

                      {sourceVideoUrls.map((videoUrl) => (
                        <View
                          key={videoUrl}
                          style={{
                            marginBottom: spacing.x8,
                            borderRadius: FEED_MEDIA_RADIUS,
                            overflow: 'hidden',
                          }}
                        >
                          <CustomVideo
                            source={{ uri: videoUrl }}
                            style={{
                              width: '100%',
                              aspectRatio: 16 / 9,
                            }}
                            controls={false}
                            resizeMode="contain"
                            paused
                            muted
                            repeat
                          />
                        </View>
                      ))}

                      {sourceGifUrl ? (
                        <FastImage
                          style={{
                            width: '100%',
                            aspectRatio: 16 / 9,
                            borderRadius: FEED_MEDIA_RADIUS,
                            marginBottom: spacing.x8,
                          }}
                          resizeMode="cover"
                          source={{ uri: sourceGifUrl }}
                        />
                      ) : null}

                      {sourceLink ? (
                        <View
                          style={{
                            borderRadius: FEED_MEDIA_RADIUS,
                            borderWidth: borderWidth.thin,
                            borderColor: colors.border,
                            backgroundColor: colors.card,
                            overflow: 'hidden',
                          }}
                        >
                          {sourceLinkCardImage ? (
                            <FastImage
                              style={{
                                width: '100%',
                                aspectRatio: 16 / 9,
                                borderRadius: FEED_MEDIA_RADIUS,
                              }}
                              resizeMode="cover"
                              source={{ uri: sourceLinkCardImage }}
                            />
                          ) : null}

                          <View style={{ padding: spacing.x8 }}>
                            {sourceDomain ? (
                              <StyledText
                                numberOfLines={1}
                                style={{
                                  color: Colors.neutral[400],
                                  fontSize: 11,
                                  letterSpacing: 0.6,
                                  fontWeight: '700',
                                  textTransform: 'uppercase',
                                  marginBottom: 2,
                                }}
                              >
                                {sourceDomain}
                              </StyledText>
                            ) : null}

                            {sourceTitle ? (
                              <StyledText
                                numberOfLines={2}
                                style={{ color: colors.text, fontWeight: '700' }}
                              >
                                {decode(sourceTitle)}
                              </StyledText>
                            ) : null}

                            {sourceDescription ? (
                              <StyledText numberOfLines={2} style={{ color: Colors.neutral[400] }}>
                                {decode(sourceDescription)}
                              </StyledText>
                            ) : null}
                          </View>
                        </View>
                      ) : null}
                    </>
                  )}
                </View>
              </Pressable>
            </View>
          ) : null}

          {shouldRenderLinkPreview
            ? (() => {
                const resolvedLinkCardData = linkCardData as LinkData;
                return (
                  <Pressable
                    onPress={handleContentPress}
                    style={{
                      borderRadius: FEED_MEDIA_RADIUS,
                      marginVertical: spacing.x10,
                      borderColor: colors.border,
                      borderWidth: borderWidth.thin,
                      backgroundColor: colors.card,
                      overflow: 'hidden',
                    }}
                  >
                    {resolvedLinkCardData.image?.url || NO_POST_IMAGE_URL ? (
                      <View
                        style={{
                          width: '100%',
                          aspectRatio: 16 / 9,
                          backgroundColor: CONTAIN_FRAME_BACKGROUND,
                          borderTopLeftRadius: FEED_MEDIA_RADIUS,
                          borderTopRightRadius: FEED_MEDIA_RADIUS,
                          overflow: 'hidden',
                        }}
                      >
                        <FastImage
                          style={{
                            width: '100%',
                            height: '100%',
                          }}
                          resizeMode="cover"
                          source={{ uri: resolvedLinkCardData.image?.url ?? NO_POST_IMAGE_URL }}
                        />
                      </View>
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
                      {resolvedLinkCardData.title ? (
                        <StyledText numberOfLines={2} style={{ fontWeight: '700' }}>
                          {resolvedLinkCardData.title}
                        </StyledText>
                      ) : null}
                      {resolvedLinkCardData.description ? (
                        <StyledText numberOfLines={2}>
                          {resolvedLinkCardData.description}
                        </StyledText>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })()
            : null}

          {media.length > 0 &&
            media.map((mediaItem, mediaIndex) => {
              const mediaType = (mediaItem.type ?? '').toLowerCase();
              const isVideoMedia = mediaType === 'video' || mediaType.startsWith('video/');
              if (isVideoMedia) {
                const runtimeVideoAspect = videoAspectByUrl[mediaItem.url];
                const resolvedMetadata = resolveVideoMetadata({
                  aspect_ratio: itemData.aspect_ratio,
                  aspectRatio: runtimeVideoAspect ?? itemData.aspectRatio,
                  videoWidth: itemData.videoWidth,
                  videoHeight: itemData.videoHeight,
                });

                return (
                  <View
                    key={`${mediaItem.type}-${mediaItem.url ?? `video-${mediaIndex}`}`}
                    style={{ marginVertical: spacing.x10 }}
                  >
                    <UniversalVideoCard
                      context="feed"
                      sourceUri={mediaItem.url}
                      metadata={{
                        aspect_ratio: itemData.aspect_ratio,
                        aspectRatio: runtimeVideoAspect ?? itemData.aspectRatio,
                        videoWidth: itemData.videoWidth,
                        videoHeight: itemData.videoHeight,
                      }}
                      containerWidth={width ?? 1}
                      controls={false}
                      paused={!isPlaying}
                      muted={isMuted}
                      repeat
                      borderRadius={FEED_MEDIA_RADIUS}
                      onPress={() => {
                        if (isWatchPost && playBackId && onOpenVideoPress) {
                          openWatchPortal(mediaItem.url, resolvedMetadata.aspectRatio);
                          return;
                        }
                        handleContentPress();
                      }}
                      onExpandPress={
                        isWatchPost && playBackId && onOpenVideoPress
                          ? () => openWatchPortal(mediaItem.url, resolvedMetadata.aspectRatio)
                          : undefined
                      }
                      showExpandButton={Boolean(isWatchPost && playBackId && onOpenVideoPress)}
                      onLoad={(loadData: any) => {
                        const naturalWidth = Number(loadData?.naturalSize?.width);
                        const naturalHeight = Number(loadData?.naturalSize?.height);
                        if (
                          !naturalWidth ||
                          !naturalHeight ||
                          naturalWidth <= 0 ||
                          naturalHeight <= 0
                        ) {
                          return;
                        }
                        const naturalRatio = naturalWidth / naturalHeight;
                        setVideoAspectByUrl((previous) => {
                          if (previous[mediaItem.url] === naturalRatio) {
                            return previous;
                          }
                          return {
                            ...previous,
                            [mediaItem.url]: naturalRatio,
                          };
                        });
                      }}
                      onEnd={() => {
                        if (!isPlaying) {
                          setIsPlaying(true);
                        }
                        setIsMuted(true);
                      }}
                    />
                  </View>
                );
              }

              return null;
            })}

          {images.length > 0 ? (
            <>
              {imageModalIndexVisible > -1 ? (
                <ImageView
                  images={images.map((item) => ({ uri: item.url }))}
                  presentationStyle="overFullScreen"
                  imageIndex={imageModalIndexVisible}
                  visible
                  onRequestClose={() => {
                    setImageModalIndexVisible(-1);
                  }}
                />
              ) : null}

              <ImageSlider
                width={width ?? 0}
                images={images}
                minAspectRatio={isPrimaryHomeFeed ? 9 / 16 : undefined}
                maxAspectRatio={isPrimaryHomeFeed ? 1 : undefined}
                multiImageHeightMode={isPrimaryHomeFeed ? 'animated' : 'fixed'}
                imageResizeMode={isPrimaryHomeFeed ? 'cover' : 'contain'}
                frameBackgroundColor={isPrimaryHomeFeed ? 'transparent' : Colors.containFrame}
                setImageModalIndexVisible={(selectedIndex) => {
                  if (selectedIndex > -1) {
                    onTelemetryEvent?.('media_open', {
                      mediaType: 'image',
                    });
                  }
                  if (handleCommentsPress) {
                    handleCommentsPress();
                    return;
                  }
                  setImageModalIndexVisible(selectedIndex);
                }}
              />
            </>
          ) : null}
        </View>
      </BaseItem>

      {shouldInlineWatchComments && isInlineWatchCommentsVisible ? (
        <View
          style={{
            marginTop: -spacing.x10,
            marginBottom: spacing.x16,
            marginHorizontal: spacing.x16,
            borderWidth: borderWidth.thin,
            borderTopWidth: 0,
            borderColor: colors.border,
            borderBottomLeftRadius: FEED_MEDIA_RADIUS,
            borderBottomRightRadius: FEED_MEDIA_RADIUS,
            backgroundColor: colors.card,
            overflow: 'hidden',
          }}
        >
          <CommentThread
            postId={watchCommentPostId}
            type={PostType.watch}
            enablePagination
            onCommentPublished={() => {
              setInlineCommentCount((previous) => previous + 1);
            }}
            contentContainerStyle={{ paddingBottom: spacing.x16 }}
            listStyle={{ maxHeight: 420 }}
          />
        </View>
      ) : null}
    </>
  );
}

export default React.memo(SocialItem, areSocialItemPropsEqual);
