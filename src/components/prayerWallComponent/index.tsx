import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, View, RefreshControl, TouchableOpacity, Platform } from 'react-native';
import { useSelector } from 'react-redux';

import { NavigationProp, useNavigation } from '@react-navigation/native';
import { ApiCall } from '@/src/services/api';

import { RootState } from '@/src/redux/reducers/rootReducer';

import { PrayerPost } from '@/utils/types';
import PrayerItem from '../listItems/PrayerItem';
import { PrayerWallStackParamsList } from '@/src/navigator/types';
import StyledText from '../styled/Text';
import { Typography } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';

function PrayerWallEmpty() {
  return (
    <StyledText
      style={[
        Typography.body.x2M,
        {
          padding: spacing.x16,
          textAlign: 'center',
          transform:
            Platform.OS === 'ios' ? [{ rotate: '180deg' }, { scaleX: -1 }] : [{ rotate: '180deg' }],
        },
      ]}
    >
      No new prayers to see
    </StyledText>
  );
}

type PrayerWallComponentProps = {
  onOpenPost?: (postId: string) => void;
  onEditPost?: (postId: string) => void;
  onScrollOffsetChange?: (offsetY: number) => void;
  refreshSignal?: number;
};

function PrayerWallComponent({
  onOpenPost,
  onEditPost,
  onScrollOffsetChange,
  refreshSignal,
}: PrayerWallComponentProps) {
  const navigation = useNavigation<NavigationProp<PrayerWallStackParamsList>>();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [prayers, setPrayers] = useState<PrayerPost[]>([]);
  const [isScrollEnable, setIsScrollEnable] = useState(true);

  const [isEndOfList, setIsEndOfList] = useState(false);
  const requestSequenceRef = useRef(0);
  const hasSeenRefreshSignalRef = useRef(false);

  const extractPrayerEntries = (payload: unknown): PrayerPost[] => {
    if (Array.isArray(payload)) return payload as PrayerPost[];
    if (Array.isArray((payload as { content?: unknown })?.content)) {
      return (payload as { content: PrayerPost[] }).content;
    }
    if (Array.isArray((payload as { data?: unknown })?.data)) {
      return (payload as { data: PrayerPost[] }).data;
    }
    return [];
  };

  const getPrayerPosts = useCallback(
    async (pageNumber: number) => {
      const requestSequence = ++requestSequenceRef.current;
      setIsLoading(true);
      try {
        const res = await ApiCall({
          route: `prayer?page=${pageNumber}`,
          token,
          verb: 'get',
        });

        if (requestSequence !== requestSequenceRef.current) {
          return;
        }

        if (res?.status === 200) {
          const nextPosts = extractPrayerEntries(res?.response);
          if (pageNumber === 1) {
            setIsEndOfList(false);
            setPrayers(nextPosts);
          } else if (nextPosts.length < 1) {
            setIsEndOfList(true);
          } else {
            setPrayers((prev) => [...(prev ?? []), ...nextPosts]);
          }
        } else {
          console.log('error', res?.response);
        }
      } catch (e: any) {
        console.log(e.toString());
      } finally {
        if (requestSequence === requestSequenceRef.current) {
          setIsLoading(false);
          setRefreshing(false);
        }
      }
    },
    [token]
  );

  const refreshPrayerPosts = useCallback(() => {
    setRefreshing(true);
    setIsEndOfList(false);
    if (page === 1) {
      getPrayerPosts(1);
      return;
    }
    setPage(1);
  }, [getPrayerPosts, page]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshPrayerPosts();
    });

    return unsubscribe;
  }, [navigation, refreshPrayerPosts]);

  useEffect(() => {
    getPrayerPosts(page);
  }, [getPrayerPosts, page]);

  useEffect(() => {
    if (!hasSeenRefreshSignalRef.current) {
      hasSeenRefreshSignalRef.current = true;
      return;
    }
    refreshPrayerPosts();
  }, [refreshPrayerPosts, refreshSignal]);

  const removePost = async (type: string, id: string) => {
    try {
      const res = await ApiCall({
        route: `prayer/${id}`,
        verb: 'delete',
        token,
      });

      if (res?.status === 200) {
        setPage(1);
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  const editPost = async (id: string) => {
    if (onEditPost) {
      onEditPost(id);
      return;
    }
    navigation.navigate('Prayer', { postId: id });
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        inverted
        data={prayers}
        showsHorizontalScrollIndicator={false}
        onEndReached={() => {
          if (!isLoading && !refreshing && !isEndOfList) {
            setPage((prev) => prev + 1);
          }
        }}
        style={{
          flexGrow: 1,
        }}
        keyExtractor={(item, index) => {
          const postKey = item.postId ?? item.id ?? `row-${index}`;
          return `${postKey}-${index}`;
        }}
        refreshing={refreshing}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              refreshPrayerPosts();
            }}
          />
        }
        ListEmptyComponent={PrayerWallEmpty}
        onEndReachedThreshold={0.8}
        scrollEnabled={isScrollEnable}
        onScroll={(event) => {
          onScrollOffsetChange?.(event.nativeEvent.contentOffset.y);
        }}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => {
          const postId = item.postId ?? item.id;
          const openPost = () => {
            if (!postId) return;
            if (onOpenPost) {
              onOpenPost(postId);
              return;
            }
            navigation.navigate('Single', {
              postId,
            });
          };

          return (
            <TouchableOpacity onPress={openPost}>
              <PrayerItem
                editPost={editPost}
                removePost={removePost}
                item={item}
                index={index}
                onCommentsPress={openPost}
                onShowDismissCard={(e?: boolean) => setIsScrollEnable(!e)}
                limitContentLines
              />
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}
export default PrayerWallComponent;
