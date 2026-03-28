import React, { useEffect, useState } from 'react';
import { View, FlatList, SafeAreaView, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { StackScreenProps } from '@react-navigation/stack';
import { CompositeScreenProps } from '@react-navigation/native';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faBookmark } from '@fortawesome/free-solid-svg-icons';

import { styles } from './styles';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { setLoader } from '@/src/redux/actions/GeneralActions';
import { ApiCall } from '@/services/api';
import { getuserGet } from '@/src/redux/actions/UserAction';
import StyledText from '@/components/styled/Text';
import { Colors, Typography } from '@/src/styles';
import { borderRadius } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import { getProfile } from '@/src/redux/actions/AuthActions';
import SocialItem from '@/components/listItems/SocialItem';
import ArticleItem from '@/components/listItems/ArticleItem';
import { SavedPost } from '@/utils/types';
import Button from '@/components/Button';
import { STANDARD_SECONDARY_LIST_BATCH_CONFIG } from '@/src/navigator/motionPolicy';
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

function Saved({ navigation }: Props) {
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const token = useSelector((state: RootState) => state.auth.userToken);
  const authState = useSelector((state: RootState) => state.auth);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const dispatch = useDispatch();
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
        token,
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
        data={savedPosts}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: spacing.x72 }}
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
            <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'red' }}>
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
                <SocialItem
                  itemData={postData}
                  index={index}
                  onShowDismissCard={(e?: boolean) => setIsScrollEnable(!e)}
                  removePost={removePost}
                  fromSavedPosts
                  onCommentsPress={() => {
                    const postId = postData.postId ?? postData.id ?? postData._id;
                    if (postId) {
                      navigation.navigate('SinglePost', { postId });
                    }
                  }}
                />
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
                  reactions: [],
                }}
                imageSizeType="contain"
                blogPostTitleStyle={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
              />
            );
          }

          return null;
        }}
        removeClippedSubviews={STANDARD_SECONDARY_LIST_BATCH_CONFIG.removeClippedSubviews}
        initialNumToRender={STANDARD_SECONDARY_LIST_BATCH_CONFIG.initialNumToRender}
        maxToRenderPerBatch={STANDARD_SECONDARY_LIST_BATCH_CONFIG.maxToRenderPerBatch}
        updateCellsBatchingPeriod={STANDARD_SECONDARY_LIST_BATCH_CONFIG.updateCellsBatchingPeriod}
        windowSize={STANDARD_SECONDARY_LIST_BATCH_CONFIG.windowSize}
      />
    </SafeAreaView>
  );
}
export default Saved;
