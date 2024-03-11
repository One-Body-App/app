import React, { useState, useRef, useEffect } from 'react';

import { View, FlatList, RefreshControl, useWindowDimensions } from 'react-native';

import { useSelector } from 'react-redux';

import { useTheme } from '@react-navigation/native';

import { RootState } from '@/src/redux/reducers/rootReducer';

import { ApiCall } from '@/services/api';
import { FeedTypes } from '@/screens/home';

import { getHeight } from '@/utils/ResponsiveFun';
import VideoItem from './VideoItem';
import { WatchPost } from '@/utils/types';

function Watch() {
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [feedData, setFeedData] = useState<WatchPost[]>([]);
  const [page, setPage] = useState<number>(1);
  const [activeWatchReel, setActiveWatchReel] = useState<number>(0);
  const [viewHeight, setViewHeight] = useState<number>(1);
  const [isEndOfList, setIsEndOfList] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sharedVideoUrl, setSharedVideoUrl] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [savesCount, setSavesCount] = useState(0);
  const [sharesCount, setSharesCount] = useState(0);
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [commentText, setCommentText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const { height, width } = useWindowDimensions();

  // Accede al estado del usuario
  const { dark } = useTheme();

  const [reactionCounts, setReactionCounts] = useState({
    love: 0,
    praying: 0,
    happy: 0,
  });

  useEffect(() => {
    // getData(page);
    if (isRefreshing) {
      if (page === 1) {
        getFeedData();
      } else {
        setPage(1);
      }
      setIsEndOfList(false);
    }
  }, [isRefreshing]);

  const getFeedData = async () => {
    setIsLoading(true);
    try {
      const res = await ApiCall({
        route: `user/get-following-feed/${FeedTypes.Watch}/${page}`,
        token,
        verb: 'get',
      });
      let newFeedData: WatchPost[] = [];

      if (res?.status === 200) {
        newFeedData = [];
        const validPosts = res.response.map(async (i: any) => {
          try {
            const a = await fetch(`https://stream.mux.com/${i.playBackId}`);
            if (a.ok) {
              return i;
            }
            return null;
          } catch (error) {
            return null;
          }
        });
        const validPostsArray = await Promise.all(validPosts);
        const feedPosts = validPostsArray
          .filter((i: any) => !!i?.playBackId)
          .sort((a: any, b: any) => {
            const dateA = new Date(a.created);
            const dateB = new Date(b.created);
            return dateB.getTime() - dateA.getTime(); // Newest first
          });

        if (page === 1) {
          newFeedData = feedPosts ?? [];

          setIsEndOfList(false);
        } else {
          newFeedData = [...feedData, ...(feedPosts ?? [])].sort((a: any, b: any) => {
            const dateA = new Date(a.created);
            const dateB = new Date(b.created);
            return dateB.getTime() - dateA.getTime(); // Newest first
          });
          if (res?.response.length < 1) {
            setIsEndOfList(true);
          }
        }

        setFeedData(newFeedData);
      } else {
        // console.log('error', res?.response);
        setFeedData([]);
        setIsEndOfList(true);
      }

      setIsLoading(false);
      setIsRefreshing(false);
    } catch (e: any) {
      setFeedData([]);
      // console.log(`saga get twitter timline  error -- `, e.toString());
    }
  };

  const handleShare = (id: number) => {
    // Lógica para compartir el video
    setSharedVideoUrl(`https://www.example.com/video/${id}`);
    setSharesCount(sharesCount + 1);
  };

  const handleComment = () => {
    // Lógica para dejar un comentario
    setIsCommentModalVisible(true);
  };

  const handleSave = () => {
    // Lógica para guardar el video
    setSavesCount(savesCount + 1);
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      const { index } = viewableItems[0];
      setActiveWatchReel(index);
    }
  }).current;

  useEffect(() => {
    getFeedData();
  }, [page]);

  return (
    <View
      style={{ flex: 1 }}
      onLayout={(event) => {
        const { height } = event.nativeEvent.layout;
        setViewHeight(height);
      }}
    >
      <FlatList
        ref={flatListRef}
        data={feedData}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          return (
            <VideoItem
              index={index}
              activeInScreenIndex={activeWatchReel}
              item={item}
              viewHeight={viewHeight}
              width={width}
              fromSavedPosts={false}
              onShowDismissCard={(e?: boolean) => {
                // setIsScrollEnable(!e)
              }}
            />
          );
        }}
        keyExtractor={(item) => item.id.toString()}
        getItemLayout={(data, index) => ({
          length: getHeight(74.2), // Adjust height as needed
          offset: getHeight(74.2) * index,
          index,
        })}
        pagingEnabled
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
        }}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (!isLoading && !isRefreshing && !isEndOfList) {
            setPage(page + 1);
          }
        }}
        refreshing={isRefreshing}
        refreshControl={
          <RefreshControl
            enabled
            refreshing={isRefreshing}
            colors={
              dark
                ? ['rgba(18, 210, 217, 1)', 'rgba(18, 210, 217, 1)']
                : ['rgba(3, 47, 60, 1)', 'rgba(18, 107, 135, 1)']
            }
            tintColor={dark ? 'rgba(18, 210, 217, 1)' : 'rgba(18, 107, 135, 1)'}
            onRefresh={() => {
              setIsRefreshing(true);
            }}
          />
        }
        // CellRendererComponent={({ children, style, onLayout, onFocusCapture }) => (
        //   <View style={[style, { flex: 1 }]}>{children}</View>
        // )}
      />
    </View>
  );
}

export default Watch;
