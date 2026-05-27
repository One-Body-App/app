/* eslint-disable global-require */
import React, { useCallback } from 'react';
import { FlatList, Image, Text, Pressable, View } from 'react-native';
import Entypo from '@react-native-vector-icons/entypo';
import AntDesign from '@react-native-vector-icons/ant-design';
import { STANDARD_SECONDARY_LIST_BATCH_CONFIG } from '@/src/navigator/motionPolicy';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import { styles } from './styles';

type TopicItem = {
  id: string;
  name: string;
};

type ArticleItem = {
  id: string;
  title: string;
  source: string;
};

type SearchContainRow =
  | {
      id: string;
      type: 'header';
      title: string;
      resultLabel?: string;
      showViewAll?: boolean;
      marginTop?: number;
    }
  | {
      id: string;
      type: 'topic-row';
      items: TopicItem[];
    }
  | {
      id: string;
      type: 'article-row';
      item: ArticleItem;
      compact?: boolean;
    };

const TOPIC_ITEMS: TopicItem[] = [
  { id: 'topic-spirituality', name: 'Spirituality' },
  { id: 'topic-bible', name: 'Bible' },
  { id: 'topic-world', name: 'World' },
  { id: 'topic-relationships', name: 'Relationships' },
];

const NEWS_ITEMS: ArticleItem[] = [
  {
    id: 'news-1',
    title: 'U.S. Catholic Bishops to Discuss Banning Biden from Communion...',
    source: 'Christianity Today',
  },
  {
    id: 'news-2',
    title: 'Faith communities continue adapting outreach for a digital audience...',
    source: 'Christianity Today',
  },
];

const BLOG_ITEMS: ArticleItem[] = [
  {
    id: 'blog-1',
    title: 'How ministry leaders are building healthier volunteer systems this year...',
    source: 'Christianity Today',
  },
  {
    id: 'blog-2',
    title: 'Small-group rhythms that help communities stay connected through change...',
    source: 'Christianity Today',
  },
];

const chunkTopics = (items: TopicItem[], size: number) => {
  const rows: TopicItem[][] = [];
  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }
  return rows;
};

const SEARCH_CONTAIN_ROWS: SearchContainRow[] = [
  {
    id: 'header-topics',
    type: 'header',
    title: 'Topics',
    marginTop: getHeight(1),
  },
  ...chunkTopics(TOPIC_ITEMS, 4).map((items, index) => ({
    id: `topic-row-${index}`,
    type: 'topic-row' as const,
    items,
  })),
  {
    id: 'header-news',
    type: 'header',
    title: 'News',
    resultLabel: '20+ Results',
    showViewAll: true,
  },
  ...NEWS_ITEMS.map((item) => ({
    id: `news-${item.id}`,
    type: 'article-row' as const,
    item,
  })),
  {
    id: 'header-blog',
    type: 'header',
    title: 'Blog',
    resultLabel: '10 Results',
    showViewAll: true,
  },
  ...BLOG_ITEMS.map((item) => ({
    id: `blog-${item.id}`,
    type: 'article-row' as const,
    item,
    compact: true,
  })),
];

function SearchContainComponent() {
  const renderRow = useCallback(({ item }: { item: SearchContainRow }) => {
    if (item.type === 'header') {
      return (
        <View style={[styles.headingView, item.marginTop ? { marginTop: item.marginTop } : null]}>
          <Text style={styles.heading}>{item.title}</Text>
          <View style={styles.headingActions}>
            {item.resultLabel ? <Text style={styles.text}>{item.resultLabel}</Text> : null}
            {item.showViewAll ? (
              <Text style={{ ...styles.text, color: '#126B87' }}>
                View All{' '}
                <AntDesign name="right" color="#126B87" style={{ marginHorizontal: getWidth(1) }} />
              </Text>
            ) : null}
          </View>
        </View>
      );
    }

    if (item.type === 'topic-row') {
      return (
        <View style={styles.topicRow}>
          {item.items.map((topic) => (
            <View key={topic.id} style={styles.topicRowItem}>
              <Pressable onPress={() => console.log('selected')} style={styles.listItem}>
                <Text numberOfLines={1} style={{ color: '#757575', maxWidth: getWidth(23) }}>
                  {topic.name}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      );
    }

    return (
      <View style={styles.articleSection}>
        <View style={styles.articleRow}>
          <View style={styles.articleContent}>
            <Image
              style={styles.image}
              resizeMode="contain"
              source={require('@/assets/images/pray.jpeg')}
            />
            <View style={styles.articleCopy}>
              <Text style={{ ...styles.text, ...styles.articleSource }}>
                {item.item.source.toUpperCase()}
              </Text>
              <Text
                style={
                  item.compact
                    ? {
                        ...styles.heading,
                        fontSize: 13,
                        fontWeight: '400',
                      }
                    : styles.heading
                }
                numberOfLines={2}
              >
                {item.item.title}
              </Text>
            </View>
          </View>
          <Entypo name="dots-three-vertical" color="#a0a3a9" size={getFontSize(3)} />
        </View>
      </View>
    );
  }, []);

  return (
    <View style={styles.continer}>
      <FlatList
        data={SEARCH_CONTAIN_ROWS}
        keyExtractor={(item) => item.id}
        renderItem={renderRow}
        contentContainerStyle={styles.contentContainer}
        ItemSeparatorComponent={() => <View style={styles.rowSeparator} />}
        ListFooterComponent={<View style={styles.sectionFooter} />}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={STANDARD_SECONDARY_LIST_BATCH_CONFIG.removeClippedSubviews}
        initialNumToRender={STANDARD_SECONDARY_LIST_BATCH_CONFIG.initialNumToRender}
        maxToRenderPerBatch={STANDARD_SECONDARY_LIST_BATCH_CONFIG.maxToRenderPerBatch}
        updateCellsBatchingPeriod={STANDARD_SECONDARY_LIST_BATCH_CONFIG.updateCellsBatchingPeriod}
        windowSize={STANDARD_SECONDARY_LIST_BATCH_CONFIG.windowSize}
      />
    </View>
  );
}

export default SearchContainComponent;
