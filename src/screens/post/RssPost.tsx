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

import { spacing } from '@/src/styles/spacing';
import { ArticleType, PostType, SocialPost } from '@/utils/types';

import ArticleItem from '@/src/components/listItems/ArticleItem';
import globalStyle from '@/components/listItems/style';
import VideoItem from '../home/watch/VideoItem';
import CommentThread from '@/components/comments/Thread';

type Props = StackScreenProps<MainStackParamList, 'SingleRss'>;
function RssPost({ navigation, route }: Props) {
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

  const showModal = (_item: ArticleType) => {};

  const getRssPost = useCallback(async () => {
    setIsLoading(true);

    try {
      const result = await ApiCall({
        route: `rss/${route.params?.postId}`,
        token,

        verb: 'get',
      });
      console.log('🚀 ~ RssPost ~ route:', route.params?.postId);
      console.log('🚀 ~ getRssPost ~ result :', result);
      // 🚀 ~ RssPost ~ route: 65fde17b81cdc6d0267dcb34
      // getRssPost ~ result : {"response": "", "status": 200}
      // maybe its just returning data from backend.

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

  useEffect(() => {
    if (route.params?.postId) {
      getRssPost();
    }
  }, [getRssPost, route.params?.postId]);

  const commentType = route.params?.postType === 'watch' ? PostType.watch : PostType.rss;

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
          type={commentType}
          postId={route.params?.postId ?? ''}
          enablePagination
          onPostRefresh={getRssPost}
          scrollToEndOnPublish
          header={
            route.params?.postType === 'watch' ? (
              <VideoItem
                currentIndex={0}
                item={post}
                viewHeight={200}
                width={50}
                fromSavedPosts={false}
                onShowDismissCard={undefined}
              />
            ) : (
              <ArticleItem
                item={post}
                imageSizeType="contain"
                blogPostStyle={{
                  marginBottom: spacing.x24,
                  backgroundColor: colors.card,
                }}
                blogPostImageStyle={globalStyle.newspostimage}
                showModal={showModal}
              />
            )
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
          ) : (
            <StyledText>Not Found</StyledText>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

export default RssPost;
