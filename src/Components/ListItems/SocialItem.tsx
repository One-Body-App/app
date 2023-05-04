import { getHeight } from '@/utils/ResponsiveFun';
import React, { useEffect, useState } from 'react';
import { Dimensions, StyleProp, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { NavigationProp, useNavigation, useTheme } from '@react-navigation/native';
import { styles } from './style';
import { NO_POST_IMAGE_URL, NO_PROFILE_IMAGE, OpenURLButton } from '@/src/Services/constants';

import FastImage from 'react-native-fast-image';
import { RootStackParamList } from '@/src/Navigation/types';
import Video from 'react-native-video';

type ScreenNavigationProp = NavigationProp<RootStackParamList, 'Home'>;
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
      }
    ];
    mediaType?: string;
    permalink?: string;
    userData: {
      _id: string;
      name: string;
      username: string;
      accountType: 'individual' | 'organization';
      profileImage: string;
    };
    created: Date;
    id: string;
  };
  socialPostviewStyle?: StyleProp<ViewStyle>;
}) => {
  const { colors } = useTheme();
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(visible ?? false);
  const navigation = useNavigation<ScreenNavigationProp>();
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

  return (
    <View
      style={[
        styles.socialpostview,
        { width: Dimensions.get('window').width - 32 },
        socialPostviewStyle,
      ]}
    >
      {item.userData ? (
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('UserProfile', {
              id: item?.userData?._id,
            });
          }}
          style={{
            flexDirection: 'row',
            padding: 5,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <FastImage
            source={{
              uri:
                item?.userData?.profileImage && item?.userData?.profileImage != ''
                  ? item?.userData?.profileImage
                  : NO_PROFILE_IMAGE,
            }}
            style={{
              width: 25,
              height: 25,
              borderRadius: 25,
              // marginBottom: 5,
              borderColor:
                item?.userData?.profileImage && item?.userData?.profileImage != ''
                  ? '#032F3C'
                  : '#09aadb',
              borderWidth: 1,
            }}
            resizeMode={'contain'}
          />
          <Text
            style={{
              marginLeft: 5,
              fontFamily: 'Rubik',
              color: '#68828A',
              alignItems: 'center',
              maxWidth: 200,
            }}
            numberOfLines={2}
          >
            {item?.userData?.name}
          </Text>
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
                style={{ width: '100%', height: 300, borderRadius: 2, marginVertical: 10 }}
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
                width: '100%',
                height: 300,
                borderRadius: 2,
                marginVertical: 10,
              }}
              source={{ uri: media?.url ?? NO_POST_IMAGE_URL }}
            />
          )}
        </>
      ) : null}

      <View style={{ flexDirection: 'row', padding: 5 }}>
        <Text
          style={{
            padding: 5,
            fontFamily: 'Rubik',
            lineHeight: 18,
            color: colors.text,
            marginTop: getHeight(1),
          }}
        >
          {item?.content}
        </Text>
      </View>

      {hasLink ? (
        <TouchableOpacity
          onPress={() => {
            if (linkData!.url) OpenURLButton(linkData!.url);
          }}
          style={[
            { width: Dimensions.get('window').width - 70 },
            {
              borderRadius: 8,
              marginVertical: 10,
              borderColor: '#808080',
              borderWidth: 1,
            },
          ]}
        >
          <FastImage
            style={{
              width: '100%',
              height: 200,
              // borderRadiusTop: 2,
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
            }}
            source={{ uri: linkData!.image?.url ?? NO_POST_IMAGE_URL }}
          />
          <View style={{ padding: 10 }}>
            {linkData!.siteName ? (
              <Text numberOfLines={1} style={{ color: '#979797' }}>
                {getDomainName(linkData!.url || '')}
              </Text>
            ) : null}
            <Text numberOfLines={1} style={{ fontWeight: 'bold' }}>
              {linkData!.title}
            </Text>
            <Text numberOfLines={2}>{linkData!.description}</Text>
          </View>
        </TouchableOpacity>
      ) : null}

      {url ? (
        <TouchableOpacity
          onPress={() => {
            if (url) OpenURLButton(url);
          }}
          style={{ marginTop: 10 }}
        >
          <Text
            style={{
              marginLeft: 5,
              fontFamily: 'Rubik',
              color: '#68828A',
              alignItems: 'center',
              marginBottom: 5,
            }}
          >
            {item?.source == 'twitter' ? 'View on Twitter' : 'View on Instagram'}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export default SocialItem;
