import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useTheme } from '@react-navigation/native';
import {
  GiphyDialog,
  GiphyDialogEvent,
  GiphyDialogMediaSelectEventHandler,
  GiphyMedia,
} from '@giphy/react-native-sdk';
import { useToast } from 'react-native-toast-notifications';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { ApiCall } from '@/src/services/api';
import { Colors } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import StyledText from '@/components/styled/Text';
import CommentItem from './CommentItem';
import CommentField from './Field';
import { CommentPost, PostType, SocialPostReaction } from '@/utils/types';

interface CommentThreadProps {
  postId: string;
  type: PostType;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  enablePagination?: boolean;
  hideComposer?: boolean;
  onPostRefresh?: () => void;
  onUserPress?: (userId: string) => void;
  listStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollToEndOnPublish?: boolean;
}

function CommentThreadEmptyState({ isLoading }: { isLoading: boolean }) {
  if (isLoading) return <ActivityIndicator />;
  return (
    <View style={{ padding: spacing.x16 }}>
      <StyledText style={{ color: Colors.neutral[400] }}>No comments yet.</StyledText>
    </View>
  );
}

function CommentThread({
  postId,
  type,
  header,
  footer,
  enablePagination,
  hideComposer,
  onPostRefresh,
  onUserPress,
  listStyle,
  contentContainerStyle,
  scrollToEndOnPublish,
}: CommentThreadProps) {
  const token = useSelector((state: RootState) => state.auth.userToken);
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const { colors } = useTheme();
  const toast = useToast();
  const listRef = useRef<FlatList<CommentPost>>(null);
  const activeRequest = useRef(0);
  const isMounted = useRef(true);

  const [comments, setComments] = useState<CommentPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [isEndOfList, setIsEndOfList] = useState(false);
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string>('');
  const [mediaGif, setGif] = useState<GiphyMedia | null>(null);

  const listHeader = useMemo(() => {
    if (!header) return null;
    return <View style={{ marginBottom: spacing.x10 }}>{header}</View>;
  }, [header]);

  const listFooter = useMemo(() => {
    if (!footer) return null;
    return <View style={{ marginTop: spacing.x13 }}>{footer}</View>;
  }, [footer]);

  const fetchComments = useCallback(
    async (pageToLoad: number, reset?: boolean) => {
      if (!postId) return;
      const requestId = ++activeRequest.current;
      setIsLoading(true);
      try {
        const result = await ApiCall({
          route: `comments/${type}/${postId}?page=${pageToLoad}`,
          token,
          verb: 'get',
        });

        if (!isMounted.current || requestId !== activeRequest.current) {
          return;
        }
        setIsLoading(false);
        setIsRefreshing(false);

        if (result.status === 200) {
          const nextComments = result?.response?.content ?? [];

          if (reset || pageToLoad === 1) {
            setComments(nextComments);
            setIsEndOfList(nextComments.length < 1);
          } else {
            setComments((prev) => [...prev, ...nextComments]);
            setIsEndOfList(nextComments.length < 1);
          }
        }
      } catch (e) {
        if (!isMounted.current || requestId !== activeRequest.current) {
          return;
        }
        setIsRefreshing(false);
        setIsLoading(false);
      }
    },
    [postId, token, type]
  );

  const refreshContent = () => {
    setIsEndOfList(false);
    setPage(1);
    setIsRefreshing(true);
    fetchComments(1, true);
  };

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    setComments([]);
    setPage(1);
    setIsEndOfList(false);
    if (postId) {
      fetchComments(1, true);
    }
  }, [fetchComments, postId, type]);

  useEffect(() => {
    if (!enablePagination) return;
    if (page > 1) {
      fetchComments(page);
    }
  }, [enablePagination, fetchComments, page]);

  useEffect(() => {
    const handler: GiphyDialogMediaSelectEventHandler = (e) => {
      setGif(e.media);
      GiphyDialog.hide();
    };
    const listener = GiphyDialog.addListener(GiphyDialogEvent.MediaSelected, handler);
    return () => {
      listener.remove();
    };
  }, []);

  useEffect(() => {
    if (!isEditingComment) {
      setGif(null);
    }
  }, [isEditingComment]);

  const publishComment = async (content?: string) => {
    if (!postId) return;
    setIsLoading(true);
    try {
      const result = await ApiCall({
        route: `comments/${type}/${postId}`,
        token,
        verb: 'post',
        params: {
          content,
          gif: mediaGif,
        },
      });

      setIsLoading(false);

      if (result.status === 200) {
        setGif(null);
        refreshContent();
        if (onPostRefresh) onPostRefresh();
        if (scrollToEndOnPublish) {
          requestAnimationFrame(() => {
            listRef.current?.scrollToEnd({ animated: true });
          });
        }
      }
    } catch (e) {
      setIsLoading(false);
    }
  };

  const editComment = async (commentId: string, content: string) => {
    if (!postId) return;
    try {
      const result = await ApiCall({
        route: `comments/${type}/${postId}/${commentId}`,
        verb: 'patch',
        token,
        params: {
          content,
          gif: mediaGif,
        },
      });

      if (result?.status === 200) {
        refreshContent();
        toast.show('Comment modified successfully', {
          id: 'successMessage',
          type: 'success',
          placement: 'bottom',
        });
        if (onPostRefresh) onPostRefresh();
      }
    } catch (e) {
      console.log('comment edit error -- ', e);
    }
  };

  const removeComment = async (_type: string, commentId: string) => {
    if (!postId) return;
    try {
      const result = await ApiCall({
        route: `comments/${type}/${postId}/${commentId}`,
        verb: 'delete',
        token,
      });

      if (result?.status === 200) {
        refreshContent();
        if (onPostRefresh) onPostRefresh();
      }
    } catch (e) {
      console.log('comment delete error -- ', e);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={listRef}
        data={comments}
        style={listStyle}
        contentContainerStyle={[
          { paddingBottom: hideComposer ? spacing.x16 : spacing.x72 },
          contentContainerStyle,
        ]}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        keyExtractor={(item, index) => `${item.commentId ?? item._id ?? index}`}
        onEndReachedThreshold={0.8}
        onEndReached={() => {
          if (enablePagination && !isLoading && !isRefreshing && !isEndOfList) {
            setPage((prev) => prev + 1);
          }
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              refreshContent();
            }}
          />
        }
        ListEmptyComponent={<CommentThreadEmptyState isLoading={isLoading} />}
        renderItem={({ item }) => {
          let myReaction: SocialPostReaction | undefined;

          item.reactions?.forEach((reaction: SocialPostReaction) => {
            if (reaction.userId === user?._id) {
              myReaction = reaction;
            }
          });

          return (
            <CommentItem
              removePost={removeComment}
              editCommentAction={editComment}
              onPress={() => {
                if (onUserPress && item.userData?._id) {
                  onUserPress(item.userData._id);
                }
              }}
              setEditingComment={(isEditing: boolean) => {
                if (isEditing) setGif(item.gif ?? null);
                setIsEditingComment(isEditing);
                if (item.commentId) setEditingCommentId(item.commentId);
              }}
              postData={{
                id: item.commentId,
                content: item.content,
                reactions: item.reactions,
                myReaction,
                edited: item.edited,
                gif: isEditingComment && editingCommentId === item.commentId ? mediaGif : item.gif,
              }}
              userData={item.userData}
            />
          );
        }}
      />

      {!hideComposer && !isEditingComment ? (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: Colors.neutral[700],
            backgroundColor: colors.background,
          }}
        >
          <CommentField
            mediaGif={mediaGif}
            setGif={setGif}
            publishComment={publishComment}
            isEditingComment={false}
          />
        </View>
      ) : null}
    </View>
  );
}

export default CommentThread;
