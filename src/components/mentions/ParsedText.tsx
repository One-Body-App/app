import React, { use, useMemo } from 'react';
import { StyleProp, Text, TextProps, TextStyle } from 'react-native';
import { NavigationContext, useTheme } from '@react-navigation/native';
import StyledText from '@/components/styled/Text';
import type { TaggedMention } from '@/utils/types';
import { navigateToMentionProfile, MENTION_BRAND_COLOR } from './navigation';
import { MENTION_RENDER_REGEX, normalizeHandle } from './mentionUtils';

type ParsedTextProps = TextProps & {
  text: string;
  mentions?: TaggedMention[];
  textStyle?: StyleProp<TextStyle>;
  mentionTextStyle?: StyleProp<TextStyle>;
  onMentionPress?: (handle: string) => void;
};

function ParsedText({
  text,
  mentions,
  textStyle,
  mentionTextStyle,
  onMentionPress,
  style,
  ...textProps
}: ParsedTextProps) {
  const navigation = use(NavigationContext);
  const { colors } = useTheme();

  const children = useMemo(() => {
    const value = String(text || '');
    const committedHandles = Array.isArray(mentions)
      ? new Set(
          mentions
            .map((mention) => normalizeHandle(mention.username))
            .filter((handle) => handle.length > 0)
        )
      : null;
    const nodes: React.ReactNode[] = [];
    let cursor = 0;
    let matchIndex = 0;

    value.replace(MENTION_RENDER_REGEX, (fullMatch, leading, handle, offset) => {
      const index = Number(offset);
      if (index > cursor) {
        nodes.push(value.slice(cursor, index));
      }

      if (leading) {
        nodes.push(leading);
      }

      const normalizedHandle = normalizeHandle(handle);
      const mentionLabel = `@${normalizedHandle}`;
      const shouldRenderAsMention =
        committedHandles === null ||
        committedHandles.size < 1 ||
        committedHandles.has(normalizedHandle);

      if (!shouldRenderAsMention) {
        nodes.push(mentionLabel);
        cursor = index + fullMatch.length;
        matchIndex += 1;
        return fullMatch;
      }

      nodes.push(
        <Text
          key={`${mentionLabel}_${normalizedHandle}_${matchIndex}`}
          suppressHighlighting
          onPress={() => {
            if (onMentionPress) {
              onMentionPress(normalizedHandle);
              return;
            }
            navigateToMentionProfile(navigation, normalizedHandle);
          }}
          style={[
            {
              color: MENTION_BRAND_COLOR,
              fontWeight: '700',
            },
            mentionTextStyle,
          ]}
        >
          {mentionLabel}
        </Text>
      );

      cursor = index + fullMatch.length;
      matchIndex += 1;
      return fullMatch;
    });

    if (cursor < value.length) {
      nodes.push(value.slice(cursor));
    }

    return nodes;
  }, [mentionTextStyle, mentions, navigation, onMentionPress, text]);

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <StyledText {...textProps} style={[{ color: colors.text }, style, textStyle]}>
      {children}
    </StyledText>
  );
}

export default ParsedText;
