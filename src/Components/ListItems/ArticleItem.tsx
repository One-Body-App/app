import { OpenURLButton } from '@/src/Services/constants';
import { timeSince } from '@/utils/ResponsiveFun';
import { useTheme } from '@react-navigation/native';
import { isObject } from 'lodash';
import React from 'react';
import { StyleProp, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import FastImage, { ImageStyle, ResizeMode } from 'react-native-fast-image';
import { styles } from './style';

const ArticleItem = ({
  item,
  blogPostStyle,
  blogPostImageStyle,
  blogPostTitleStyle,
  imageSizeType,
}: {
  item: {
    link?: string;
    created: Date;
    image: { url: string };
    title: string | { a: any };
  };
  blogPostStyle?: StyleProp<ViewStyle>;
  blogPostImageStyle?: StyleProp<ImageStyle>;
  blogPostTitleStyle?: StyleProp<TextStyle>;
  imageSizeType: ResizeMode;
}) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={() => {
        if (item?.link) OpenURLButton(item?.link);
      }}
      style={[styles.blogpostview, blogPostStyle]}
    >
      <FastImage
        style={[styles.blogpostimage, blogPostImageStyle]}
        resizeMode={imageSizeType}
        source={{ uri: item?.image?.url }}
      />
      <View style={{ flex: 1, width: '100%', padding: 15 }}>
        <Text
          numberOfLines={2}
          style={[styles.blogpostpara, { color: colors.text }, blogPostTitleStyle]}
        >
          {isObject(item?.title) ? item?.title?.a.$text : item?.title}
        </Text>
        <Text style={styles.blogposthour}>{timeSince(item?.created)} ago</Text>
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
