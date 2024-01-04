import React, { useEffect, useState } from 'react';
import {
  View,
  Touchable,
  StatusBar,
  Image,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Header from '@/src/Components/Header';

import Save from '@/assets/svg/Save.svg';
import { styles } from './styles';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import FastImage from 'react-native-fast-image';
import { OpenURLButton } from '@/src/Services/constants';
import { StackNavigationProp, StackScreenProps } from '@react-navigation/stack';
import { setLoader } from '@/src/Redux/actions/GeneralActions';
import { ApiCall } from '@/src/Services/api';
import { getuserGet } from '@/src/Redux/actions/UserAction';
import { CompositeNavigationProp, CompositeScreenProps, useTheme } from '@react-navigation/native';
import { DrawerNavigationProp, DrawerScreenProps } from '@react-navigation/drawer';
import { StyledText } from '@/src/Components/styled/Text';
import { Colors, Typography } from '@/src/styles';
import { borderRadius } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import { Bookmark, NotificationBing } from 'iconsax-react-native';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faBookmark } from '@fortawesome/free-solid-svg-icons';
import { getProfile } from '@/src/Redux/actions/AuthActions';
import SocialItem from '@/src/Components/ListItems/SocialItem';
import ArticleItem from '@/src/Components/ListItems/ArticleItem';
import { ArticleType, PostType, SavedPost } from '@/utils/types';
import { PopupItem } from '@/src/Components/ListItems/OptionsModal';
import { isObject } from 'lodash';
import Button from '@/src/Components/Button';
import {
  MainDrawerParamsList,
  MainStackParamList,
  SettingsStackParamsList,
} from '@/src/navigator/types';

type Props = CompositeScreenProps<
  StackScreenProps<SettingsStackParamsList, 'Saved'>,
  CompositeScreenProps<
    StackScreenProps<MainStackParamList, 'ConfirmLogin'>,
    DrawerScreenProps<MainDrawerParamsList, 'Main'>
  >
>;

enum ContentType {
  RSS = 'RSS',
  Social = 'Social',
  All = 'All',
}

const Saved = ({ navigation }: Props) => {
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const token = useSelector((state: RootState) => state.auth.userToken);
  const authState = useSelector((state: RootState) => state.auth);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const dispatch = useDispatch();
  const [currentPopupItem, setCurrentPopupItem] = useState<PopupItem>();
  const [show, setShow] = useState<boolean>();
  const [isScrollEnable, setIsScrollEnable] = useState(true);
  const [filter, setFilter] = useState<ContentType>(ContentType.All);
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>(user?.savedPost ?? []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      dispatch(
        getProfile.Request({
          token,
          pullSavedData: true,
        })
      );
    });

    // Return the function to unsubscribe from the event so it gets removed on unmount
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (token) {
      dispatch(
        getProfile.Request({
          token,
          pullSavedData: true,
        })
      );
    }
  }, [token, isRefreshing]);

  useEffect(() => {
    if (user?.savedPost && user?.savedPost.length > 0) {
      if (filter == ContentType.All) {
        setSavedPosts(user?.savedPost ?? []);
      }

      if (filter == ContentType.RSS) {
        setSavedPosts(user?.savedPost.filter((item) => item.type != 'social'));
      }

      if (filter == ContentType.Social) {
        setSavedPosts(user?.savedPost.filter((item) => item.type == 'social'));
      }
    } else {
      setSavedPosts([]);
    }
  }, [filter]);

  useEffect(() => {
    if (user?.savedPost && user?.savedPost.length > 0) {
      if (filter == ContentType.All) {
        setSavedPosts(user?.savedPost ?? []);
      }

      if (filter == ContentType.RSS) {
        setSavedPosts(user?.savedPost.filter((item) => item.type != 'social'));
      }

      if (filter == ContentType.Social) {
        setSavedPosts(user?.savedPost.filter((item) => item.type == 'social'));
      }
    } else {
      setSavedPosts([]);
    }
  }, [user?.savedPost]);

  useEffect(() => {
    // if (authState.getProfileSuccess == false) {
    setIsRefreshing(false);
    // }
  }, [authState.getProfileSuccess]);

  const removePost = async (type: string, link: string) => {
    dispatch(setLoader(true));

    try {
      const res = await ApiCall({
        route: `user/remove-saved-post`,
        verb: 'delete',
        token: token,
        params: {
          link,
          type,
        },
      });

      if (res?.status == 200) {
        dispatch(getuserGet({ token }));
      }
      dispatch(setLoader(false));
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };
  const showModal = (item: ArticleType) => {
    if (user) {
      setCurrentPopupItem({
        id: item.id,
        postlink: item.link,
        title: isObject(item?.title) ? item?.title?.a.$text : item?.title,
        created: item.created,
        image: item.image,
        externalLink: item.link,
        type: PostType.rss,

        userData: {
          twitterHandler: user?.influencerProfile?.twitterHandler,
          instagramHandler: user?.influencerProfile?.instagramHandler,
          name: user?.name,
          username: user?.username,
          _id: user?._id,
          accountType: user?.accountType,
          profileImage: user?.profileImage,
        },
      });
    }
    setShow(true);
  };

  return (
    <SafeAreaView>
      {savedPosts.length > 0 ? (
        <ScrollView
          horizontal
          style={{
            marginBottom: spacing.x24,
            flexDirection: 'row',
            paddingHorizontal: spacing.x16,
            marginTop: spacing.x16,
          }}
          showsHorizontalScrollIndicator={false}
        >
          <Button
            btnStyle={[
              styles.filterButton,
              {
                backgroundColor:
                  filter == ContentType.All ? Colors.primarySapphire.brand : Colors.neutral[800],
              },
            ]}
            btnTextStyle={[{ color: filter == ContentType.All ? 'white' : Colors.neutral[200] }]}
            text="All"
            onPress={() => {
              if (filter != ContentType.All) setFilter(ContentType.All);
            }}
          />
          <Button
            btnStyle={[
              styles.filterButton,
              {
                backgroundColor:
                  filter == ContentType.RSS ? Colors.primarySapphire.brand : Colors.neutral[800],
              },
            ]}
            btnTextStyle={[{ color: filter == ContentType.RSS ? 'white' : Colors.neutral[200] }]}
            text="RSS"
            onPress={() => {
              if (filter != ContentType.RSS) setFilter(ContentType.RSS);
            }}
          />
          <Button
            btnStyle={[
              styles.filterButton,
              {
                backgroundColor:
                  filter == ContentType.Social ? Colors.primarySapphire.brand : Colors.neutral[800],
              },
            ]}
            btnTextStyle={[{ color: filter == ContentType.Social ? 'white' : Colors.neutral[200] }]}
            text="Social"
            onPress={() => {
              if (filter != ContentType.Social) setFilter(ContentType.Social);
            }}
          />
        </ScrollView>
      ) : null}
      <FlatList
        data={savedPosts.filter((item) => item.type != PostType.prayer)}
        contentContainerStyle={{ flexGrow: 1 }}
        onRefresh={() => {
          setIsRefreshing(true);
        }}
        keyExtractor={(item, index) => {
          return `${item.created}-${item.postId}-${index}`;
        }}
        scrollEnabled={isScrollEnable}
        refreshing={isRefreshing}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => {
          return (
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <View
                style={{
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    backgroundColor: Colors.neutral[700],
                    marginBottom: spacing.x32,
                    borderRadius: borderRadius.max,
                    padding: spacing.x32,
                  }}
                >
                  <FontAwesomeIcon icon={faBookmark} size={100} color={Colors.neutral[500]} />
                </View>
              </View>
              <StyledText
                style={[Typography.body.x4, { textAlign: 'center', marginBottom: spacing.x16 }]}
              >
                You have not saved any post
              </StyledText>
              <StyledText
                style={[
                  Typography.body.x2,
                  {
                    color: Colors.neutral[300],
                    textAlign: 'center',
                    paddingHorizontal: 40,
                  },
                ]}
              >
                Post you saved will show up here
              </StyledText>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ padding: 7 }} />}
        renderItem={({ item, index }) => {
          if (item.type == 'social') {
            const postData = user?.savedPostData?.find((postData) => postData?._id == item.postId);

            if (postData) {
              return (
                <TouchableOpacity
                  onPress={() => {
                    if (postData.postId) {
                      navigation.navigate('SinglePost', {
                        postId: postData.postId,
                      });

                      // navigation.navigate( 'Single', {
                      //   postId: postData.id,
                      // });
                    }
                  }}
                >
                  <SocialItem
                    item={postData}
                    index={index}
                    onShowDismissCard={(e?: boolean) => setIsScrollEnable(!e)}
                    removePost={removePost}
                    fromSavedPosts
                  />
                </TouchableOpacity>
              );
            }
          } else if (user && item.created && item.image) {
            return (
              <ArticleItem
                item={{
                  ...item,
                  created: item.created ?? new Date(),
                  image: { url: item.image ?? '' },
                  userData: user,
                }}
                imageSizeType="cover"
                blogPostTitleStyle={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
                showModal={showModal}
              />
            );
          }

          return <></>;
        }}
        // (
        //   <TouchableOpacity
        //     style={{
        //       ...styles.blogpostview,
        //       marginHorizontal: 10,
        //     }}
        //     onPress={() => {
        //       if (item.link) OpenURLButton(item.link);
        //     }}
        //   >
        //     <FastImage
        //       style={styles.blogpostimage}
        //       resizeMode={'stretch'}
        //       source={{ uri: item.image }}
        //     />
        //     <View
        //       style={{
        //         top: 0,
        //         position: 'absolute',
        //         backgroundColor: 'white',
        //         height: getHeight(4.5),
        //         width: getWidth(8.5),
        //         borderBottomRightRadius: 10,
        //         justifyContent: 'center',
        //         alignItems: 'center',
        //         borderBottomLeftRadius: 10,
        //         right: 15,
        //       }}
        //     >
        //       <Save height={getHeight(3)} width={getWidth(3)} />
        //     </View>
        //     <StyledText
        //       numberOfLines={2}
        //       style={[styles.blogpostpara, { color: dark ? colors.text : '#032F3C' }]}
        //     >
        //       {item.title}
        //     </StyledText>
        //     <TouchableOpacity
        //       onPress={() => {
        //         if (item.link) removePost(item.link);
        //       }}
        //     >
        //       <StyledText>Remove</StyledText>
        //     </TouchableOpacity>
        //   </TouchableOpacity>
        // )}
      />
    </SafeAreaView>
  );
};
export default Saved;
