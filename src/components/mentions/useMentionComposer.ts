import { useCallback, useMemo, useRef, useState } from 'react';
import type { TaggedMention } from '@/utils/types';
import {
  ActiveMention,
  MentionSelection,
  MentionSuggestion,
  findMentionRangeBeforeCursor,
  findMentionsAffectedByTextChange,
  findActiveMention,
  removeMentionRangesFromText,
  replaceMentionAtRange,
  syncMentions,
  toTaggedMention,
} from './mentionUtils';

const identityText = (value: string) => value;

const createMentionsByHandleMap = (mentions: TaggedMention[] = []) =>
  mentions.reduce<Map<string, TaggedMention>>((accumulator, mention) => {
    const normalizedHandle = String(mention?.username ?? '')
      .trim()
      .replace(/^@+/, '')
      .toLowerCase();
    if (!normalizedHandle || accumulator.has(normalizedHandle)) {
      return accumulator;
    }

    accumulator.set(normalizedHandle, {
      userId: String(mention.userId),
      username: normalizedHandle,
      displayName: String(mention.displayName || mention.username || '').trim() || normalizedHandle,
    });
    return accumulator;
  }, new Map<string, TaggedMention>());

// eslint-disable-next-line import/prefer-default-export
export const useMentionComposer = ({
  initialText = '',
  initialMentions = [],
  sanitizeText = identityText,
}: {
  initialText?: string;
  initialMentions?: TaggedMention[];
  sanitizeText?: (value: string) => string;
}) => {
  const sanitizeTextRef = useRef(sanitizeText);
  sanitizeTextRef.current = sanitizeText;

  const [text, setTextState] = useState(() => sanitizeTextRef.current(initialText));
  const [selection, setSelectionState] = useState<MentionSelection>(() => {
    const { length } = sanitizeTextRef.current(initialText);
    return { start: length, end: length };
  });
  const selectionRef = useRef(selection);
  selectionRef.current = selection;

  const mentionsByHandleRef = useRef(createMentionsByHandleMap(initialMentions));
  const [mentionsVersion, setMentionsVersion] = useState(0);

  const pruneMentions = useCallback((nextText: string) => {
    const nextMentions = syncMentions(nextText, mentionsByHandleRef.current);
    if (nextMentions.length === mentionsByHandleRef.current.size) {
      return;
    }

    const nextMentionIds = new Set(nextMentions.map((mention) => mention.userId));
    const handlesStillPresent = new Set(
      Array.from(mentionsByHandleRef.current.entries())
        .filter(([, mention]) => nextMentionIds.has(mention.userId))
        .map(([handle]) => handle)
    );
    const nextMap = new Map<string, TaggedMention>();
    mentionsByHandleRef.current.forEach((mention, handle) => {
      if (handlesStillPresent.has(handle)) {
        nextMap.set(handle, mention);
      }
    });
    mentionsByHandleRef.current = nextMap;
    setMentionsVersion((current) => current + 1);
  }, []);

  const applyTextChange = useCallback(
    (
      value: string | ((currentValue: string) => string),
      options?: { preserveSelection?: boolean }
    ) => {
      setTextState((currentValue) => {
        const nextValue = typeof value === 'function' ? value(currentValue) : value;
        const sanitizedValue = sanitizeTextRef.current(nextValue);
        const affectedMentionRanges = findMentionsAffectedByTextChange(
          currentValue,
          sanitizedValue,
          mentionsByHandleRef.current
        );

        if (affectedMentionRanges.length > 0) {
          const removal = removeMentionRangesFromText(currentValue, affectedMentionRanges);
          affectedMentionRanges.forEach((range) => {
            mentionsByHandleRef.current.delete(range.handle);
          });
          setMentionsVersion((current) => current + 1);
          if (!options?.preserveSelection && removal.selection) {
            selectionRef.current = removal.selection;
            setSelectionState(removal.selection);
          }
          return sanitizeTextRef.current(removal.text);
        }

        pruneMentions(sanitizedValue);
        return sanitizedValue;
      });
    },
    [pruneMentions]
  );

  const setText = useCallback(
    (value: string | ((currentValue: string) => string)) => {
      applyTextChange(value);
    },
    [applyTextChange]
  );

  const setSelection = useCallback((nextSelection: MentionSelection) => {
    selectionRef.current = nextSelection;
    setSelectionState((currentSelection) => {
      if (
        currentSelection.start === nextSelection.start &&
        currentSelection.end === nextSelection.end
      ) {
        return currentSelection;
      }

      return nextSelection;
    });
  }, []);

  const activeMention = useMemo<ActiveMention | null>(
    () => findActiveMention(text, selection),
    [selection, text]
  );

  const selectMention = useCallback(
    (suggestion: MentionSuggestion) => {
      if (!activeMention) {
        return;
      }

      const replacement = replaceMentionAtRange(text, activeMention, suggestion.username);
      const nextMention = toTaggedMention(suggestion);
      mentionsByHandleRef.current.set(nextMention.username, nextMention);
      setMentionsVersion((current) => current + 1);
      setTextState(sanitizeTextRef.current(replacement.text));
      selectionRef.current = replacement.selection;
      setSelectionState(replacement.selection);
    },
    [activeMention, text]
  );

  const deleteMentionBeforeCursor = useCallback(() => {
    const range = findMentionRangeBeforeCursor(
      text,
      selectionRef.current,
      mentionsByHandleRef.current
    );
    if (!range) {
      return false;
    }

    const removal = removeMentionRangesFromText(text, [range]);
    mentionsByHandleRef.current.delete(range.handle);
    setMentionsVersion((current) => current + 1);
    setTextState(sanitizeTextRef.current(removal.text));
    if (removal.selection) {
      selectionRef.current = removal.selection;
      setSelectionState(removal.selection);
    }
    return true;
  }, [text]);

  const reset = useCallback((nextText = '') => {
    mentionsByHandleRef.current = new Map();
    setMentionsVersion((current) => current + 1);
    const sanitizedValue = sanitizeTextRef.current(nextText);
    setTextState(sanitizedValue);
    const nextSelection = {
      start: sanitizedValue.length,
      end: sanitizedValue.length,
    };
    selectionRef.current = nextSelection;
    setSelectionState(nextSelection);
  }, []);
  const hydrate = useCallback((nextText = '', nextMentions: TaggedMention[] = []) => {
    mentionsByHandleRef.current = createMentionsByHandleMap(nextMentions);
    setMentionsVersion((current) => current + 1);
    const sanitizedValue = sanitizeTextRef.current(nextText);
    setTextState(sanitizedValue);
    const nextSelection = {
      start: sanitizedValue.length,
      end: sanitizedValue.length,
    };
    selectionRef.current = nextSelection;
    setSelectionState(nextSelection);
  }, []);

  // mentionsVersion is a mutation counter that bumps whenever mentionsByHandleRef.current
  // changes, so reading it inside the memo makes the dependency genuine.
  const mentions = useMemo(
    () => syncMentions(text, mentionsVersion >= 0 ? mentionsByHandleRef.current : new Map()),
    [text, mentionsVersion]
  );
  const mentionedUserIds = useMemo(() => mentions.map((mention) => mention.userId), [mentions]);

  return {
    text,
    setText,
    applyTextChange,
    selection,
    setSelection,
    activeMention,
    mentions,
    committedTags: mentions,
    mentionedUserIds,
    selectMention,
    deleteMentionBeforeCursor,
    reset,
    hydrate,
  };
};
