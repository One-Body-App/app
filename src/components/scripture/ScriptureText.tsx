import React, { useMemo, useState } from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import type { ScriptureMention, TaggedMention } from '@/utils/types';
import ParsedText from '@/components/mentions/ParsedText';
import { ScriptureModal, SCRIPTURE_LINK_COLOR } from './ScriptureModal';

/**
 * Renders post body text with scripture references turned into tappable links
 * (#41dbe1) that open the verse modal. Non-scripture spans are passed through
 * the existing ParsedText so @-mentions keep working unchanged. When there are
 * no scripture mentions, this is a thin pass-through to ParsedText, so ordinary
 * posts render exactly as before (no design change).
 */
export function ScriptureText({
  text,
  mentions,
  scriptureMentions,
  posterTranslation,
  textStyle,
}: {
  text: string;
  mentions?: TaggedMention[];
  scriptureMentions?: ScriptureMention[];
  posterTranslation?: string;
  textStyle?: StyleProp<TextStyle>;
}) {
  const [active, setActive] = useState<ScriptureMention | null>(null);

  const valid = useMemo(
    () =>
      (scriptureMentions ?? [])
        .filter(
          (m) =>
            Number.isFinite(m.startIndex) &&
            Number.isFinite(m.endIndex) &&
            m.startIndex >= 0 &&
            m.endIndex <= text.length &&
            m.endIndex > m.startIndex
        )
        .sort((a, b) => a.startIndex - b.startIndex),
    [scriptureMentions, text]
  );

  // No scripture -> unchanged behavior.
  if (valid.length === 0) {
    return <ParsedText text={text} mentions={mentions} textStyle={textStyle} />;
  }

  // Build alternating segments: plain (via ParsedText) + scripture (tappable).
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  valid.forEach((m, i) => {
    if (m.startIndex < cursor) return; // skip overlaps
    if (m.startIndex > cursor) {
      nodes.push(
        <ParsedText
          key={`t${i}`}
          text={text.slice(cursor, m.startIndex)}
          mentions={mentions}
          textStyle={textStyle}
        />
      );
    }
    nodes.push(
      <Text
        key={`s${i}`}
        suppressHighlighting
        onPress={() => setActive(m)}
        style={[textStyle, { color: SCRIPTURE_LINK_COLOR, fontWeight: '600' }]}
      >
        {text.slice(m.startIndex, m.endIndex)}
      </Text>
    );
    cursor = m.endIndex;
  });
  if (cursor < text.length) {
    nodes.push(
      <ParsedText key="tail" text={text.slice(cursor)} mentions={mentions} textStyle={textStyle} />
    );
  }

  return (
    <>
      {/* A wrapping Text lets the segments flow inline like one paragraph. */}
      <Text style={textStyle}>{nodes}</Text>
      <ScriptureModal
        visible={active !== null}
        mention={active}
        posterTranslation={posterTranslation}
        onClose={() => setActive(null)}
      />
    </>
  );
}

export default ScriptureText;
