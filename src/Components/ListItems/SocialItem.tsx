import { getHeight, timeSince } from '@/utils/ResponsiveFun';
import React, { useEffect, useState } from 'react';
import { Dimensions, StyleProp, TouchableOpacity, View, ViewStyle } from 'react-native';
import {
  CompositeNavigationProp,
  CompositeScreenProps,
  NavigationProp,
  useNavigation,
  useTheme,
} from '@react-navigation/native';
import { styles } from './style';
import { NO_POST_IMAGE_URL, NO_PROFILE_IMAGE, OpenURLButton } from '@/src/Services/constants';
import FastImage from 'react-native-fast-image';
import { RootStackParamList } from '@/src/_Navigation/types';
import Video from 'react-native-video';
import Twitter from '@/assets/svg/Twitter.svg';
import Instagram from '@/assets/svg/Instagram.svg';
import { AccountType, PostType } from '@/utils/types';
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
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { useReducedMotion } from 'react-native-reanimated';

// type ScreenNavigationProp = NavigationProp<RootStackParamList, 'Home'>;
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
const SocialItem = ({
  item,
  socialPostviewStyle,
  visible,
}: {
  currentPopupItemId?: string;
  visible?: boolean;
  item: {
    postId?: string;
    content: string;
    date: string;
    source: 'twitter' | 'instagram';
    handler: string;
    link: string;
    title: string;
    mediaUrl?: string;
    attachments?: [
      {
        media_key: string;
        type: string;
        url: string;
        title?: string;
        siteName?: string;
        image?: { height: string; type: string; url: string; width: string };
        description?: string;
      },
    ];
    mediaType?: string;
    permalink?: string;
    userData: {
      _id: string;
      name: string;
      username: string;
      accountType: AccountType;
      profileImage: string;
      twitterHandler?: string;
      instagramHandler?: string;
    };
    images?: string[];
    videos?: string[];
    created: Date;
    id: string;

    reactions: any[];
  };
  socialPostviewStyle?: StyleProp<ViewStyle>;
}) => {
  const { colors } = useTheme();
  const [isMuted, setIsMuted] = useState<boolean>(true);
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

  let media = null;

  if (item?.mediaUrl) {
    media = {
      type: item.mediaType,
      url: item.mediaUrl,
    };
  } else if (item.attachments && item.attachments.length > 0) {
    item.attachments.forEach((attachment) => {
      if (attachment.type == 'photo' || attachment.type == 'video') {
        media = {
          type: attachment.type,
          url: attachment.url,
        };
      }
    });
  } else if (item.images && item.images.length > 0) {
    item.images.forEach((attachment) => {
      // if (attachment.type == 'photo' || attachment.type == 'video') {
      media = {
        type: 'photo',
        url: attachment,
      };
      // }
    });
  }

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

  let myReaction = undefined;

  item.reactions?.forEach((reaction) => {
    if (reaction.userId == user?._id) {
      myReaction = reaction;
    }
  });

  return (
    <BaseItem
      postData={{
        title: item?.title,
        id: item.id ?? item.postId,
        type: PostType.social,
        postlink: item.link,
        created: item.created,
        image: item.images && item.images.length > 0 ? { url: item.images[0] } : undefined,
        externalLink: url,
        reactions: item.reactions?.length ?? 0,
        myReaction,
      }}
      createdDate={item?.created}
      source={item.source}
      userData={item.userData}
      isApprovedInfluencer={user?.influencerProfile?.influencerStatus == 'approved'}
      profileImage={
        item?.userData?.profileImage && item?.userData?.profileImage != ''
          ? item?.userData?.profileImage
          : NO_PROFILE_IMAGE
      }
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
      <View style={{ flexGrow: 1, flex: 1 }}>
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

        {hasLink ? (
          <TouchableOpacity
            onPress={() => {
              if (linkData!.url) OpenURLButton(linkData!.url);
            }}
            style={[
              {
                borderRadius: 8,
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

        {media ? (
          <>
            {media.type == 'VIDEO' ? (
              <>
                <Video
                  ignoreSilentSwitch="ignore"
                  source={{
                    uri: media.url,
                  }}
                  style={{ height: 300, borderRadius: 2, marginVertical: 10 }}
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
              </>
            ) : (
              <FastImage
                style={{
                  // flexGrow: 1,
                  aspectRatio: 16 / 9,
                  // width: '100%',
                  // height: 300,
                  // borderRadius: 2,
                  // marginVertical: 10,
                }}
                resizeMode="cover"
                source={{ uri: media?.url ?? NO_POST_IMAGE_URL }}
              />
            )}
          </>
        ) : null}
      </View>
    </BaseItem>
  );
};

export default SocialItem;
