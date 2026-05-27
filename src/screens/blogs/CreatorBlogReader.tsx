import React, { useLayoutEffect, useMemo, useState } from 'react';
import { Image, ScrollView, Share, Pressable, useWindowDimensions, View } from 'react-native';
import { useTheme } from '@react-navigation/native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import RenderHtml from 'react-native-render-html';
import { format } from 'date-fns';
import StyledText from '@/components/styled/Text';
import { Colors } from '@/src/styles';
import { borderRadius, borderWidth } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import { creatorBlogService } from '@/src/services/creatorBlogs';
import { creatorBlogBodyToHtml, stripEditorSyntax } from '@/src/services/creatorBlogs/markdown';
import type { CreatorBlogRecord } from '@/src/services/creatorBlogs';

const formatDateLabel = (value?: string | null) => {
  if (!value) {
    return '';
  }

  try {
    return format(new Date(value), 'MMM d, yyyy');
  } catch {
    return value;
  }
};

function ActionChip({
  icon,
  label,
  active,
  onPress,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.x12,
        paddingVertical: spacing.x10,
        borderRadius: borderRadius.button,
        borderWidth: borderWidth.thin,
        borderColor: active ? Colors.primarySapphire.brand : Colors.neutral[800],
        backgroundColor: active ? Colors.primarySapphire.brand : colors.card,
      }}
    >
      <MaterialCommunityIcons
        name={icon as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
        size={18}
        color={active ? '#FFFFFF' : Colors.primary.brand}
      />
      <StyledText
        style={{
          marginLeft: spacing.x6,
          color: active ? '#FFFFFF' : colors.text,
          fontFamily: 'Rubik-Medium',
          fontSize: 13,
        }}
      >
        {label}
      </StyledText>
    </Pressable>
  );
}

export default function CreatorBlogReader({ blog }: { blog: CreatorBlogRecord }) {
  const { colors, dark } = useTheme();
  const { width } = useWindowDimensions();
  const [isLiked, setIsLiked] = useState(false);
  const [isPrayed, setIsPrayed] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [related, setRelated] = useState<CreatorBlogRecord[]>([]);
  const bodyHtml = useMemo(() => creatorBlogBodyToHtml(blog.body), [blog.body]);
  const previewText = useMemo(() => stripEditorSyntax(blog.body), [blog.body]);

  useLayoutEffect(() => {
    creatorBlogService.incrementReadCount(blog.id).catch(() => undefined);
    creatorBlogService
      .listRelatedArticles(blog)
      .then(setRelated)
      .catch(() => setRelated([]));
  }, [blog]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: spacing.x48 }}
      showsVerticalScrollIndicator={false}
    >
      {blog.coverImage ? (
        <Image
          source={{ uri: blog.coverImage }}
          style={{
            width: '100%',
            aspectRatio: 16 / 9,
            backgroundColor: Colors.neutral[800],
          }}
        />
      ) : null}

      <View style={{ paddingHorizontal: spacing.x24, paddingTop: spacing.x20 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.x8 }}>
          {blog.tags.map((tag) => (
            <View
              key={tag}
              style={{
                paddingHorizontal: spacing.x10,
                paddingVertical: spacing.x5,
                borderRadius: borderRadius.button,
                backgroundColor: dark ? Colors.neutral[900] : Colors.neutral[800],
              }}
            >
              <StyledText style={{ color: Colors.primary.brand, fontSize: 12 }}>#{tag}</StyledText>
            </View>
          ))}
        </View>

        <StyledText
          style={{
            marginTop: spacing.x16,
            color: dark ? colors.text : Colors.primary.brand,
            fontFamily: 'Rubik-Bold',
            fontSize: 32,
            lineHeight: 38,
          }}
        >
          {blog.title}
        </StyledText>

        {blog.subtitle ? (
          <StyledText
            style={{
              marginTop: spacing.x10,
              color: Colors.neutral[300],
              fontSize: 17,
              lineHeight: 26,
            }}
          >
            {blog.subtitle}
          </StyledText>
        ) : null}

        <View
          style={{
            marginTop: spacing.x16,
            paddingBottom: spacing.x16,
            borderBottomWidth: borderWidth.thin,
            borderBottomColor: Colors.neutral[800],
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image
              source={{
                uri: blog.authorProfileImage || 'https://cdn.onebodyapp.com/user/no-image.png',
              }}
              style={{
                width: 42,
                height: 42,
                borderRadius: borderRadius.max,
                backgroundColor: Colors.neutral[800],
              }}
            />
            <View style={{ marginLeft: spacing.x10, flex: 1 }}>
              <StyledText style={{ color: colors.text, fontFamily: 'Rubik-Medium', fontSize: 15 }}>
                {blog.author}
              </StyledText>
              <StyledText style={{ color: Colors.neutral[300], fontSize: 12 }}>
                @{blog.authorHandle}
              </StyledText>
            </View>
          </View>

          <StyledText style={{ marginTop: spacing.x12, color: Colors.neutral[300], fontSize: 12 }}>
            Published {formatDateLabel(blog.publishedAt || blog.createdAt)}
            {blog.publishedAt && blog.updatedAt !== blog.publishedAt
              ? ` • Updated ${formatDateLabel(blog.updatedAt)}`
              : ''}
            {` • ${blog.estimatedReadTime} min read`}
          </StyledText>
        </View>

        <View
          style={{
            marginTop: spacing.x16,
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.x10,
          }}
        >
          <ActionChip
            icon={isLiked ? 'heart' : 'heart-outline'}
            label="Like"
            active={isLiked}
            onPress={() => setIsLiked((value) => !value)}
          />
          <ActionChip
            icon={isPrayed ? 'hands-pray' : 'hands-pray'}
            label="Pray"
            active={isPrayed}
            onPress={() => setIsPrayed((value) => !value)}
          />
          <ActionChip
            icon="bookmark-outline"
            label="Save"
            active={isSaved}
            onPress={() => setIsSaved((value) => !value)}
          />
          <ActionChip
            icon="share-variant-outline"
            label="Share"
            onPress={() =>
              Share.share({
                title: blog.title,
                message: `${blog.title}\n\n${previewText.slice(0, 180)}...`,
              }).catch(() => undefined)
            }
          />
        </View>

        <View style={{ marginTop: spacing.x24 }}>
          <RenderHtml
            contentWidth={Math.max(width - spacing.x48, 0)}
            source={{ html: bodyHtml }}
            tagsStyles={{
              body: {
                color: colors.text,
                fontFamily: 'OpenSans-Regular',
              },
              p: {
                color: dark ? '#F5F7F9' : '#032F3C',
                fontFamily: 'OpenSans-Regular',
                fontSize: 18,
                lineHeight: 31,
                marginTop: 0,
                marginBottom: 18,
              },
              h1: {
                color: dark ? '#FFFFFF' : '#032F3C',
                fontFamily: 'Rubik-Bold',
                fontSize: 28,
                lineHeight: 34,
                marginBottom: 16,
              },
              h2: {
                color: dark ? '#FFFFFF' : '#032F3C',
                fontFamily: 'Rubik-Bold',
                fontSize: 24,
                lineHeight: 30,
                marginBottom: 14,
              },
              h3: {
                color: dark ? '#FFFFFF' : '#032F3C',
                fontFamily: 'Rubik-Medium',
                fontSize: 20,
                lineHeight: 27,
                marginBottom: 12,
              },
              blockquote: {
                borderLeftWidth: 3,
                borderLeftColor: Colors.primarySapphire.brand,
                paddingLeft: 14,
                color: Colors.neutral[300],
                fontFamily: 'OpenSans-Regular',
                fontStyle: 'italic',
              },
              li: {
                color: dark ? '#F5F7F9' : '#032F3C',
                fontFamily: 'OpenSans-Regular',
                fontSize: 17,
                lineHeight: 28,
              },
              a: {
                color: Colors.primarySapphire.brand,
                textDecorationLine: 'underline',
              },
              img: {
                borderRadius: 14,
                marginVertical: 16,
              },
              hr: {
                borderColor: Colors.neutral[800],
                marginVertical: 18,
              },
            }}
          />
        </View>

        <View
          style={{
            marginTop: spacing.x24,
            padding: spacing.x16,
            borderRadius: borderRadius.base,
            borderWidth: borderWidth.thin,
            borderColor: Colors.neutral[800],
            backgroundColor: dark ? Colors.neutral[900] : Colors.neutral[800],
          }}
        >
          <StyledText style={{ fontFamily: 'Rubik-Medium', fontSize: 16 }}>
            Article Analytics
          </StyledText>
          <View
            style={{
              marginTop: spacing.x12,
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: spacing.x12,
            }}
          >
            {[
              { label: 'Reads', value: blog.readCount },
              { label: 'Unique Reads', value: Math.max(1, Math.round(blog.readCount * 0.74)) },
              { label: 'Shares', value: blog.shareCount },
              { label: 'Comments', value: blog.commentCount },
              { label: 'Read-through', value: '61%' },
              { label: 'Avg Read Time', value: `${blog.estimatedReadTime - 1 || 1}m 42s` },
            ].map((item) => (
              <View
                key={item.label}
                style={{
                  width: '47%',
                  padding: spacing.x12,
                  borderRadius: borderRadius.base,
                  backgroundColor: colors.background,
                }}
              >
                <StyledText style={{ color: Colors.neutral[300], fontSize: 12 }}>
                  {item.label}
                </StyledText>
                <StyledText
                  style={{ marginTop: spacing.x6, fontFamily: 'Rubik-Bold', fontSize: 18 }}
                >
                  {item.value}
                </StyledText>
              </View>
            ))}
          </View>
        </View>

        {related.length > 0 ? (
          <View style={{ marginTop: spacing.x32 }}>
            <StyledText style={{ fontFamily: 'Rubik-Medium', fontSize: 18 }}>
              Related Articles
            </StyledText>
            {related.map((item) => (
              <View
                key={item.id}
                style={{
                  marginTop: spacing.x12,
                  padding: spacing.x13,
                  borderRadius: borderRadius.base,
                  borderWidth: borderWidth.thin,
                  borderColor: Colors.neutral[800],
                }}
              >
                <StyledText style={{ fontFamily: 'Rubik-Medium', fontSize: 15 }}>
                  {item.title}
                </StyledText>
                <StyledText style={{ marginTop: spacing.x6, color: Colors.neutral[300] }}>
                  {item.subtitle}
                </StyledText>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
