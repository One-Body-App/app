import React, { useState, useRef } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  Button,
  Image,
} from 'react-native';
import { Heart, Message2, Share as ShareIcon } from 'iconsax-react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useSelector } from 'react-redux';
import MuxPlayer from '@mux/mux-player-react';
import { RootState } from '@/src/redux/reducers/rootReducer';
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

  const videos = [
    {
      id: 1,
      videoUrl: 'https://stream.mux.com/3OyLQ9njVCRCzZ7y00ap002IOElax4mVXVXKe027Dx9uic.m3u8',
      description: 'Description video 1',
    },
    {
      id: 2,
      videoUrl: 'https://stream.mux.com/3OyLQ9njVCRCzZ7y00ap002IOElax4mVXVXKe027Dx9uic.m3u8',
      description: 'Description video 2',
    },
    {
      id: 3,
      videoUrl: 'https://stream.mux.com/3OyLQ9njVCRCzZ7y00ap002IOElax4mVXVXKe027Dx9uic.m3u8',
      description: 'Description video 3',
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
      // Obtén el primer video visible
      const firstVisibleVideo = viewableItems.find((item) => item.index !== undefined);
      if (firstVisibleVideo) {
        const { index } = viewableItems[0];
        setSharedVideoUrl(
          `https://stream.mux.com/3OyLQ9njVCRCzZ7y00ap002IOElax4mVXVXKe027Dx9uic.m3u8${videos[index].id}`
        );
      }
    }
  }).current;

  const renderVideoItem = ({ item }) => {
    return (
      <View style={styles.videoContainer}>
        <View style={styles.videoInfo}>
          <View style={styles.userInfoContainer}>
            <View style={styles.userInfo}>
              <Image source={{ uri: user?.profileImage }} style={styles.profilePhoto} />
              <Text style={styles.userName}>{user?.name}</Text>
              <FontAwesome name="ellipsis-v" size={15} color="white" style={{ marginLeft: 330 }} />
            </View>
          </View>

          <Text style={styles.videoDescription}>{item.description}</Text>
          <TouchableOpacity style={styles.iconHeader} onPress={() => setLikesCount(likesCount + 1)}>
            <Heart size={24} color="white" />
            <Text style={styles.iconCount}>{likesCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconComment} onPress={handleComment}>
            <Message2 size={24} color="white" />
            <Text style={styles.iconCount}>{commentsCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconSave} onPress={handleSave}>
            <FontAwesome name="bookmark-o" size={24} color="white" />
            <Text style={styles.iconCount}>{savesCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sendIconContainer} onPress={() => handleShare(item.id)}>
            {Platform.OS === 'android' ? (
              <ShareIcon size={24} color="white" />
            ) : (
              <ShareIcon color="white" height={25} width={25} />
            )}
            <Text style={styles.iconCount}>{sharesCount}</Text>
          </TouchableOpacity>
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

      {/* Modal para agregar comentarios */}
      <Modal
        visible={isCommentModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsCommentModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TextInput
              placeholder="Escribe tu comentario"
              value={commentText}
              onChangeText={setCommentText}
              style={styles.input}
            />
            <Button
              title="Comment"
              onPress={() => {
                setCommentsCount(commentsCount + 1);
                setIsCommentModalVisible(false);
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  videoContainer: {
    backgroundColor: 'black',
    height: Dimensions.get('window').height,
    marginBottom: 20,
  },
  videoInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: spacing.x5,
  },
  userName: {
    color: 'white',
    fontSize: spacing.x13,
    left: spacing.x16,
    marginBottom: spacing.x10,
    marginVertical: spacing.x10,
  },
  videoDescription: {
    color: 'white',
    fontSize: spacing.x13,
    left: spacing.x5,
    marginBottom: spacing.x30,
  },
  iconHeader: {
    position: 'absolute',
    bottom: spacing.x5,
    left: spacing.x5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconComment: {
    position: 'absolute',
    bottom: spacing.x5,
    left: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSave: {
    position: 'absolute',
    bottom: spacing.x5,
    left: 80,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sendIconContainer: {
    position: 'absolute',
    bottom: spacing.x5,
    right: spacing.x5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCount: {
    color: 'white',
    marginLeft: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: spacing.x5,
    borderRadius: spacing.x5,
    elevation: 5,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
    marginBottom: spacing.x5,
  },
  profilePhoto: {
    width: spacing.x32,
    height: spacing.x32,
    borderRadius: spacing.x20,
    left: spacing.x10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default Watch;
