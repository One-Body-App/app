import { CompositeNavigationProp, useNavigation, useTheme } from '@react-navigation/native';
import isObject from 'lodash/isObject';
import React, { useState } from 'react';
import { Dimensions, Image, StyleProp, TextStyle, Pressable, View, ViewStyle } from 'react-native';
import FastImage, { ImageStyle, ResizeMode } from 'react-native-fast-image';
import Entypo from '@react-native-vector-icons/entypo';
import { decode } from 'html-entities';
import { Caption } from 'react-native-paper';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-simple-toast';
import { NO_POST_IMAGE_URL, NO_PROFILE_IMAGE, OpenURLButton } from '@/services/constants';
import { timeSince } from '@/utils/ResponsiveFun';
import { User, PostType } from '@/utils/types';
import styles from './style';
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
import { RootState } from '@/src/redux/reducers/rootReducer';
import Button from '../Button';
import { button } from '@/src/styles/buttons';
import { ApiCall } from '@/services/api';
import { getProfile } from '@/src/redux/actions/AuthActions';

type ScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<ExploreStackParamsList, 'Explore'>,
  CompositeNavigationProp<
    DrawerNavigationProp<MainDrawerParamsList, 'Main'>,
    BottomTabNavigationProp<MainBottomStackParamsList, 'ExploreTab'>
  >
>;

function UserItem({ item }: { item: User }) {
  const { colors } = useTheme();
  const navigation = useNavigation<ScreenNavigationProp>();
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleUnSubscribe = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await ApiCall({
        route: `user/unsubscribe/${id}`,
        token,
        verb: 'patch',
      });
      if (res?.status === 200) {
        dispatch(getProfile.Request({ token }));
        // Toast.show('unfollowed successfully.', Toast.LONG);
        // dispatch(getuserAll({ token: token }));
        // dispatch(getuserGet({ token: token }));
      } else {
        Toast.show('Error unfollowing, please try again later.', Toast.LONG);
      }
    } catch (e) {
      Toast.show('Error unfollowing, please try again later.', Toast.LONG);
    }
    setIsLoading(false);
  };

  const handleSubscribe = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await ApiCall({
        route: `user/subscribe/${id}`,
        token,
        verb: 'patch',
      });

      if (res?.status === 200) {
        // dispatch(getuserAll({ token: token }));
        // dispatch(getuserGet({ token: token }));
        dispatch(getProfile.Request({ token }));
        // Toast.show('Followed successfully.', Toast.LONG);
      } else {
        Toast.show('Error following, please try again later.', Toast.LONG);
      }
    } catch (e) {
      Toast.show('Error following, please try again later.', Toast.LONG);
      console.log('Error subscribing --- ', e);
    }
    setIsLoading(false);
  };

  return (
    <Pressable
      onPress={() => {
        // if (item?.link) OpenURLButton(item?.link);
        // if (onPress) onPress(item);
        if (item?.id) {
          navigation.navigate('UserProfile', {
            id: item?.id,
          });
        }
      }}
      style={{
        backgroundColor: colors.card,
        flexDirection: 'row',
        flex: 1,
        padding: spacing.x10,
        borderRadius: borderRadius.base,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
      }}
    >
      <FastImage
        // style={[styles.blogpostimage]}
        style={{ height: 60, width: 60, borderRadius: borderRadius.max }}
        resizeMode="contain"
        source={{ uri: item?.profileImage ? item?.profileImage : NO_PROFILE_IMAGE }}
      />

      <View
        style={{
          paddingHorizontal: spacing.x10,
          paddingVertical: spacing.x10,
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          // borderEndEndRadius: borderRadius.base,
          // borderEndStartRadius: borderRadius.base,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            flexGrow: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              flex: 1,
              paddingHorizontal: spacing.x5,
            }}
          >
            <StyledText numberOfLines={2} style={{ color: colors.text }}>
              {item.name}
            </StyledText>
            {item?.profile?.whatIDo?.name ||
            item.profile?.typeOfOrganization?.organizationType ||
            item.profile?.typeOfOrganization?.name ? (
              <StyledText numberOfLines={1} style={{ color: Colors.neutral[500] }}>
                {item?.profile.whatIDo?.name ??
                  item.profile.typeOfOrganization?.organizationType ??
                  item.profile.typeOfOrganization?.name}
              </StyledText>
            ) : null}
          </View>
          <Button
            // btnStyle={[
            //   button.primary,
            //   {
            //     // flex: 1,
            //     paddingVertical: spacing.x10,
            //     paddingHorizontal: spacing.x20,
            //   },
            // ]}
            btnStyle={[
              button.primary,
              {
                paddingVertical: spacing.x10,
                paddingHorizontal: spacing.x16,
                backgroundColor:
                  item?.id && user?.following.includes(item?.id)
                    ? Colors.neutral[600]
                    : Colors.primarySapphire.brand,
              },
            ]}
            btnTextStyle={{
              color: item?.id && user?.following.includes(item?.id) ? Colors.neutral[200] : '#FFF',
            }}
            disabledBtnStyle={{
              paddingVertical: spacing.x10,
              paddingHorizontal: spacing.x20,
              opacity: 0.5,
            }}
            // btnTextStyle={{ color: Colors.neutral[700] }}
            disabledBtnTextStyle={{ color: Colors.neutral[300] }}
            text={
              user?.following.some((followedId) => followedId === item?.id)
                ? 'Connected'
                : 'Connect'
            }
            onPress={() => {
              if (item?.id) {
                if (user?.following.includes(item?.id)) {
                  handleUnSubscribe(item?.id);
                } else {
                  handleSubscribe(item?.id);
                }
              }
            }}
            disabled={isLoading}
            wrapperViewBtnStyle={{
              justifyContent: 'center',
              backgroundColor: Colors.neutral[800],
              borderRadius: borderRadius.button,
            }}
          />
        </View>
      </View>
    </Pressable>
  );
}
export default UserItem;

// <Pressable
//   onPress={() => {
//     OpenURLButton(item?.link);
//   }}
// >
//   <View style={styles.blogpostview}>
//     <Image
//       style={styles.blogpostimage}
//       resizeMode="contain"
//       source={{ uri: item?.image?.url }}
//     />
//     <Text numberOfLines={2} style={styles.blogpostpara}>
//       {isObject(item?.title) ? item?.title?.a.$text : item?.title}
//     </Text>

//     <Text style={styles.blogposthour}>{timeSince(item?.created)} ago</Text>
//   </View>
// </Pressable>
