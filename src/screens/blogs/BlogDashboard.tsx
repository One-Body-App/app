import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useTheme } from '@react-navigation/native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { useSelector } from 'react-redux';
import StyledText from '@/components/styled/Text';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { Colors } from '@/src/styles';
import { borderRadius, borderWidth } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import { creatorBlogService } from '@/src/services/creatorBlogs';
import type {
  CreatorBlogFilter,
  CreatorBlogRecord,
  CreatorBlogSort,
} from '@/src/services/creatorBlogs/types';
import isCreatorBlogEligible from '@/src/utils/creatorBlogAccess';

const FILTERS: CreatorBlogFilter[] = ['all', 'draft', 'published', 'archived'];
const SORT_LABELS: Record<CreatorBlogSort, string> = {
  newest: 'Newest',
  oldest: 'Oldest',
  'most-viewed': 'Most viewed',
  'last-updated': 'Last updated',
};

const getStatusColor = (status: CreatorBlogRecord['status']) => {
  if (status === 'published') {
    return 'rgba(18,107,135,0.12)';
  }
  if (status === 'archived') {
    return 'rgba(154,172,177,0.18)';
  }
  return 'rgba(65,137,159,0.12)';
};

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: '48%',
        padding: spacing.x16,
        borderRadius: borderRadius.base,
        borderWidth: borderWidth.thin,
        borderColor: Colors.neutral[800],
        backgroundColor: colors.card,
      }}
    >
      <StyledText style={{ color: Colors.neutral[300], fontSize: 12 }}>{label}</StyledText>
      <StyledText
        style={{
          marginTop: spacing.x6,
          fontFamily: 'Rubik-Bold',
          color: colors.text,
          fontSize: 22,
        }}
      >
        {value}
      </StyledText>
    </View>
  );
}

function ArticleRow({
  item,
  onEdit,
  onRead,
}: {
  item: CreatorBlogRecord;
  onEdit: () => void;
  onRead: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        padding: spacing.x16,
        borderRadius: borderRadius.base,
        borderWidth: borderWidth.thin,
        borderColor: Colors.neutral[800],
        backgroundColor: colors.card,
        marginBottom: spacing.x12,
      }}
    >
      <View
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}
      >
        <View style={{ flex: 1, paddingRight: spacing.x12 }}>
          <StyledText style={{ fontFamily: 'Rubik-Medium', fontSize: 16 }}>{item.title}</StyledText>
          {item.subtitle ? (
            <StyledText style={{ marginTop: spacing.x6, color: Colors.neutral[300] }}>
              {item.subtitle}
            </StyledText>
          ) : null}
        </View>
        <View
          style={{
            paddingHorizontal: spacing.x10,
            paddingVertical: spacing.x5,
            borderRadius: borderRadius.button,
            backgroundColor: getStatusColor(item.status),
          }}
        >
          <StyledText
            style={{ color: Colors.primary.brand, fontFamily: 'Rubik-Medium', fontSize: 12 }}
          >
            {item.status}
          </StyledText>
        </View>
      </View>

      <View
        style={{ marginTop: spacing.x10, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.x8 }}
      >
        {item.tags.map((tag) => (
          <StyledText key={tag} style={{ color: Colors.neutral[300], fontSize: 12 }}>
            #{tag}
          </StyledText>
        ))}
      </View>

      <View
        style={{
          marginTop: spacing.x12,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <StyledText style={{ color: Colors.neutral[300], fontSize: 12 }}>
          {item.readCount} reads • {item.shareCount} shares
        </StyledText>
        <View style={{ flexDirection: 'row', gap: spacing.x10 }}>
          {item.status === 'published' ? (
            <TouchableOpacity onPress={onRead}>
              <StyledText
                style={{ color: Colors.primarySapphire.brand, fontFamily: 'Rubik-Medium' }}
              >
                Read
              </StyledText>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity onPress={onEdit}>
            <StyledText style={{ color: Colors.primarySapphire.brand, fontFamily: 'Rubik-Medium' }}>
              Edit
            </StyledText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function BlogDashboard() {
  const navigation = useNavigation<any>();
  const { colors, dark } = useTheme();
  const currentUser = useSelector((state: RootState) => state.auth.getProfileData);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<CreatorBlogRecord[]>([]);
  const [filter, setFilter] = useState<CreatorBlogFilter>('all');
  const [sort, setSort] = useState<CreatorBlogSort>('newest');
  const [search, setSearch] = useState('');
  const [summary, setSummary] = useState({
    draftCount: 0,
    publishedCount: 0,
    totalReads: 0,
    totalShares: 0,
  });

  const loadData = useCallback(async () => {
    if (!currentUser) {
      return;
    }

    setLoading(true);
    try {
      const [blogItems, blogSummary] = await Promise.all([
        creatorBlogService.listBlogsForAuthor(currentUser, { filter, sort, search }),
        creatorBlogService.getBlogSummary(currentUser),
      ]);
      setItems(blogItems);
      setSummary(blogSummary);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser, filter, search, sort]);

  useFocusEffect(
    useCallback(() => {
      loadData().catch(() => undefined);
    }, [loadData])
  );

  const eligible = isCreatorBlogEligible(currentUser as any);
  const nextSort = useMemo(() => {
    const order: CreatorBlogSort[] = ['newest', 'oldest', 'most-viewed', 'last-updated'];
    const index = order.indexOf(sort);
    return order[(index + 1) % order.length];
  }, [sort]);

  let articleListContent = items.map((item) => (
    <ArticleRow
      key={item.id}
      item={item}
      onEdit={() => navigation.navigate('BlogComposer', { blogId: item.id })}
      onRead={() => navigation.navigate('SingleRss', { postId: item.id })}
    />
  ));

  if (loading) {
    articleListContent = [<ActivityIndicator key="loading" color={Colors.primarySapphire.brand} />];
  } else if (items.length === 0) {
    articleListContent = [
      <View
        key="empty"
        style={{
          padding: spacing.x20,
          borderRadius: borderRadius.base,
          borderWidth: borderWidth.thin,
          borderColor: Colors.neutral[800],
        }}
      >
        <StyledText style={{ fontFamily: 'Rubik-Medium', fontSize: 16 }}>
          No articles match this view.
        </StyledText>
        <StyledText style={{ marginTop: spacing.x8, color: Colors.neutral[300] }}>
          Start a new article or adjust your filters.
        </StyledText>
      </View>,
    ];
  }

  if (!eligible) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.x24,
          backgroundColor: colors.background,
        }}
      >
        <StyledText style={{ fontFamily: 'Rubik-Bold', fontSize: 24 }}>
          Creator access required
        </StyledText>
        <StyledText
          style={{ marginTop: spacing.x10, textAlign: 'center', color: Colors.neutral[300] }}
        >
          Blog publishing is available to approved creators only.
        </StyledText>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.x20, paddingBottom: spacing.x48 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadData().catch(() => undefined);
          }}
        />
      }
    >
      <View style={{ marginBottom: spacing.x12 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            width: 40,
            height: 40,
            borderRadius: borderRadius.max,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.card,
          }}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <StyledText style={{ fontFamily: 'Rubik-Bold', fontSize: 26 }}>Write</StyledText>
          <StyledText style={{ marginTop: spacing.x6, color: Colors.neutral[300] }}>
            Manage your drafts, published articles, and analytics.
          </StyledText>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('BlogComposer')}
          style={{
            width: 48,
            height: 48,
            borderRadius: borderRadius.max,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: Colors.primarySapphire.brand,
          }}
        >
          <MaterialCommunityIcons name="pencil-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View
        style={{ marginTop: spacing.x20, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.x12 }}
      >
        <SummaryCard label="Drafts" value={summary.draftCount} />
        <SummaryCard label="Published" value={summary.publishedCount} />
        <SummaryCard label="Reads" value={summary.totalReads} />
        <SummaryCard label="Shares" value={summary.totalShares} />
      </View>

      <View
        style={{
          marginTop: spacing.x20,
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: borderRadius.base,
          borderWidth: borderWidth.thin,
          borderColor: Colors.neutral[800],
          backgroundColor: dark ? Colors.neutral[900] : colors.card,
          paddingHorizontal: spacing.x13,
        }}
      >
        <MaterialCommunityIcons name="magnify" size={20} color={Colors.neutral[300]} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by title"
          placeholderTextColor={Colors.neutral[300]}
          style={{
            flex: 1,
            color: colors.text,
            paddingVertical: spacing.x12,
            paddingHorizontal: spacing.x10,
            fontFamily: 'OpenSans-Regular',
          }}
        />
      </View>

      <View
        style={{ marginTop: spacing.x16, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.x8 }}
      >
        {FILTERS.map((value) => {
          const active = value === filter;
          return (
            <TouchableOpacity
              key={value}
              onPress={() => setFilter(value)}
              style={{
                paddingHorizontal: spacing.x12,
                paddingVertical: spacing.x8,
                borderRadius: borderRadius.button,
                backgroundColor: active ? Colors.primarySapphire.brand : colors.card,
                borderWidth: borderWidth.thin,
                borderColor: active ? Colors.primarySapphire.brand : Colors.neutral[800],
              }}
            >
              <StyledText
                style={{
                  color: active ? '#FFFFFF' : colors.text,
                  fontFamily: 'Rubik-Medium',
                  textTransform: 'capitalize',
                }}
              >
                {value}
              </StyledText>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          onPress={() => setSort(nextSort)}
          style={{
            marginLeft: 'auto',
            paddingHorizontal: spacing.x12,
            paddingVertical: spacing.x8,
            borderRadius: borderRadius.button,
            borderWidth: borderWidth.thin,
            borderColor: Colors.neutral[800],
          }}
        >
          <StyledText style={{ color: Colors.primarySapphire.brand, fontFamily: 'Rubik-Medium' }}>
            Sort: {SORT_LABELS[sort]}
          </StyledText>
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: spacing.x20 }}>{articleListContent}</View>
    </ScrollView>
  );
}
