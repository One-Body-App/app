import { CompositeNavigationProp, useNavigation, useTheme } from '@react-navigation/native';
import { isObject } from 'lodash';
import React, { useEffect, useState } from 'react';
import { StyleProp, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import FastImage, { ImageStyle, ResizeMode } from 'react-native-fast-image';

import { decode } from 'html-entities';
import { Caption } from 'react-native-paper';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import styles from './style';
import { spacing } from '@/src/styles/spacing';
import StyledText from '../styled/Text';
import BaseItem from './BaseItem';
import {
  ExploreStackParamsList,
  MainBottomStackParamsList,
  MainDrawerParamsList,
} from '@/src/navigator/types';
import { borderRadius } from '@/src/styles/outlines';
import { ArticleType, PostType, SocialPostReaction } from '@/utils/types';

import { NO_POST_IMAGE_URL, OpenURLButton } from '@/services/constants';
import { RootState } from '@/src/redux/reducers/rootReducer';

type ScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<ExploreStackParamsList, 'Explore'>,
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
  showModal,
  iconSize,
  hideProfileName,
  pillText,
  onPress,
  onCommentsPress,
  parentRefreshContent,
}: {
  item: ArticleType;
  blogPostStyle?: StyleProp<ViewStyle>;
  blogPostImageStyle?: ImageStyle;
  blogPostTitleStyle?: StyleProp<TextStyle>;
  imageSizeType: ResizeMode;
  iconSize?: number;
  showModal: (item: ArticleType) => void;
  hideProfileName?: boolean;
  pillText?: string;
  onPress?: (item: ArticleType) => void;
  onCommentsPress?: () => void;
  parentRefreshContent?: Function;
}) {
  const { colors } = useTheme();
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const navigation = useNavigation<ScreenNavigationProp>();
  const [itemData, setItemData] = useState(item);

  useEffect(() => {
    setItemData(item);
  }, [item]);
  let myReaction: SocialPostReaction | undefined;
  item.reactions?.forEach((reaction) => {
    if (reaction.userId === user?._id) {
      myReaction = reaction;
    }
  });

  const articleId = itemData?.id ?? '';
  const rssImageShadowStyle = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
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
        title: isObject(itemData?.title) ? itemData?.title?.a.$text : itemData?.title,

        id: item.id,
        type: PostType.rss,
        postlink: item.link,
        image: item.image,
        commentNumber: item.commentNumber,
        comments: item.comments,
        reactions: item.reactions ?? [],
        myReaction,
      }}
      created={itemData?.created}
      userData={item.userData}
      isApprovedInfluencer={itemData.userData.isApprovedInfluencer}
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
      style={blogPostStyle}
      parentRefreshContent={parentRefreshContent}
      onCommentsPress={handleCommentsPress}
    >
      <TouchableOpacity
        onPress={() => {
          if (itemData?.link) OpenURLButton(itemData?.link);
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

        <FastImage
          style={
            blogPostImageStyle
              ? [
                  styles.blogpostimage,
                  rssImageShadowStyle,
                  {
                    borderBottomRightRadius: borderRadius.small,
                    borderBottomLeftRadius: borderRadius.small,
                  },
                  blogPostImageStyle,
                ]
              : [
                  styles.blogpostimage,
                  rssImageShadowStyle,
                  {
                    borderBottomRightRadius: borderRadius.small,
                    borderBottomLeftRadius: borderRadius.small,
                  },
                ]
          }
          resizeMode={imageSizeType}
          source={{ uri: itemData?.image?.url ?? NO_POST_IMAGE_URL }}
          onError={() => {
            // console.log('error', itemData?.image?.url, error);
            setItemData({
              ...itemData,
              image: {
                url: NO_POST_IMAGE_URL,
              },
            });
          }}
        />

        <View
          style={{
            paddingHorizontal: spacing.x10,
            paddingVertical: spacing.x5,
            borderBottomEndRadius: borderRadius.small,
            borderBottomStartRadius: borderRadius.small,
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
                style={[{ color: '#032F3C', fontWeight: '700' }, blogPostTitleStyle]}
              >
                {isObject(itemData?.title)
                  ? decode(itemData?.title?.a.$text)
                  : decode(itemData?.title)}
              </StyledText>
            </View>
            {/* <View style={{ flex: 0, justifyContent: 'center' }}>
              <TouchableOpacity
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
              </TouchableOpacity>
            </View> */}
          </View>
        </View>
      </TouchableOpacity>
    </BaseItem>
  );
}
export default ArticleItem;

// <TouchableOpacity
//   onPress={() => {
//     OpenURLButton(itemData?.link);
//   }}
// >
//   <View style={styles.blogpostview}>
//     <Image
//       style={styles.blogpostimage}
//       resizeMode="cover"
//       source={{ uri: itemData?.image?.url }}
//     />
//     <Text numberOfLines={2} style={styles.blogpostpara}>
//       {isObject(itemData?.title) ? itemData?.title?.a.$text : itemData?.title}
//     </Text>

//     <Text style={styles.blogposthour}>{timeSince(itemData?.created)} ago</Text>
//   </View>
// </TouchableOpacity>
