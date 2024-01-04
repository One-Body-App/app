import React, { FC, forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { FlatList, Image, RefreshControl, TouchableOpacity, View } from 'react-native';
import { styles } from './styles';

import { useDispatch, useSelector } from 'react-redux';
import { ApiCall } from '@/services/api';
import { SetSocial } from '@/redux/actions/SocialActions';
import { NavigationProp, useNavigation, useTheme } from '@react-navigation/native';
import { RootState } from '@/src/redux/reducers/rootReducer';
import SocialItem from '../listItems/SocialItem';
import { isObject } from 'lodash';
import { Tabs } from 'react-native-collapsible-tab-view';
import { RefreshListRef } from '@/utils/types';
import { StyledText } from '../styled/Text';
import { spacing } from '@/src/styles/spacing';
import { MainStackParamList } from '@/src/navigator/types';

const SocialFlatlist = forwardRef<RefreshListRef, { userIdToPullData?: string }>(
  ({ userIdToPullData }, ref) => {
    const socialPost = useSelector((state: RootState) => state.social.SocialPost);

    const token = useSelector((state: RootState) => state.auth.userToken);
    const [hasMore, setHasMore] = useState(true);
    const dispatch = useDispatch();
    const [page, setPage] = useState(1);
    const [isEndOfList, setIsEndOfList] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [show, setShow] = useState<boolean>(false);
    const [currentPopupItemId, setCurrentPopupItemId] = useState<string>();
    const navigation = useNavigation<NavigationProp<MainStackParamList>>();

    const refreshContent = (showRefreshIndicator = false) => {
      setIsEndOfList(false);
      setPage(1);
      setIsRefreshing(true);

      if (showRefreshIndicator) {
        setShowRefreshIndicator(true);
      }
    };

    const getData = async () => {
      await getSocialPosts(page);
    };

    useImperativeHandle(ref, () => ({
      setRefreshing() {
        refreshContent();
      },
    }));

    const getSocialPosts = async (pageNumber: number) => {
      setIsLoading(true);

      try {
        const res = await ApiCall({
          route: userIdToPullData
            ? `user/get-social/all/${userIdToPullData}/${pageNumber}?itemsPerPage=5`
            : `user/get-following-social/${pageNumber}`,
          token,
          verb: 'get',
        });
        let posts = [];

        if (res?.status == 200) {
          setHasMore(res?.response.hasMore);
          if (pageNumber == 1) {
            posts = res?.response?.content ?? [];
            setIsEndOfList(false);
          } else {
            posts = [...socialPost, ...(res?.response?.content ?? [])];
            if (res?.response?.content?.length < 1) {
              setIsEndOfList(true);
            }
          }
          dispatch(SetSocial(posts));
        } else {
          console.log('error', res?.response);
        }
        setIsLoading(false);
        setIsRefreshing(false);
        setShowRefreshIndicator(false);
      } catch (e: any) {
        console.log(e.toString());
      }
      setIsLoading(false);
      setIsRefreshing(false);
      setShowRefreshIndicator(false);

      setPage(pageNumber);
    };

    useEffect(() => {
      getData();
    }, [page]);

    useEffect(() => {
      if (isRefreshing) getData();
    }, [isRefreshing]);
    const [isScrollEnable, setIsScrollEnable] = useState(true);

    const removePost = async (id: string) => {
      try {
        const res = await ApiCall({
          route: `social/remove-post/${id}`,
          verb: 'delete',
          token: token,
        });

        if (res?.status == 200) {
          getData();
        }
      } catch (e: any) {
        console.log('saga error -- ', e.toString());
      }
    };

    const editPost = async (id: string) => {
      navigation.navigate('Post', { postId: id });
      // try {
      //   const res = await ApiCall({
      //     route: `social/edit-post/${id}`,
      //     verb: 'patch',
      //     token: token,
      //   });
      //   if (res?.status == 200) {
      //     getFeedData(feedOptions.type, feedOptions.page);
      //   }
      // } catch (e: any) {
      //   console.log('saga error -- ', e.toString());
      // }
    };

    return (
      <Tabs.FlatList
        data={socialPost}
        style={{ flex: 1 }}
        keyExtractor={(item, index) => {
          return `${item?.userData?.username}-${item.id ?? item.postId}-${index}`;
        }}
        extraData={isRefreshing}
        scrollEnabled={isScrollEnable}
        renderItem={({ item, index }) => (
          <SocialItem
            item={item}
            onShowDismissCard={(e?: boolean) => setIsScrollEnable(!e)}
            index={index}
            parentRefreshContent={refreshContent}
            removePost={removePost}
            editPost={editPost}
          />
        )}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (!isLoading && !isRefreshing && !isEndOfList) setPage(page + 1);
        }}
        ListFooterComponent={() => (
          <View>
            {isEndOfList ? (
              <StyledText style={{ textAlign: 'center' }}>
                Not more social posts at this time
              </StyledText>
            ) : null}
          </View>
        )}
        refreshControl={
          <RefreshControl
            enabled={true}
            refreshing={isRefreshing && showRefreshIndicator}
            onRefresh={() => {
              refreshContent();
            }}
          />
        }
        ListEmptyComponent={() => (
          <>
            {isLoading ? null : (
              <StyledText style={{ textAlign: 'center', marginTop: spacing.x10 }}>
                Nothing here
              </StyledText>
            )}
          </>
        )}
      />
      // <>
      //   {socialPost?.map((item, i) => (
      //     <View key={i} style={{ ...styles.socialpostview, backgroundColor: colors.card, margin: 7 }}>
      //       {item?.attachments ? (
      //         <Image
      //           style={styles.socialpostimage}
      //           resizeMode={'stretch'}
      //           source={require('@/assets/images/Photo.png')}
      //         />
      //       ) : null}
      //       <Text
      //         style={{
      //           padding: 5,
      //           fontFamily: 'Rubik',
      //           lineHeight: 18,
      //           color: colors.text,
      //           marginTop: getHeight(1),
      //           textAlign: 'center',
      //         }}
      //       >
      //         {item?.content}
      //       </Text>
      //       <View style={{ flexDirection: 'row', padding: 5 }}>
      //         {item?.source == 'twitter' ? <Twitter fill="#00acee" /> : null}
      //         <Text
      //           style={{
      //             marginLeft: 5,
      //             fontFamily: 'Rubik',
      //             color: '#68828A',
      //             alignItems: 'center',
      //           }}
      //         >
      //           @{item?.handler}
      //         </Text>
      //       </View>
      //     </View>
      //   ))}
      //   {hasMore ? (
      //     <View style={{ justifyContent: 'center', alignItems: 'center', marginTop: 20 }}>
      //       <TouchableOpacity
      //         onPress={async () => {
      //           await getSocialPosts(page + 1);
      //         }}
      //       >
      //         <Text>View More</Text>
      //       </TouchableOpacity>
      //     </View>
      //   ) : null}
      // </>
    );
  }
);
export default SocialFlatlist;
