import React, { useState, useRef } from 'react';
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

function Watch() {
  const [sharedVideoUrl, setSharedVideoUrl] = useState('');
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [savesCount, setSavesCount] = useState(0);
  const [sharesCount, setSharesCount] = useState(0);
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [commentText, setCommentText] = useState('');
  const flatListRef = useRef(null);

  // Accede al estado del usuario
  const user = useSelector((state: RootState) => state.auth.getProfileData);

  const reactionTypes = {
    love: 0,
    praying: 0,
    happy: 0,
  };

  const videos = [
    {
      id: 1,
      videoUrl: 'https://stream.mux.com/3OyLQ9njVCRCzZ7y00ap002IOElax4mVXVXKe027Dx9uic.m3u8',
      description:
        'Explorando las bellezas naturales de la costa, descubrimos la magia de la naturaleza en su máximo esplendor',
    },
    {
      id: 2,
      videoUrl: 'https://stream.mux.com/3OyLQ9njVCRCzZ7y00ap002IOElax4mVXVXKe027Dx9uic.m3u8',
      description:
        'Explorando las bellezas naturales de la costa, descubrimos la magia de la naturaleza en su máximo esplendor',
    },
  ];

  const handleShare = () => {
    // Lógica para compartir el video
    setSharedVideoUrl(`https://www.example.com/video/`);
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

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      const { index } = viewableItems[0];
    }
  }).current;

  const renderVideoItem = ({ item }) => {
    return (
      <View style={styles.videoContainer}>
        <Video source={{ uri: item.videoUrl }} resizeMode="cover" style={styles.video} />

        <View style={styles.videoInfo}>
          {/* Footer */}
          <View style={styles.userInfo}>
            {/* Usario */}
            <Image source={{ uri: user?.profileImage }} style={styles.profilePhoto} />
            <Text style={styles.userName}>{user?.name}</Text>
            <FontAwesome name="ellipsis-v" size={15} color="white" style={styles.ellipsisIcon} />
          </View>

          <View>
            {/* Descripcion */}
            <Text style={styles.videoDescription}>{item.description}</Text>
          </View>

          <View>
            {/* reacciones */}
            <View />

            {/* botones */}
            <View style={styles.iconsContainer}>
              <TouchableOpacity style={styles.icons} onPress={() => setLikesCount(likesCount + 1)}>
                <Heart size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.icons} onPress={handleComment}>
                <Message2 size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.icons} onPress={handleSave}>
                <FontAwesome name="bookmark-o" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.icons, { marginLeft: 195 }]}
                onPress={() => handleShare(item.id)}
              >
                {Platform.OS === 'android' ? (
                  <ShareIcon size={24} color="white" />
                ) : (
                  <ShareIcon color="white" height={25} width={25} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={videos}
        renderItem={renderVideoItem}
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
