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
import Entypo from 'react-native-vector-icons/Entypo';
import FastImage from 'react-native-fast-image';
import { RootStackParamList } from '@/src/Navigation/types';
type ScreenNavigationProp = NavigationProp<RootStackParamList, 'Home'>;

const SocialItem = ({
  item,
  author,
  socialPostviewStyle,
}: {
  currentPopupItemId?: string;
  item: {
    content: string;
    source: 'twitter' | 'instagram';
    handler: string;
    link: string;
    title: string;
    image?: {
      url: string;
    };
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
  author?: string;
  socialPostviewStyle?: StyleProp<ViewStyle>;
}) => {
  const { colors } = useTheme();
  const navigation = useNavigation<ScreenNavigationProp>();

  return (
    <View style={{ ...styles.socialpostview, backgroundColor: colors.card, margin: 7 }}>
      {author ? (
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
              uri: item?.userData?.profileImage ?? 'https://cdn.onebodyapp.com/user/no-image.png',
            }}
            style={{
              width: 25,
              height: 25,
              borderRadius: 25,
              // marginBottom: 5,
              borderColor: item?.userData?.profileImage ? '#032F3C' : '#09aadb',
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
            }}
          >
            {item?.userData?.name}
          </Text>
        </TouchableOpacity>
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
      <TouchableOpacity
        onPress={() => {
          let url = '';
          if (item?.source == 'twitter') {
            url = `https://twitter.com/${item?.handler}/status/${item?.id}`;
          } else {
            url = '';
          }

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
    </View>
  );
};

export default SocialItem;
