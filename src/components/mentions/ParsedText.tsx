import React, { useMemo } from 'react';
import { StyleProp, Text, TextProps, TextStyle } from 'react-native';
import { useNavigation, useTheme } from '@react-navigation/native';
import StyledText from '@/components/styled/Text';
import { navigateToMentionProfile, MENTION_BRAND_COLOR } from './navigation';
import { MENTION_RENDER_REGEX, normalizeHandle } from './mentionUtils';

type ParsedTextProps = TextProps & {
  text: string;
  textStyle?: StyleProp<TextStyle>;
  mentionTextStyle?: StyleProp<TextStyle>;
  onMentionPress?: (handle: string) => void;
};

function ParsedText({
  text,
  textStyle,
  mentionTextStyle,
  onMentionPress,
  style,
  ...textProps
}: ParsedTextProps) {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  const children = useMemo(() => {
    const value = String(text || '');
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
      nodes.push(
        <Text
          key={`${mentionLabel}_${index}_${matchIndex}`}
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
  }, [mentionTextStyle, navigation, onMentionPress, text]);

  return (
    <StyledText {...textProps} style={[{ color: colors.text }, style, textStyle]}>
      {children}
    </StyledText>
  );
}

export default ParsedText;
