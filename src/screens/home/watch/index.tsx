import React, { useState, useRef, useEffect } from 'react';

import {
  View,
  FlatList,
  Text,
  RefreshControl,
  useWindowDimensions,
  Appearance,
} from 'react-native';

import { useSelector } from 'react-redux';

import Video from 'react-native-video';

import { useTheme } from '@react-navigation/native';

import LinearGradient from 'react-native-linear-gradient';

import { RootState } from '@/src/redux/reducers/rootReducer';
import styles from '@/screens/home/watch/styles';
import { ApiCall } from '@/services/api';
import { FeedTypes } from '@/screens/home';
import BaseItem from '@/src/components/listItems/BaseItem';
import { PostType } from '@/utils/types';
import StyledText from '@/src/components/styled/Text';

import { Colors } from '@/src/styles';
import { NO_POST_IMAGE_URL } from '@/src/services/constants';

import { getHeight } from '@/utils/ResponsiveFun';

function Watch() {
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [feedData, setFeedData] = useState<any>();
  const [page, setPage] = useState<number>(1);
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
      setPage(1);
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
      let newFeedData = [];

      if (res?.status === 200) {
        newFeedData = [];
        const feedPosts = res.response
          .filter((i: any) => !!i.playBackId)
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
    } catch (e: any) {
      setFeedData([]);
      // console.log(`saga get twitter timline  error -- `, e.toString());
    }

    setIsLoading(false);
    setIsRefreshing(false);
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
    }
  }).current;

  const renderVideoItem = ({
    item,
  }: {
    item: {
      id: number;
      videoUrl: string;
      content: string;
      videoId: string;
      playBackId: string;
      userData: any;
      comments: any[];
      created: string;
      isApprovedInfluencer: boolean;
    };
  }) => {
    return (
      <View style={[styles.videoContainer, { height: viewHeight, width }]}>
        <Video
          source={{ uri: `https://stream.mux.com/${item.playBackId}` }}
          resizeMode="cover"
          style={styles.video}
        />

        <LinearGradient colors={['transparent', '#00000040', '#000000']} style={styles.videoInfo}>
          <BaseItem
            style={styles.videoInfo}
            transparency
            postData={{
              commentNumber: item.comments.length,
              comments: item.comments,
              id: item.id.toString(),
              image: { url: NO_POST_IMAGE_URL },
              myReaction: undefined,
              reactions: [],
              title: item.content,
              type: PostType.rss,
            }}
            created={new Date(item.created)}
            userData={item.userData}
            isApprovedInfluencer={item.userData.isApprovedInfluencer}
            onPress={() => {}}
            parentRefreshContent={undefined}
          >
            <View>
              <Text style={[styles.videoDescription, { color: Colors.neutral[600] }]}>
                {item.content}
              </Text>
            </View>
          </BaseItem>
        </LinearGradient>
      </View>
    );
  };

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
        renderItem={renderVideoItem}
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
        refreshing={isLoading}
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
