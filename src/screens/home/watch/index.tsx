import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  Button,
  Image,
  Dimensions,
} from 'react-native';
import { Heart, Message2, Share as ShareIcon } from 'iconsax-react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useSelector } from 'react-redux';
import MuxPlayer from '@mux/mux-player-react';
import Video from 'react-native-video';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { styles } from '@/screens/home/watch/styles';
import { spacing } from '@/src/styles/spacing';
import { ApiCall } from '@/services/api';
import { FeedTypes } from '@/screens/home';
import BaseItem from '@/src/components/listItems/BaseItem';
import { AccountType, PostType } from '@/utils/types';

function Watch() {
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

  const renderVideoItem2 = ({
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
        <BaseItem
          style={styles.videoInfo}
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
            <Text style={styles.videoDescription}>{item.content}</Text>
          </View>
        </BaseItem>
      </View>
    );
  };

  useEffect(() => {
    getFeedData(FeedTypes.Watch, 1);
  }, []);
  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={feedData}
        renderItem={renderVideoItem2}
        keyExtractor={(item) => item.id.toString()}
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
