import { CompositeNavigationProp, useNavigation, useTheme } from '@react-navigation/native';
import isObject from 'lodash/isObject';
import React, { useState } from 'react';
import { StyleProp, TextStyle, Pressable, View, ViewStyle } from 'react-native';

import { decode } from 'html-entities';
import { Caption } from 'react-native-paper';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import FastImage, { ImageStyle, ResizeMode } from '@/components/primitives/FastImage';
import { spacing } from '@/src/styles/spacing';
import StyledText from '../styled/Text';
import BaseItem from './BaseItem';
import {
  ExploreStackParamsList,
  MainBottomStackParamsList,
  MainDrawerParamsList,
} from '@/src/navigator/types';
import { Colors } from '@/src/styles';
import { ArticleType, PostType, SocialPostReaction } from '@/utils/types';

import { NO_POST_IMAGE_URL, OpenURLButton } from '@/services/constants';
import { RootState } from '@/src/redux/reducers/rootReducer';

type ArticleItemProps = {
  item: ArticleType;
  blogPostStyle?: StyleProp<ViewStyle>;
  blogPostImageStyle?: ImageStyle;
  blogPostTitleStyle?: StyleProp<TextStyle>;
  imageSizeType: ResizeMode;
  pillText?: string;
  onPress?: (item: ArticleType) => void;
  onCommentsPress?: () => void;
  parentRefreshContent?: Function;
  onTelemetryEvent?: (eventType: string, metadata?: Record<string, unknown>) => void;
  originFeedType?: string;
};

const MEDIA_RADIUS = 12;

const areArticleItemPropsEqual = (prev: ArticleItemProps, next: ArticleItemProps) => {
  return (
    prev.item === next.item &&
    prev.blogPostStyle === next.blogPostStyle &&
    prev.blogPostImageStyle === next.blogPostImageStyle &&
    prev.blogPostTitleStyle === next.blogPostTitleStyle &&
    prev.imageSizeType === next.imageSizeType &&
    prev.pillText === next.pillText
  );
};

type ScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<ExploreStackParamsList, 'Explore'>,
  CompositeNavigationProp<
    DrawerNavigationProp<MainDrawerParamsList, 'Main'>,
    BottomTabNavigationProp<MainBottomStackParamsList, 'ExploreTab'>
  >
>;

function ArticleItem({
  item,
  blogPostStyle,
  blogPostImageStyle,
  blogPostTitleStyle,
  imageSizeType,
  pillText,
  onPress,
  onCommentsPress,
  parentRefreshContent,
  onTelemetryEvent,
  originFeedType,
}: ArticleItemProps) {
  const { colors, dark } = useTheme();
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const navigation = useNavigation<ScreenNavigationProp>();
  const [failedImageUrls, setFailedImageUrls] = useState<ReadonlySet<string>>(() => new Set());

  let myReaction: SocialPostReaction | undefined;
  item.reactions?.forEach((reaction) => {
    if (reaction.userId === user?._id) {
      myReaction = reaction;
    }
  });

  const articleId = item?.id ?? '';
  const imageUrl = item?.image?.url ?? NO_POST_IMAGE_URL;
  const displayedImageUrl = failedImageUrls.has(imageUrl) ? NO_POST_IMAGE_URL : imageUrl;
  const rssImageFrameBackgroundColor =
    imageSizeType === 'contain' ? Colors.rssContainFrame : 'transparent';
  const rssNoShadowStyle = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  };
  const handleCommentsPress =
    onCommentsPress ||
    (articleId
      ? () => {
          const rootNavigation = navigation.getParent?.()?.getParent?.()?.getParent?.() as any;
          const navigator = rootNavigation ?? (navigation as any);
          navigator?.navigate?.('SingleRss', { postId: articleId });
        }
      : undefined);

  return (
    <BaseItem
      postData={{
        title: isObject(item?.title) ? item?.title?.a.$text : item?.title,

        id: item.id,
        type: PostType.rss,
        postlink: item.link,
        image: item.image,
        commentNumber: item.commentNumber,
        repostCount: item.repostCount,
        comments: item.comments,
        reactions: item.reactions ?? [],
        myReaction,
      }}
      repostPayload={{
        sourceType: 'rss',
        sourceId: String(item.id ?? ''),
        sourcePreview: {
          title: isObject(item?.title) ? item?.title?.a.$text : item?.title,
          link: item.link,
        },
        originFeedType,
      }}
      created={item?.created}
      userData={item.userData}
      isApprovedInfluencer={item.userData.isApprovedInfluencer}
      onPress={() => {
        if (item.userData._id !== user?._id) {
          navigation.navigate('Main', {
            screen: 'HomeTab',
            params: {
              screen: 'UserProfile',
              params: {
                id: item.userData._id ?? '',
              },
            },
          });
        }
      }}
      style={[blogPostStyle, rssNoShadowStyle]}
      parentRefreshContent={parentRefreshContent}
      onCommentsPress={handleCommentsPress}
      onTelemetryEvent={onTelemetryEvent}
    >
      <Pressable
        onPress={() => {
          onTelemetryEvent?.('post_open', {
            postType: 'rss',
          });
          if (item?.link) OpenURLButton(item?.link);
          if (onPress) onPress(item);
        }}
      >
        {pillText ? (
          <View
            style={{
              position: 'absolute',
              zIndex: 9,
              top: 10,
              left: 10,
              backgroundColor: colors.primary,
              padding: 5,
              borderRadius: 5,
            }}
          >
            <Caption style={{ color: 'white' }}>{pillText}</Caption>
          </View>
        ) : null}

        <View
          style={{
            width: '100%',
            aspectRatio: 16 / 9,
            borderRadius: MEDIA_RADIUS,
            overflow: 'hidden',
            backgroundColor: rssImageFrameBackgroundColor,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FastImage
            style={
              blogPostImageStyle
                ? [{ width: '100%', height: '100%' }, blogPostImageStyle]
                : { width: '100%', height: '100%' }
            }
            resizeMode="cover"
            source={{ uri: displayedImageUrl }}
            onError={() => {
              setFailedImageUrls((current) => {
                if (current.has(imageUrl)) {
                  return current;
                }
                const next = new Set(current);
                next.add(imageUrl);
                return next;
              });
            }}
          />
        </View>

        <View
          style={{
            paddingHorizontal: spacing.x10,
            paddingVertical: spacing.x5,
            borderBottomEndRadius: MEDIA_RADIUS,
            borderBottomStartRadius: MEDIA_RADIUS,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              flexGrow: 1,
              justifyContent: 'space-between',
            }}
          >
            <View
              style={{
                flex: 1,
              }}
            >
              <StyledText
                numberOfLines={2}
                style={[
                  {
                    color: dark ? '#f6f6f6' : '#032F3C',
                    fontFamily: 'OpenSans-Bold',
                    fontSize: 16,
                  },
                  blogPostTitleStyle,
                ]}
              >
                {isObject(item?.title) ? decode(item?.title?.a.$text) : decode(item?.title)}
              </StyledText>
              {item?.description ? (
                <StyledText
                  numberOfLines={2}
                  style={{ color: Colors.neutral['500'], marginTop: 2 }}
                >
                  {item.description}
                </StyledText>
              ) : null}
            </View>
            {/* <View style={{ flex: 0, justifyContent: 'center' }}>
              <Pressable
                onPress={() => {
                  showModal(item);
                }}
              >
                <Entypo
                  name="dots-three-horizontal"
                  style={[{ textAlign: 'right' }]}
                  size={iconSize ?? 25}
                  color={'#70747D'}
                />
              </Pressable>
            </View> */}
          </View>
        </View>
      </Pressable>
    </BaseItem>
  );
}
export default React.memo(ArticleItem, areArticleItemPropsEqual);

// <Pressable
//   onPress={() => {
//     OpenURLButton(itemData?.link);
//   }}
// >
//   <View style={styles.blogpostview}>
//     <Image
//       style={styles.blogpostimage}
//       resizeMode="contain"
//       source={{ uri: itemData?.image?.url }}
//     />
//     <Text numberOfLines={2} style={styles.blogpostpara}>
//       {isObject(itemData?.title) ? itemData?.title?.a.$text : itemData?.title}
//     </Text>

//     <Text style={styles.blogposthour}>{timeSince(itemData?.created)} ago</Text>
//   </View>
// </Pressable>
