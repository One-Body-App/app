import React, { useState } from 'react';
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
} from 'react-native';
import { Heart, Message2, Share as ShareIcon } from 'iconsax-react-native';
import Video from 'react-native-video';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { spacing } from '@/src/styles/spacing';

function Watch() {
  const [sharedVideoUrl, setSharedVideoUrl] = useState('');
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [savesCount, setSavesCount] = useState(0);
  const [sharesCount, setSharesCount] = useState(0);
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [commentText, setCommentText] = useState('');

  const videos = [
    {
      id: 1,
      videoUrl: 'https://stream.mux.com/00sJSYhNisjT5xQElk87ABgWOcuGmPw02VET8KGNtuRB4.m3u8',
      width: 1280,
      height: 720,
      description: 'Description video 1',
    },
    {
      id: 2,
      videoUrl: 'https://stream.mux.com/00sJSYhNisjT5xQElk87ABgWOcuGmPw02VET8KGNtuRB4.m3u8',
      width: 1280,
      height: 720,
      description: 'Description video 2',
    },
    {
      id: 3,
      videoUrl: 'https://stream.mux.com/00sJSYhNisjT5xQElk87ABgWOcuGmPw02VET8KGNtuRB4.m3u8',
      width: 1280,
      height: 720,
      description: 'Description video 3',
    },
  ];

  const handleShare = (videoUrl) => {
    // Lógica para compartir el video
    setSharedVideoUrl(`https://www.example.com/video/${videoUrl}`);
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

  const renderVideoItem = ({ item }) => {
    const aspectRatio = item.width / item.height;
    const containerWidth = Dimensions.get('window').width;
    const containerHeight = containerWidth / aspectRatio;

    return (
      <View style={styles.videoContainer}>
        <Video
          source={{ uri: item.videoUrl }}
          style={[{ width: containerWidth, height: containerHeight }]}
          resizeMode="cover"
          controls
        />
        <View style={styles.videoInfo}>
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
        data={videos}
        renderItem={renderVideoItem}
        keyExtractor={(item) => item.id.toString()}
        pagingEnabled
        decelerationRate="normal"
      />
      {/* Mostrar la URL compartida si es necesario */}
      <Text>{sharedVideoUrl}</Text>

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
    backgroundColor: 'white',
  },
  videoInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: spacing.x5,
  },
  videoDescription: {
    color: 'white',
    fontSize: spacing.x13,
    left: spacing.x5,
    marginVertical: spacing.x30,
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
});

export default Watch;
