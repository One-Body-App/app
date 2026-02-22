import { StackScreenProps } from '@react-navigation/stack';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, SafeAreaView, StatusBar, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useTheme } from '@react-navigation/native';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { ApiCall } from '@/src/services/api';
import StyledText from '@/components/styled/Text';
import Header from '@/components/Header';
import GoBackIcon from '@/components/GoBackIcon';
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
  const { colors, dark } = useTheme();
  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('MainRoot');
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

  useEffect(() => {
    if (route.params?.postId) {
      getPost();
    }
  }, [getPost, route.params?.postId]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {Platform.OS === 'android' ? (
        <>
          <StatusBar
            barStyle={dark ? 'light-content' : 'dark-content'}
            backgroundColor={colors.background}
          />
          <Header
            title="Comment"
            hideBorder
            leftView={
              <GoBackIcon
                color={dark ? colors.text : Colors.primary.brand}
                goBack={handleBackPress}
              />
            }
            RightView={<View style={{ width: 20 }} />}
          />
        </>
      ) : null}
      {post ? (
        <CommentThread
          type={PostType.social}
          postId={route.params?.postId ?? ''}
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
    </SafeAreaView>
  );
}

export default SinglePost;
