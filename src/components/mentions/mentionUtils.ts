import { TextInputSelectionChangeEventData, NativeSyntheticEvent } from 'react-native';
import type { TaggedMention } from '@/utils/types';

export type MentionSelection = {
  start: number;
  end: number;
};

export type MentionSuggestion = {
  id: string;
  username: string;
  name: string;
  profileImage?: string;
  allowTagging?: boolean;
  isProfilePublic?: boolean;
};

export type ActiveMention = {
  query: string;
  triggerIndex: number;
  replaceStart: number;
  replaceEnd: number;
};

export type MentionRange = {
  start: number;
  end: number;
  removalEnd: number;
  handle: string;
  mention: TaggedMention;
};

export const MENTION_RENDER_REGEX = /(^|[^A-Za-z0-9_])@([a-z0-9_]+)(?=$|[\s.,!?;:()[\]{}])/gi;
const ACTIVE_MENTION_PREFIX_REGEX = /(^|[^A-Za-z0-9_])@([a-z0-9_]*)$/i;
const ACTIVE_MENTION_SUFFIX_REGEX = /^[a-z0-9_]*/i;

export const normalizeHandle = (value: string) =>
  String(value || '')
    .trim()
    .replace(/^@+/, '')
    .replace(/\s+/g, '')
    .toLowerCase();

export const toTaggedMention = (suggestion: MentionSuggestion): TaggedMention => ({
  userId: String(suggestion.id),
  username: normalizeHandle(suggestion.username),
  displayName: String(suggestion.name || suggestion.username || '').trim() || suggestion.username,
});

export const clampSelection = (
  selection: MentionSelection,
  textLength: number
): MentionSelection => {
  const max = Math.max(0, textLength);
  return {
    start: Math.min(Math.max(0, selection.start), max),
    end: Math.min(Math.max(0, selection.end), max),
  };
};

export const selectionFromEvent = (
  event: NativeSyntheticEvent<TextInputSelectionChangeEventData>
): MentionSelection => ({
  start: event.nativeEvent.selection.start,
  end: event.nativeEvent.selection.end,
});

export const findActiveMention = (
  text: string,
  selection: MentionSelection
): ActiveMention | null => {
  const value = String(text || '');
  const clampedSelection = clampSelection(selection, value.length);
  if (clampedSelection.start !== clampedSelection.end) {
    return null;
  }

  const cursor = clampedSelection.start;
  const textBeforeCursor = value.slice(0, cursor);
  const prefixMatch = textBeforeCursor.match(ACTIVE_MENTION_PREFIX_REGEX);
  if (!prefixMatch) {
    return null;
  }

  const typedPrefix = normalizeHandle(prefixMatch[2] ?? '');
  const suffixMatch = value.slice(cursor).match(ACTIVE_MENTION_SUFFIX_REGEX);
  const typedSuffix = normalizeHandle(suffixMatch?.[0] ?? '');
  const query = `${typedPrefix}${typedSuffix}`;
  const replaceStart = textBeforeCursor.length - typedPrefix.length - 1;

  if (replaceStart < 0 || value[replaceStart] !== '@') {
    return null;
  }

  return {
    query,
    triggerIndex: replaceStart,
    replaceStart,
    replaceEnd: cursor + typedSuffix.length,
  };
};

export const replaceMentionAtRange = (
  text: string,
  range: Pick<ActiveMention, 'replaceStart' | 'replaceEnd'>,
  username: string
) => {
  const normalizedHandle = normalizeHandle(username);
  const mentionText = normalizedHandle ? `@${normalizedHandle} ` : '@';
  const suffix = text.slice(range.replaceEnd);
  const normalizedSuffix = suffix.startsWith(' ') ? suffix.slice(1) : suffix;
  const nextText = `${text.slice(0, range.replaceStart)}${mentionText}${normalizedSuffix}`;
  const nextCursor = range.replaceStart + mentionText.length;

  return {
    text: nextText,
    selection: {
      start: nextCursor,
      end: nextCursor,
    } satisfies MentionSelection,
  };
};

export const extractMentionMatches = (text: string) => {
  const value = String(text || '');
  const matches: Array<{ handle: string; start: number; end: number }> = [];

  value.replace(MENTION_RENDER_REGEX, (fullMatch, leading, handle, offset) => {
    const normalized = normalizeHandle(handle);
    if (normalized) {
      const leadingLength = typeof leading === 'string' ? leading.length : 0;
      const mentionStart = Number(offset) + leadingLength;
      matches.push({
        handle: normalized,
        start: mentionStart,
        end: mentionStart + normalized.length + 1,
      });
    }
    return fullMatch;
  });

  return matches;
};

export const extractHandlesFromText = (text: string) =>
  extractMentionMatches(text).map((match) => match.handle);

export const getCommittedMentionRanges = (
  text: string,
  mentionsByHandle: Map<string, TaggedMention>
) => {
  const value = String(text || '');
  const seenUserIds = new Set<string>();

  return extractMentionMatches(value).reduce<MentionRange[]>((accumulator, match) => {
    const mention = mentionsByHandle.get(match.handle);
    if (!mention || seenUserIds.has(mention.userId)) {
      return accumulator;
    }

    seenUserIds.add(mention.userId);
    accumulator.push({
      start: match.start,
      end: match.end,
      removalEnd: value[match.end] === ' ' ? match.end + 1 : match.end,
      handle: match.handle,
      mention,
    });
    return accumulator;
  }, []);
};

export const removeMentionRangesFromText = (text: string, ranges: MentionRange[]) => {
  if (ranges.length < 1) {
    return {
      text,
      selection: null as MentionSelection | null,
    };
  }

  const uniqueRanges = [...ranges].sort((left, right) => right.start - left.start);
  let nextText = String(text || '');
  let nextSelectionStart = uniqueRanges[uniqueRanges.length - 1].start;

  uniqueRanges.forEach((range) => {
    nextText = `${nextText.slice(0, range.start)}${nextText.slice(range.removalEnd)}`;
    nextSelectionStart = Math.min(nextSelectionStart, range.start);
  });

  return {
    text: nextText,
    selection: {
      start: nextSelectionStart,
      end: nextSelectionStart,
    } satisfies MentionSelection,
  };
};

export const findMentionRangeBeforeCursor = (
  text: string,
  selection: MentionSelection,
  mentionsByHandle: Map<string, TaggedMention>
) => {
  const clampedSelection = clampSelection(selection, String(text || '').length);
  if (clampedSelection.start !== clampedSelection.end) {
    return null;
  }

  return (
    getCommittedMentionRanges(text, mentionsByHandle).find(
      (range) => clampedSelection.start === range.end || clampedSelection.start === range.removalEnd
    ) ?? null
  );
};

const getChangedRange = (previousText: string, nextText: string) => {
  if (previousText === nextText) {
    return null;
  }

  let start = 0;
  while (
    start < previousText.length &&
    start < nextText.length &&
    previousText[start] === nextText[start]
  ) {
    start += 1;
  }

  let previousEnd = previousText.length - 1;
  let nextEnd = nextText.length - 1;
  while (
    previousEnd >= start &&
    nextEnd >= start &&
    previousText[previousEnd] === nextText[nextEnd]
  ) {
    previousEnd -= 1;
    nextEnd -= 1;
  }

  return {
    start,
    previousEndExclusive: previousEnd + 1,
  };
};

export const findMentionsAffectedByTextChange = (
  previousText: string,
  nextText: string,
  mentionsByHandle: Map<string, TaggedMention>
) => {
  const changedRange = getChangedRange(previousText, nextText);
  if (!changedRange) {
    return [];
  }

  return getCommittedMentionRanges(previousText, mentionsByHandle).filter((range) => {
    const overlapsRemovedText =
      changedRange.start < range.removalEnd && changedRange.previousEndExclusive > range.start;
    const insertionInsideMention =
      changedRange.start > range.start &&
      changedRange.start <= range.end &&
      changedRange.previousEndExclusive === changedRange.start;

    return overlapsRemovedText || insertionInsideMention;
  });
};

export const syncMentions = (text: string, mentionsByHandle: Map<string, TaggedMention>) => {
  const seenHandles = new Set<string>();
  const seenIds = new Set<string>();
  const mentions: TaggedMention[] = [];

  extractMentionMatches(text).forEach(({ handle }) => {
    const normalizedHandle = normalizeHandle(handle);
    if (!normalizedHandle || seenHandles.has(normalizedHandle)) {
      return;
    }

    seenHandles.add(normalizedHandle);
    const mention = mentionsByHandle.get(normalizedHandle);
    if (!mention || seenIds.has(mention.userId)) {
      return;
    }

    seenIds.add(mention.userId);
    mentions.push(mention);
  });

  return mentions;
};

export const syncMentionedUserIds = (text: string, mentionsByHandle: Map<string, TaggedMention>) =>
  syncMentions(text, mentionsByHandle).map((mention) => mention.userId);
