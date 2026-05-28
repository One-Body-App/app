import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { CompositeNavigationProp, useNavigation, useTheme } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
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
import ParsedText from '@/components/mentions/ParsedText';
import StyledText from '../styled/Text';
import { spacing } from '@/src/styles/spacing';
import BaseItem from './BaseItem';
import { RootState } from '@/src/redux/reducers/rootReducer';
import ImageSlider from '../imageSlider/ImageSlider';
import type { ImageForSlider } from '../imageSlider/types';
import CustomVideo from '../CustomVideo';
import UniversalVideoCard from '@/src/components/video/UniversalVideoCard';
import { resolveVideoMetadata } from '@/src/components/video/universalVideoLayout';
import {
  buildImageInfoSeeds,
  buildImageViewerSources,
  buildSliderImages,
  extractRepostSourceMedia,
  extractTopLevelPostMedia,
  resolveFeedMultiImageHeightMode,
  resolveImageDimensions,
} from './socialMediaHelpers';

type ScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<ExploreStackParamsList, 'Explore'>,
  CompositeNavigationProp<
    DrawerNavigationProp<MainDrawerParamsList, 'Main'>,
    BottomTabNavigationProp<MainBottomStackParamsList, 'ExploreTab'>
  >
>;

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
const LINK_PREVIEW_TIMEOUT_MS = 5000;
const LINK_PREVIEW_MAX_BYTES = 262144;
const MAX_LINK_PREVIEW_CACHE_ENTRIES = 50;
const linkPreviewCache = new Map<string, LinkPreview>();

const touchCachedLinkPreview = (url: string, entry: LinkPreview) => {
  linkPreviewCache.delete(url);
  linkPreviewCache.set(url, entry);
};

const pruneCachedLinkPreview = () => {
  while (linkPreviewCache.size > MAX_LINK_PREVIEW_CACHE_ENTRIES) {
    const oldestKey = linkPreviewCache.keys().next().value;
    if (!oldestKey) {
      return;
    }
    linkPreviewCache.delete(oldestKey);
  }
};

const getCachedLinkPreview = (url: string) => {
  const cached = linkPreviewCache.get(url);
  if (!cached) {
    return undefined;
  }

  touchCachedLinkPreview(url, cached);
  return cached;
};

const cacheLinkPreview = (url: string, preview: LinkPreview) => {
  touchCachedLinkPreview(url, preview);
  pruneCachedLinkPreview();
};

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

const buildFallbackLinkPreview = (url: string): LinkPreview => ({
  url,
  title: url,
  siteName: undefined,
  description: undefined,
  imageUrl: undefined,
});

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

const useResolvedImageInfo = (urls: string[], enabled: boolean) => {
  const [imageInfo, setImageInfo] = useState(() => buildImageInfoSeeds(urls));

  useLayoutEffect(() => {
    let isMounted = true;

    const nextImageInfo = buildImageInfoSeeds(urls);
    if (nextImageInfo.length === 0) {
      setImageInfo([]);
      return () => {
        isMounted = false;
      };
    }

    setImageInfo((previous) => buildImageInfoSeeds(urls, previous));

    if (!enabled) {
      return () => {
        isMounted = false;
      };
    }

    nextImageInfo.forEach((imageItem) => {
      if (imageItem.width !== 4 || imageItem.height !== 5) {
        return;
      }

      resolveImageDimensions(imageItem.url).then((resolvedImage) => {
        if (!isMounted || !resolvedImage || resolvedImage.width <= 0 || resolvedImage.height <= 0) {
          return;
        }

        setImageInfo((previous) =>
          previous.map((previousItem) => {
            if (previousItem.url !== imageItem.url) {
              return previousItem;
            }

            return resolvedImage;
          })
        );
      });
    });

    return () => {
      isMounted = false;
    };
  }, [enabled, urls]);

  return imageInfo;
};

type SocialItemProps = {
  visible?: boolean;
  contentWidth?: number;
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
  onOpenImages?: (images: { uri: string }[], index: number) => void;
};

const areSocialItemPropsEqual = (prev: SocialItemProps, next: SocialItemProps) => {
  return (
    prev.itemData === next.itemData &&
    prev.contentWidth === next.contentWidth &&
    prev.visible === next.visible &&
    prev.index === next.index &&
    prev.postType === next.postType &&
    prev.fromSavedPosts === next.fromSavedPosts &&
    prev.originFeedType === next.originFeedType &&
    prev.onOpenImages === next.onOpenImages &&
    prev.socialPostviewStyle === next.socialPostviewStyle
  );
};

function SocialItem({
  itemData,
  postType = PostType.social,
  socialPostviewStyle,
  visible,
  contentWidth,
  parentRefreshContent,
  removePost,
  editPost,
  fromSavedPosts,
  originFeedType,
  onOpenImages,
  onCommentsPress,
  onOpenVideoPress,
  onTelemetryEvent,
}: SocialItemProps) {
  const { colors } = useTheme();
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(visible ?? false);
  const [videoAspectByUrl, setVideoAspectByUrl] = useState<Record<string, number>>({});
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
  const isRowVisible = visible ?? true;
  const isPrimaryHomeFeed =
    originFeedType === 'connected' || originFeedType === 'forYou' || originFeedType === 'foryou';
  const resolvedContentWidth =
    typeof contentWidth === 'number' && contentWidth > 0 ? contentWidth : (width ?? 0);
  const feedMultiImageHeightMode = resolveFeedMultiImageHeightMode(isPrimaryHomeFeed);

  let profileUrl = '';
  profileUrl = itemData?.permalink || '';

  useLayoutEffect(() => {
    setIsPlaying(isRowVisible);
    if (!isRowVisible && !isMuted) setIsMuted(true);
  }, [isMuted, isRowVisible]);

  useLayoutEffect(() => {
    setInlineCommentCount(itemData.commentNumber ?? itemData.comments?.length ?? 0);
  }, [
    itemData.commentNumber,
    itemData.comments?.length,
    itemData.id,
    itemData.postId,
    itemData._id,
  ]);

  const media = useMemo(() => extractTopLevelPostMedia(itemData), [itemData]);
  const topLevelImageUrls = useMemo(
    () => media.filter((item) => item.type === 'photo' && item.url).map((item) => item.url),
    [media]
  );
  const imageInfo = useResolvedImageInfo(topLevelImageUrls, isRowVisible);

  useLayoutEffect(() => {
    setVideoAspectByUrl({});
  }, [media, itemData.id, itemData.postId, itemData._id]);

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

  useLayoutEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    if (attachmentLinkData?.url || !safeContentUrl) {
      setLinkPreview(null);
    } else {
      const cachedPreview = getCachedLinkPreview(safeContentUrl);
      if (cachedPreview) {
        setLinkPreview(cachedPreview);
        if (!isRowVisible) {
          return () => {
            isActive = false;
            controller.abort();
          };
        }
      } else if (!isRowVisible) {
        setLinkPreview(buildFallbackLinkPreview(safeContentUrl));
        return () => {
          isActive = false;
          controller.abort();
        };
      }

      const fallbackPreview = buildFallbackLinkPreview(safeContentUrl);
      setLinkPreview(fallbackPreview);

      const loadPreview = async () => {
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, LINK_PREVIEW_TIMEOUT_MS);

        try {
          const response = await fetch(safeContentUrl, {
            method: 'GET',
            headers: {
              Accept: 'text/html,application/xhtml+xml',
              Range: `bytes=0-${LINK_PREVIEW_MAX_BYTES - 1}`,
              'User-Agent': 'Mozilla/5.0 (compatible; OneBodyApp/1.0)',
            },
            signal: controller.signal,
          });

          if (!response.ok) {
            throw new Error('Preview fetch failed');
          }

          const resolvedUrl = response.url || safeContentUrl;
          if (!isSafeHttpUrl(resolvedUrl)) {
            throw new Error('Unsafe preview redirect');
          }

          const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
          if (
            !contentType.includes('text/html') &&
            !contentType.includes('application/xhtml+xml')
          ) {
            throw new Error('Unsupported preview response type');
          }

          const contentLength = Number(response.headers.get('content-length') ?? '0');
          if (Number.isFinite(contentLength) && contentLength > LINK_PREVIEW_MAX_BYTES) {
            throw new Error('Preview response too large');
          }

          const html = (await response.text()).slice(0, LINK_PREVIEW_MAX_BYTES);
          if (!isActive) return;

          const nextPreview = buildLinkPreview(resolvedUrl, html);
          cacheLinkPreview(safeContentUrl, nextPreview);
          setLinkPreview(nextPreview);
        } catch {
          if (!isActive) return;
          cacheLinkPreview(safeContentUrl, fallbackPreview);
          setLinkPreview(fallbackPreview);
        } finally {
          clearTimeout(timeoutId);
        }
      };

      loadPreview();
    }

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [attachmentLinkData?.url, isRowVisible, safeContentUrl]);

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

  useLayoutEffect(() => {
    let isActive = true;

    if (!repostMeta) {
      setResolvedSourceSnapshot(null);
      return () => {
        isActive = false;
      };
    }

    setResolvedSourceSnapshot(sourceSnapshotSeed);

    if (!isRepostSourceSnapshotMissing(repostMeta) || !isRowVisible) {
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
  }, [isRowVisible, repostMeta, sourceSnapshotSeed, token]);

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
  const sourceMedia = useMemo(() => extractRepostSourceMedia(sourceSnapshot), [sourceSnapshot]);
  const sourceImageInfo = useResolvedImageInfo(sourceMedia.imageUrls, isRowVisible);
  const sourceSliderImages = useMemo(
    () => buildSliderImages(sourceImageInfo, sourceMedia.gif),
    [sourceImageInfo, sourceMedia.gif]
  );
  const sourceVideoUrls = sourceMedia.videoUrls;
  const sourceGifUrl = sourceMedia.gif?.url?.trim() ?? '';
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
        sourceSliderImages.length > 0 ||
        sourceVideoUrls.length > 0 ||
        sourceGifUrl)
  );
  const sourceLinkCardImage = sourceMedia.primaryImageUrl;
  const sourceCardMediaWidth = resolvedContentWidth
    ? Math.max(resolvedContentWidth - spacing.x20, 0)
    : 0;
  const handleOpenImages = useCallback(
    (viewerImages: ImageForSlider[], selectedIndex: number) => {
      if (selectedIndex < 0 || viewerImages.length < 1) {
        return;
      }

      onOpenImages?.(buildImageViewerSources(viewerImages), selectedIndex);
    },
    [onOpenImages]
  );

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

      onTelemetryEvent?.('post_open', {
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
      onTelemetryEvent?.('post_open', {
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

    onTelemetryEvent?.('post_open', {
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

  const images = useMemo(
    () => buildSliderImages(imageInfo, itemData.repost ? undefined : itemData.gif),
    [imageInfo, itemData.gif, itemData.repost]
  );

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
          onLayout={
            contentWidth
              ? undefined
              : ({ nativeEvent }) => {
                  setWidth(nativeEvent.layout.width);
                }
          }
        >
          {shouldRenderPrimaryText ? (
            <Pressable onPress={handleContentPress} style={{ flexGrow: 1 }}>
              <ParsedText
                text={primaryTextToRender}
                mentions={itemData.mentions}
                textStyle={{
                  color: colors.text,
                  marginBottom: spacing.x8,
                  flexGrow: 1,
                  fontSize: 15,
                }}
              />
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
                          sourceSliderImages.length > 0 ||
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
                            fontSize: 12,
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
                        <ParsedText
                          text={sourceContent}
                          mentions={
                            (sourceSnapshot as { mentions?: SocialPost['mentions'] } | null)
                              ?.mentions
                          }
                          textStyle={{
                            color: colors.text,
                            marginBottom:
                              sourceSliderImages.length > 0 ||
                              sourceVideoUrls.length > 0 ||
                              sourceGifUrl ||
                              sourceLink
                                ? spacing.x8
                                : 0,
                          }}
                        />
                      ) : null}

                      {sourceSliderImages.length > 0 && sourceCardMediaWidth > 0 ? (
                        <View
                          style={{
                            marginBottom:
                              sourceVideoUrls.length > 0 || sourceLink ? spacing.x16 : spacing.x8,
                          }}
                        >
                          <ImageSlider
                            width={sourceCardMediaWidth}
                            images={sourceSliderImages}
                            minAspectRatio={9 / 16}
                            maxAspectRatio={1}
                            multiImageHeightMode={feedMultiImageHeightMode}
                            imageResizeMode="cover"
                            frameBackgroundColor="transparent"
                            onImagePress={(selectedIndex) => {
                              onTelemetryEvent?.('post_media_open', {
                                mediaType: 'image',
                                sourceType: sourceSnapshot?.sourceType,
                              });
                              handleOpenImages(sourceSliderImages, selectedIndex);
                            }}
                          />
                        </View>
                      ) : null}

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
                          {sourceLinkCardImage &&
                          sourceSliderImages.length < 1 &&
                          sourceVideoUrls.length < 1 ? (
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
                                  fontSize: 12,
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
                const shouldOpenWatchPortal = Boolean(
                  isWatchPost && playBackId && onOpenVideoPress && resolvedMetadata.isNineBySixteen
                );

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
                      containerWidth={resolvedContentWidth || 1}
                      controls={false}
                      paused={!isPlaying}
                      muted={isMuted}
                      repeat
                      borderRadius={FEED_MEDIA_RADIUS}
                      onPress={() => {
                        if (shouldOpenWatchPortal) {
                          openWatchPortal(mediaItem.url, resolvedMetadata.aspectRatio);
                          return;
                        }
                        handleContentPress();
                      }}
                      onExpandPress={
                        shouldOpenWatchPortal
                          ? () => openWatchPortal(mediaItem.url, resolvedMetadata.aspectRatio)
                          : undefined
                      }
                      showExpandButton={shouldOpenWatchPortal}
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
            <ImageSlider
              width={resolvedContentWidth}
              images={images}
              minAspectRatio={isPrimaryHomeFeed ? 9 / 16 : undefined}
              maxAspectRatio={isPrimaryHomeFeed ? 1 : undefined}
              multiImageHeightMode={feedMultiImageHeightMode}
              imageResizeMode={isPrimaryHomeFeed ? 'cover' : 'contain'}
              frameBackgroundColor={isPrimaryHomeFeed ? 'transparent' : Colors.containFrame}
              setImageModalIndexVisible={(selectedIndex) => {
                if (selectedIndex > -1) {
                  onTelemetryEvent?.('post_media_open', {
                    mediaType: 'image',
                  });
                }
                handleOpenImages(images, selectedIndex);
              }}
            />
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
            onTelemetryEvent={onTelemetryEvent}
            contentContainerStyle={{ paddingBottom: spacing.x16 }}
            listStyle={{ maxHeight: 420 }}
          />
        </View>
      ) : null}
    </>
  );
}

export default React.memo(SocialItem, areSocialItemPropsEqual);
