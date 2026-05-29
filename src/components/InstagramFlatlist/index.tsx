import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  ListRenderItem,
  RefreshControl,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SceneRendererProps } from 'react-native-tab-view';
import { useSelector } from 'react-redux';
import { useTheme } from '@react-navigation/native';
import { styles } from './styles';
import Social from '@/assets/svg/Social.svg';
import { getFontSize, getHeight } from '@/utils/ResponsiveFun';
import { ApiCall } from '@/services/api';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { User } from '@/utils/types';
import SocialItem from '../listItems/SocialItem';
import { OpenURLButton } from '@/services/constants';
import Button from '../Button';
import GeneralStyle from '@/src/constants/GeneralStyle';
import { STANDARD_SECONDARY_LIST_BATCH_CONFIG } from '@/src/navigator/motionPolicy';
import { spacing } from '@/src/styles/spacing';
import useSharedImageViewer from '@/components/imageViewer/useSharedImageViewer';

function InstagramItemSeparator() {
  return <View style={{ padding: 7 }} />;
}

function InstagramFlatlist({ currentUser }: SceneRendererProps & { currentUser: User }) {
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [instagramPosts, setInstagramPosts] = useState<any>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const getInstagramData = useCallback(
    async (pageNumber: number) => {
      try {
        const res = await ApiCall({
          route: `user/get-social/instagram/${currentUser._id}/${pageNumber}?itemsPerPage=5`,
          verb: 'get',
          token,
        });

        if (res?.status == 200) {
          let instagramData = [];

          if (pageNumber == 1) {
            instagramData = res?.response ?? [];
            setInstagramPosts(instagramData);
          } else {
            setInstagramPosts((previousPosts: any[]) => [
              ...previousPosts,
              ...(res?.response ?? []),
            ]);
          }
        } else {
          console.log('error', res?.response);
        }
        setRefreshing(false);
      } catch (e: any) {
        setRefreshing(false);
      }
    },
    [currentUser._id, token]
  );

  useEffect(() => {
    if (currentUser) {
      getInstagramData(1);
    }
  }, [currentUser, getInstagramData]);
  const [visibleItemsIndex, setVisibleItemsIndex] = useState<number[]>([]);

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setVisibleItemsIndex(viewableItems.map((item: any) => item.index));
    }
  }, []);

  const viewabilityConfigCallbackPairs = useRef([
    {
      viewabilityConfig: {
        minimumViewTime: 100,
        itemVisiblePercentThreshold: 75,
      },
      onViewableItemsChanged,
    },
  ]);
  const { colors } = useTheme();
  const [isScrollEnable, setIsScrollEnable] = useState(true);
  const { width } = useWindowDimensions();
  const { imageViewer, openImages } = useSharedImageViewer();
  const socialItemContentWidth = Math.max(width - spacing.x16 * 2 - 14, 0);
  const socialPostviewStyle = useMemo(() => ({ backgroundColor: colors.card }), [colors.card]);
  const handleShowDismissCard = useCallback((dismissed?: boolean) => {
    setIsScrollEnable(!dismissed);
  }, []);
  const renderInstagramItem: ListRenderItem<any> = useCallback(
    ({ item, index }) => (
      <SocialItem
        index={index}
        contentWidth={socialItemContentWidth}
        onOpenImages={openImages}
        onShowDismissCard={handleShowDismissCard}
        visible={
          visibleItemsIndex && visibleItemsIndex.length > 0
            ? visibleItemsIndex?.indexOf(index) > -1
            : false
        }
        itemData={item}
        socialPostviewStyle={socialPostviewStyle}
      />
    ),
    [
      handleShowDismissCard,
      openImages,
      socialItemContentWidth,
      socialPostviewStyle,
      visibleItemsIndex,
    ]
  );

  if (instagramPosts.length) {
    return (
      <>
        <FlatList
          data={instagramPosts}
          viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
          contentContainerStyle={{ marginTop: getHeight(1) }}
          showsHorizontalScrollIndicator={false}
          ItemSeparatorComponent={InstagramItemSeparator}
          scrollEnabled={isScrollEnable}
          renderItem={renderInstagramItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              enabled
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await getInstagramData(1);
              }}
            />
          }
          ListFooterComponent={() => {
            return (
              <Button
                text="View more on Instagram"
                // btnStyle={{
                //   ...GeneralStyle.btn,
                //   marginHorizontal: 20,
                //   // backgroundColor: colors.background,
                // }}
                btnTextStyle={{
                  marginHorizontal: 20,
                  color: '#70747D',
                  fontSize: 14,
                }}
                onPress={() => {
                  OpenURLButton(
                    `https://instagram.com/${currentUser.influencerProfile?.instagramHandler}`,
                    true
                  );
                }}
              />
            );
          }}
          removeClippedSubviews={STANDARD_SECONDARY_LIST_BATCH_CONFIG.removeClippedSubviews}
          initialNumToRender={STANDARD_SECONDARY_LIST_BATCH_CONFIG.initialNumToRender}
          maxToRenderPerBatch={STANDARD_SECONDARY_LIST_BATCH_CONFIG.maxToRenderPerBatch}
          updateCellsBatchingPeriod={STANDARD_SECONDARY_LIST_BATCH_CONFIG.updateCellsBatchingPeriod}
          windowSize={STANDARD_SECONDARY_LIST_BATCH_CONFIG.windowSize}
        />
        {imageViewer}
      </>
    );
  }
  return null;
}
export default InstagramFlatlist;
