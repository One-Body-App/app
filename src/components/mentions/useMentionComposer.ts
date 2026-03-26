import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActiveMention,
  MentionSelection,
  MentionSuggestion,
  clampSelection,
  findActiveMention,
  replaceMentionAtRange,
  syncMentionedUserIds,
} from './mentionUtils';

const identityText = (value: string) => value;

export const useMentionComposer = ({
  initialText = '',
  sanitizeText = identityText,
}: {
  initialText?: string;
  sanitizeText?: (value: string) => string;
}) => {
  const sanitizeTextRef = useRef(sanitizeText);
  useEffect(() => {
    sanitizeTextRef.current = sanitizeText;
  }, [sanitizeText]);

  const [text, setTextState] = useState(() => sanitizeTextRef.current(initialText));
  const [selection, setSelectionState] = useState<MentionSelection>(() => {
    const { length } = sanitizeTextRef.current(initialText);
    return { start: length, end: length };
  });
  const mentionsByHandleRef = useRef(new Map<string, string>());
  const [mentionsVersion, setMentionsVersion] = useState(0);

  const pruneMentions = useCallback((nextText: string) => {
    const nextMentionedUserIds = syncMentionedUserIds(nextText, mentionsByHandleRef.current);
    if (nextMentionedUserIds.length === mentionsByHandleRef.current.size) {
      return;
    }

    const handlesStillPresent = new Set(
      Array.from(mentionsByHandleRef.current.entries())
        .filter(([, userId]) => nextMentionedUserIds.includes(userId))
        .map(([handle]) => handle)
    );
    const nextMap = new Map<string, string>();
    mentionsByHandleRef.current.forEach((userId, handle) => {
      if (handlesStillPresent.has(handle)) {
        nextMap.set(handle, userId);
      }
    });
    mentionsByHandleRef.current = nextMap;
    setMentionsVersion((current) => current + 1);
  }, []);

  const setText = useCallback(
    (value: string | ((currentValue: string) => string)) => {
      setTextState((currentValue) => {
        const nextValue = typeof value === 'function' ? value(currentValue) : value;
        const sanitizedValue = sanitizeTextRef.current(nextValue);
        pruneMentions(sanitizedValue);
        setSelectionState((currentSelection) =>
          clampSelection(currentSelection, sanitizedValue.length)
        );
        return sanitizedValue;
      });
    },
    [pruneMentions]
  );

  const setSelection = useCallback(
    (nextSelection: MentionSelection) => {
      setSelectionState((currentSelection) => {
        if (
          currentSelection.start === nextSelection.start &&
          currentSelection.end === nextSelection.end
        ) {
          return currentSelection;
        }

        return clampSelection(nextSelection, text.length);
      });
    },
    [text.length]
  );

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
      mentionsByHandleRef.current.set(suggestion.username.toLowerCase(), suggestion.id);
      setMentionsVersion((current) => current + 1);
      setTextState(sanitizeTextRef.current(replacement.text));
      setSelectionState(replacement.selection);
    },
    [activeMention, text]
  );

  const reset = useCallback((nextText = '') => {
    mentionsByHandleRef.current = new Map();
    setMentionsVersion((current) => current + 1);
    const sanitizedValue = sanitizeTextRef.current(nextText);
    setTextState(sanitizedValue);
    setSelectionState({
      start: sanitizedValue.length,
      end: sanitizedValue.length,
    });
  }, []);

  const mentionedUserIds = useMemo(
    () => syncMentionedUserIds(text, mentionsByHandleRef.current),
    [mentionsVersion, text]
  );

  return {
    text,
    setText,
    selection,
    setSelection,
    activeMention,
    mentionedUserIds,
    selectMention,
    reset,
  };
};
