import { TextInputSelectionChangeEventData, NativeSyntheticEvent } from 'react-native';

export type MentionSelection = {
  start: number;
  end: number;
};

export type MentionSuggestion = {
  id: string;
  username: string;
  name: string;
  profileImage?: string;
};

export type ActiveMention = {
  query: string;
  triggerIndex: number;
  replaceStart: number;
  replaceEnd: number;
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

  const leadingSegment = prefixMatch[1] ?? '';
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

export const extractHandlesFromText = (text: string) => {
  const value = String(text || '');
  const matches: string[] = [];

  value.replace(MENTION_RENDER_REGEX, (_fullMatch, _leading, handle) => {
    const normalized = normalizeHandle(handle);
    if (normalized) {
      matches.push(normalized);
    }
    return _fullMatch;
  });

  return matches;
};

export const syncMentionedUserIds = (text: string, mentionsByHandle: Map<string, string>) => {
  const seenHandles = new Set<string>();
  const seenIds = new Set<string>();
  const mentionedUserIds: string[] = [];

  extractHandlesFromText(text).forEach((handle) => {
    const normalizedHandle = normalizeHandle(handle);
    if (!normalizedHandle || seenHandles.has(normalizedHandle)) {
      return;
    }

    seenHandles.add(normalizedHandle);
    const userId = mentionsByHandle.get(normalizedHandle);
    if (!userId || seenIds.has(userId)) {
      return;
    }

    seenIds.add(userId);
    mentionedUserIds.push(userId);
  });

  return mentionedUserIds;
};
