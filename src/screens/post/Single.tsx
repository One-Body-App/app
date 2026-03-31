import { StackScreenProps } from '@react-navigation/stack';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useTheme } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/ionicons';
import useMountEffect from '@/src/hooks/useMountEffect';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { ApiCall } from '@/src/services/api';
import StyledText from '@/components/styled/Text';
import { MainStackParamList } from '@/src/navigator/types';
import { Colors } from '@/src/styles';
import { borderWidth } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import { CommentPost, PostType, SocialPost } from '@/utils/types';
import CommentThread from '@/components/comments/Thread';
import SocialItem from '@/components/listItems/SocialItem';
import {
  getCommentId,
  toSerializableCommentSnapshot,
} from '@/components/comments/commentListUtils';
import useSharedImageViewer from '@/components/imageViewer/useSharedImageViewer';

type Props = StackScreenProps<MainStackParamList, 'SinglePost'>;

function SinglePost({ navigation, route }: Props) {
  const [post, setPost] = useState<SocialPost>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);

  const token = useSelector((state: RootState) => state.auth.userToken);
  const { colors, dark } = useTheme();
  const { width } = useWindowDimensions();
  const { imageViewer, openImages } = useSharedImageViewer();
  const socialItemContentWidth = Math.max(width - spacing.x16 * 2, 0);
  const backNavigationInFlightRef = useRef(false);
  const resetToHomeFeed = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'MainRoot',
          params: {
            screen: 'Main',
            params: {
              screen: 'HomeTab',
              params: {
                screen: 'Home',
              },
            },
          },
        } as any,
      ],
    });
  }, [navigation]);
  const handleBackPress = () => {
    if (backNavigationInFlightRef.current) {
      return;
    }

    backNavigationInFlightRef.current = true;
    setTimeout(() => {
      backNavigationInFlightRef.current = false;
    }, 350);

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    resetToHomeFeed();
  };

  const getPost = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await ApiCall({
        route: `social/post/${route.params?.postId}`,
        token,

        verb: 'get',
      });

      setIsLoading(false);

      if (result.status === 200) {
        if (result.response) {
          setPost(result.response);
        } else {
          setIsNotFound(true);
        }
      } else {
        setIsNotFound(true);
      }
    } catch (e) {
      setIsLoading(false);
      setIsNotFound(true);
    }
  }, [route.params?.postId, token]);

  // useEffect(() => {
  //   if (post) {
  //     navigation.setOptions({
  //       title: `${post.userData.name}'s Post`,
  //     });
  //   }
  // }, [post]);

  const removePost = async (type: string, id: string) => {
    try {
      const res = await ApiCall({
        route: `social/${id}`,
        verb: 'delete',
        token,
      });

      if (res?.status === 200) {
        await getPost();
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  const editPost = async (id: string) => {
    navigation.navigate('Post', { postId: id });
  };

  const openCommentThread = useCallback(
    (comment: CommentPost) => {
      const commentId = getCommentId(comment);
      const currentPostId = route.params?.postId;
      if (!commentId || !currentPostId) {
        return;
      }

      navigation.push('SinglePost', {
        postId: currentPostId,
        threadRootCommentId: commentId,
        threadRootCommentSnapshot: toSerializableCommentSnapshot(comment),
      });
    },
    [navigation, route.params?.postId]
  );

  useMountEffect(() => {
    if (route.params?.postId) {
      getPost();
    }
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {Platform.OS === 'android' ? (
        <>
          <StatusBar
            barStyle={dark ? 'light-content' : 'dark-content'}
            backgroundColor={colors.background}
          />
          <View style={singleStyles.header}>
            <TouchableOpacity
              onPress={handleBackPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={singleStyles.backButton}
            >
              <Icon
                name="chevron-back"
                size={28}
                color={dark ? colors.text : Colors.primary.brand}
              />
            </TouchableOpacity>
            <Text style={[singleStyles.headerTitle, { color: colors.text }]}>Comment</Text>
          </View>
        </>
      ) : null}
      {post ? (
        <CommentThread
          type={PostType.social}
          postId={route.params?.postId ?? ''}
          threadRootCommentId={route.params?.threadRootCommentId}
          threadRootCommentSnapshot={route.params?.threadRootCommentSnapshot}
          onOpenCommentThread={openCommentThread}
          onPostRefresh={getPost}
          headerContainerStyle={{
            paddingHorizontal: 0,
            paddingTop: 0,
            paddingBottom: 0,
            borderBottomWidth: 0,
          }}
          header={
            <SocialItem
              editPost={editPost}
              removePost={removePost}
              itemData={post}
              visible
              contentWidth={socialItemContentWidth}
              onOpenImages={openImages}
              socialPostviewStyle={{
                marginHorizontal: 0,
                marginBottom: 0,
                borderRadius: 0,
                borderWidth: 0,
                borderTopWidth: 0,
                borderRightWidth: 0,
                borderLeftWidth: 0,
                borderBottomColor: Colors.neutral[800],
                borderBottomWidth: borderWidth.thin,
                shadowColor: 'transparent',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0,
                shadowRadius: 0,
                elevation: 0,
                backgroundColor: 'transparent',
              }}
            />
          }
        />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          {isLoading ? (
            <ActivityIndicator
              animating={isLoading}
              size="small"
              color={Colors.neutral[200]}
              style={{ marginRight: spacing.x10 }}
            />
          ) : null}
          {!isLoading && isNotFound ? <StyledText>Not Found</StyledText> : null}
        </View>
      )}
      {imageViewer}
    </SafeAreaView>
  );
}

const singleStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default SinglePost;
