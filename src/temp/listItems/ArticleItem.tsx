import { CompositeNavigationProp, useNavigation, useTheme } from '@react-navigation/native';
import { isObject } from 'lodash';
import React from 'react';
import {
  Dimensions,
  Image,
  StyleProp,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import FastImage, { ImageStyle, ResizeMode } from 'react-native-fast-image';
import Entypo from 'react-native-vector-icons/Entypo';
import { decode } from 'html-entities';
import { Caption } from 'react-native-paper';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { styles } from './style';
import { spacing } from '@/src/styles/spacing';
import StyledText from '../styled/Text';
import { Colors } from '@/src/styles';
import BaseItem from './BaseItem';
import {
  ExploreStackParamsList,
  MainBottomStackParamsList,
  MainDrawerParamsList,
} from '@/src/navigator/types';
import { borderRadius } from '@/src/styles/outlines';
import { ArticleType, PostType } from '@/utils/types';
import { timeSince } from '@/utils/ResponsiveFun';
import { NO_POST_IMAGE_URL, NO_PROFILE_IMAGE, OpenURLButton } from '@/services/constants';
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
}) {
  const { colors } = useTheme();
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const navigation = useNavigation<ScreenNavigationProp>();

  return (
    <BaseItem
      postData={{
        title: isObject(item?.title) ? item?.title?.a.$text : item?.title,

        id: item.id,
        type: PostType.rss,
        postlink: item.link,
        image: item.image,
      }}
      created={item?.created}
      userData={item.userData}
      isApprovedInfluencer={user?.influencerProfile?.influencerStatus == 'approved'}
      onPress={() => {
        if (item.userData._id != user?._id) {
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
    >
      <TouchableOpacity
        onPress={() => {
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

        <FastImage
          style={[styles.blogpostimage, blogPostImageStyle]}
          resizeMode={imageSizeType}
          source={{ uri: item?.image?.url ?? NO_POST_IMAGE_URL }}
        />

        <View
          style={{
            paddingHorizontal: spacing.x10,
            paddingVertical: spacing.x10,
            backgroundColor: Colors.neutral[900],
            borderEndEndRadius: borderRadius.base,
            borderEndStartRadius: borderRadius.base,
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
              <StyledText numberOfLines={2} style={[{ color: colors.text }, blogPostTitleStyle]}>
                {isObject(item?.title) ? decode(item?.title?.a.$text) : decode(item?.title)}
              </StyledText>
              <StyledText
                numberOfLines={1}
                style={[{ color: Colors.neutral[500] }, blogPostTitleStyle]}
              >
                {item?.link}
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
