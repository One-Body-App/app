import { getHeight, timeSince } from '@/utils/ResponsiveFun';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  ImageBackground,
  StyleProp,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { NavigationProp, useNavigation, useTheme } from '@react-navigation/native';
import { styles } from './style';
import { NO_POST_IMAGE_URL, NO_PROFILE_IMAGE, OpenURLButton } from '@/src/Services/constants';
import FastImage from 'react-native-fast-image';
import { RootStackParamList } from '@/src/Navigation/types';
import Video from 'react-native-video';
import Twitter from '@/assets/svg/Twitter.svg';
import Instagram from '@/assets/svg/Instagram.svg';

type ScreenNavigationProp = NavigationProp<RootStackParamList, 'Home'>;

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

  useEffect(() => {
    setIsPlaying(visible ?? false);
    if (!visible && !isMuted) setIsMuted(true);
  }, [visible]);

  return (
    <View
      style={[
        styles.socialpostview,
        { width: Dimensions.get('window').width - 32 },
        socialPostviewStyle,
      ]}
    >
      {item.userData ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('UserProfile', {
                id: item?.userData?._id,
              });
            }}
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-start',
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

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text>
              {item?.source == 'instagram' ? (
                <Instagram height={getHeight(2.5)} fill="#00acee" />
              ) : (
                <Twitter height={getHeight(2.5)} fill="#00acee" />
              )}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {item?.mediaUrl ? (
        <>
          {item.mediaType == 'VIDEO' ? (
            <>
              <Text>{isMuted ? 'true' : 'false'}</Text>
              <Video
                ignoreSilentSwitch="ignore"
                source={{
                  uri: item?.mediaUrl,
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
              source={{ uri: item?.mediaUrl ?? NO_POST_IMAGE_URL }}
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

      {url ? (
        <TouchableOpacity
          onPress={() => {
            if (url) OpenURLButton(url);
          }}
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
          }}
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
