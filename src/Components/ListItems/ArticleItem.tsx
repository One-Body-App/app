import { OpenURLButton } from '@/src/Services/constants';
import { timeSince } from '@/utils/ResponsiveFun';
import { ArticleType } from '@/utils/types';
import { useTheme } from '@react-navigation/native';
import { isObject } from 'lodash';
import React from 'react';
import { StyleProp, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import FastImage, { ImageStyle, ResizeMode } from 'react-native-fast-image';
import Entypo from 'react-native-vector-icons/Entypo';
import { styles } from './style';

const ArticleItem = ({
  item,
  blogPostStyle,
  blogPostImageStyle,
  blogPostTitleStyle,
  imageSizeType,
  showModal,
  iconSize,
  hideProfileName,
}: {
  item: ArticleType;
  blogPostStyle?: StyleProp<ViewStyle>;
  blogPostImageStyle?: StyleProp<ImageStyle>;
  blogPostTitleStyle?: StyleProp<TextStyle>;
  imageSizeType: ResizeMode;
  iconSize?: number;
  showModal: (item: ArticleType) => void;
  hideProfileName?: boolean;
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={() => {
        if (item?.link) OpenURLButton(item?.link);
      }}
    >
      <View style={[styles.blogpostview, blogPostStyle]}>
        <FastImage
          style={[styles.blogpostimage, blogPostImageStyle]}
          resizeMode={imageSizeType}
          source={{ uri: item?.image?.url }}
        />
        <View style={{ flex: 1, width: '100%', paddingHorizontal: 10, paddingVertical: 10 }}>
          <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'space-between' }}>
            <View style={{ flex: 5 }}>
              <Text
                numberOfLines={2}
                style={[styles.blogpostpara, { color: colors.text }, blogPostTitleStyle]}
              >
                {isObject(item?.title) ? item?.title?.a.$text : item?.title}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <TouchableOpacity
                onPress={() => {
                  showModal(item);
                }}
              >
                <Entypo
                  name="dots-three-horizontal"
                  style={styles.newsicon}
                  size={iconSize ?? 25}
                  color={'#70747D'}
                />
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {hideProfileName ? null : (
              <Text style={styles.blogposthour}>{item?.userData?.name}</Text>
            )}
            <Text style={styles.blogposthour}>{timeSince(item?.created)} ago</Text>
          </View>
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
