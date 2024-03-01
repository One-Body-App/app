import React, { useState, useRef, useEffect } from 'react';
import { View, FlatList, Text, Appearance } from 'react-native';
import { useSelector } from 'react-redux';
import MuxPlayer from '@mux/mux-player-react';
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';
import { RootState } from '@/src/redux/reducers/rootReducer';
import styles from '@/screens/home/watch/styles';
import { ApiCall } from '@/services/api';
import { FeedTypes } from '@/screens/home';
import BaseItem from '@/src/components/listItems/BaseItem';
import { AccountType, PostType } from '@/utils/types';
import StyledText from '@/src/components/styled/Text';
import { getHeight, getWidth } from '@/utils/ResponsiveFun';
import { isDarkMode } from '@/src/styles/colors';

function Watch() {
  const darkMode = Appearance.getColorScheme() === 'dark';
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [feedData, setFeedData] = useState<any>();
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
  const flatListRef = useRef(null);

  // Accede al estado del usuario
  const user = useSelector((state: RootState) => state.auth.getProfileData);

  const [reactionCounts, setReactionCounts] = useState({
    love: 0,
    praying: 0,
    happy: 0,
  });

  const getFeedData = async (type: FeedTypes, pageNumber: number) => {
    setIsLoading(true);
    try {
      const res = await ApiCall({
        route: `user/get-following-feed/${type}/${pageNumber}`,
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
        if (pageNumber === 1) {
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
      <View style={styles.videoContainer}>
        <Video
          source={{ uri: `https://stream.mux.com/${item.playBackId}` }}
          resizeMode="cover"
          style={styles.video}
        />
        <LinearGradient
          colors={
            darkMode
              ? ['transparent', '#00000040', '#000000']
              : ['transparent', '#ffffff40', '#ffffff']
          }
          style={styles.videoInfo}
        >
          <BaseItem
            postData={{
              commentNumber: item.comments.length,
              comments: item.comments,
              id: item.id.toString(),
              image: { url: 'https://cdn.onebodyapp.com/no-image-post.jpg' },
              myReaction: undefined,
              postlink: 'https://www1.cbn.com/content/sword-spirit-family-discussion-guide',
              reactions: [],
              title: item.content,
              type: PostType.rss,
            }}
            created={new Date(item.created)}
            userData={
              item.userData
                ? item.userData
                : {
                    _id: '63898902e2db37cc5f4abad0',
                    accountType: AccountType.organization,
                    instagramHandler: '',
                    interests: [],
                    name: 'The Christian Broadcasting Network',
                    profileImage: '',
                    twitterHandler: '',
                    username: 'the - christian - broadcasting - network',
                    website: 'https://www1.cbn.com/',
                  }
            }
            isApprovedInfluencer={item.userData.isApprovedInfluencer}
            onPress={() => {}}
            parentRefreshContent={undefined}
          >
            <View>
              <Text style={[{ color: darkMode ? 'white' : 'black' }, styles.videoDescription]}>
                {item.content}
              </Text>
            </View>
          </BaseItem>
        </LinearGradient>
      </View>
    );
  };

  useEffect(() => {
    getFeedData(FeedTypes.Watch, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={feedData}
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
      />
    </View>
  );
}

export default Watch;
