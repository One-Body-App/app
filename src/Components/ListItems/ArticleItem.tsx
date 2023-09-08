import { NO_POST_IMAGE_URL, OpenURLButton } from '@/src/Services/constants';
import { timeSince } from '@/utils/ResponsiveFun';
import { ArticleType } from '@/utils/types';
import { useTheme } from '@react-navigation/native';
import { isObject } from 'lodash';
import React from 'react';
import {
  Dimensions,
  Image,
  StyleProp,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import FastImage, { ImageStyle, ResizeMode } from 'react-native-fast-image';
import Entypo from 'react-native-vector-icons/Entypo';
import { styles } from './style';
import { decode } from 'html-entities';
import { Caption } from 'react-native-paper';

const ArticleItem = ({
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
}: {
  item: ArticleType;
  blogPostStyle?: StyleProp<ViewStyle>;
  blogPostImageStyle?: StyleProp<ImageStyle>;
  blogPostTitleStyle?: StyleProp<TextStyle>;
  imageSizeType: ResizeMode;
  iconSize?: number;
  showModal: (item: ArticleType) => void;
  hideProfileName?: boolean;
  pillText?: string;
  onPress?: (item: ArticleType) => void;
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={() => {
        if (item?.link) OpenURLButton(item?.link);
        if (onPress) onPress(item);
      }}
      style={[
        styles.blogpostview,
        { width: Dimensions.get('window').width - 32, backgroundColor: colors.background },
        blogPostStyle,
      ]}
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
        style={[styles.blogpostimage, blogPostImageStyle]}
        resizeMode={imageSizeType}
        source={{ uri: item?.image?.url ?? NO_POST_IMAGE_URL }}
      />

      <View style={{ flex: 1, paddingHorizontal: 10, paddingVertical: 10, width: '100%' }}>
        <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'space-between' }}>
          <View style={{ flex: 5 }}>
            <Text
              numberOfLines={2}
              style={[styles.blogpostpara, { color: colors.text }, blogPostTitleStyle]}
            >
              {isObject(item?.title) ? decode(item?.title?.a.$text) : decode(item?.title)}
            </Text>
          </View>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <TouchableOpacity
              onPress={() => {
                showModal(item);
              }}
            >
              <Entypo
                name="dots-three-horizontal"
                style={[styles.newsicon, { textAlign: 'right' }]}
                size={iconSize ?? 25}
                color={'#70747D'}
              />
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexGrow: 0 }}>
          {hideProfileName ? null : (
            <Text style={[styles.blogposthour, { flex: 2.4 }]} numberOfLines={1}>
              {item?.userData?.name}
            </Text>
          )}

          {item?.created ? (
            <Text style={[styles.blogposthour, { flex: 1, textAlign: 'right' }]}>
              {timeSince(item?.created)} ago
            </Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};
export default ArticleItem;

// <TouchableOpacity
//   onPress={() => {
//     OpenURLButton(item?.link);
//   }}
// >
//   <View style={styles.blogpostview}>
//     <Image
//       style={styles.blogpostimage}
//       resizeMode="cover"
//       source={{ uri: item?.image?.url }}
//     />
//     <Text numberOfLines={2} style={styles.blogpostpara}>
//       {isObject(item?.title) ? item?.title?.a.$text : item?.title}
//     </Text>

//     <Text style={styles.blogposthour}>{timeSince(item?.created)} ago</Text>
//   </View>
// </TouchableOpacity>
