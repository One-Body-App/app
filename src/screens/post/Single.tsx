import { StackScreenProps } from '@react-navigation/stack';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useTheme } from '@react-navigation/native';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { ApiCall } from '@/src/services/api';
import StyledText from '@/components/styled/Text';
import { MainStackParamList } from '@/src/navigator/types';
import { Colors } from '@/src/styles';
import { borderWidth } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import { PostType, SocialPost } from '@/utils/types';
import CommentThread from '@/components/comments/Thread';
import SocialItem from '@/components/listItems/SocialItem';

type Props = StackScreenProps<MainStackParamList, 'SinglePost'>;

function SinglePost({ navigation, route }: Props) {
  const [post, setPost] = useState<SocialPost>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);

  const token = useSelector((state: RootState) => state.auth.userToken);
  const { colors } = useTheme();

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

  useEffect(() => {
    if (route.params?.postId) {
      getPost();
    }
  }, [getPost, route.params?.postId]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {post ? (
        <CommentThread
          type={PostType.social}
          postId={route.params?.postId ?? ''}
          onPostRefresh={getPost}
          header={
            <SocialItem
              editPost={editPost}
              removePost={removePost}
              itemData={post}
              socialPostviewStyle={{
                borderBottomColor: Colors.neutral[800],
                borderBottomWidth: borderWidth.thin,
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
    </SafeAreaView>
  );
}

export default SinglePost;
