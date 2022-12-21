import { getHeight, timeSince } from '@/utils/ResponsiveFun';
import React from 'react';
import {
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
import { OpenURLButton } from '@/src/Services/constants';

import FastImage from 'react-native-fast-image';
import { RootStackParamList } from '@/src/Navigation/types';
import Video from 'react-native-video';

type ScreenNavigationProp = NavigationProp<RootStackParamList, 'Home'>;

const SocialItem = ({
  item,
  socialPostviewStyle,
}: {
  currentPopupItemId?: string;
  item: {
    content: string;
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
      role: string;
      profileImage: string;
    };
    created: Date;
    id: string;
  };
  socialPostviewStyle?: StyleProp<ViewStyle>;
}) => {
  const { colors } = useTheme();
  const navigation = useNavigation<ScreenNavigationProp>();
  let url = '';
  if (item?.source == 'twitter') {
    url = `https://twitter.com/${item?.handler}/status/${item?.id}`;
  } else {
    url = item?.permalink || '';
  }
  const videoStyle = {
    height: 250,
    width: 250,
  };
  return (
    <View style={{ ...styles.socialpostview, backgroundColor: colors.card, margin: 7 }}>
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
                  : 'https://cdn.onebodyapp.com/user/no-image.png',
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

      {item?.mediaUrl ? (
        <>
          {item.mediaType == 'VIDEO' ? (
            <Video
              source={{
                uri: item?.mediaUrl,
              }}
              style={{ width: '100%', height: 300, borderRadius: 20 }}
              controls={true}
              resizeMode="cover"
              paused={true}
              hideShutterView={true}
            />
          ) : (
            <FastImage
              style={{ width: '100%', height: 300, borderRadius: 20 }}
              source={{ uri: item?.mediaUrl }}
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
            textAlign: 'center',
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
        >
          <Text
            style={{
              marginLeft: 5,
              fontFamily: 'Rubik',
              color: '#68828A',
              alignItems: 'center',
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
