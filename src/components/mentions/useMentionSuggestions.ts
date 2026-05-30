// eslint-disable-next-line no-restricted-imports
import { useEffect, useRef, useState } from 'react';
import useMountEffect from '@/src/hooks/useMountEffect';
import { fetchUserSuggestions, MentionUser } from '@/services/mentions';
import { normalizeHandle } from './mentionUtils';

type MentionSearchFn = typeof fetchUserSuggestions;
type MentionSuggestionsState = {
  suggestions: MentionUser[];
  isLoading: boolean;
  isError: boolean;
};

// eslint-disable-next-line import/prefer-default-export
export const useMentionSuggestions = ({
  query,
  token,
  limit = 8,
  debounceMs = 300,
  enabled = true,
  searchUsers = fetchUserSuggestions,
  excludedUserIds = [],
}: {
  query: string;
  token?: string | null;
  limit?: number;
  debounceMs?: number;
  enabled?: boolean;
  searchUsers?: MentionSearchFn;
  excludedUserIds?: string[];
}) => {
  const [state, setState] = useState<MentionSuggestionsState>({
    suggestions: [],
    isLoading: false,
    isError: false,
  });
  const requestIdRef = useRef(0);
  const activeAbortRef = useRef<AbortController | null>(null);

  const excludedUserIdsKey = excludedUserIds.join(',');

  useEffect(() => {
    const normalizedQuery = normalizeHandle(query);
    if (!enabled || normalizedQuery.length < 1) {
      activeAbortRef.current?.abort();
      activeAbortRef.current = null;
      requestIdRef.current += 1;
      setState({ suggestions: [], isLoading: false, isError: false });
      return undefined;
    }

    const effectRequestId = requestIdRef.current + 1;
    requestIdRef.current = effectRequestId;
    const timeoutId = setTimeout(() => {
      activeAbortRef.current?.abort();

      const controller = new AbortController();
      activeAbortRef.current = controller;
      setState((current) => ({ ...current, isLoading: true, isError: false }));

      searchUsers({
        query: normalizedQuery,
        token,
        limit,
        signal: controller.signal,
        context: 'tagging',
      })
        .then((response) => {
          if (requestIdRef.current !== effectRequestId) {
            return;
          }

          const excludedIds = new Set(
            excludedUserIdsKey.split(',').flatMap((value) => {
              const trimmed = value.trim();
              return trimmed ? [trimmed] : [];
            })
          );
          setState({
            suggestions: response.filter((item) => !excludedIds.has(item.id)).slice(0, limit),
            isLoading: false,
            isError: false,
          });
        })
        .catch((error: any) => {
          if (requestIdRef.current !== effectRequestId) {
            return;
          }

          if (error?.name === 'AbortError') {
            setState((current) => ({ ...current, isLoading: false }));
            return;
          }

          setState({ suggestions: [], isLoading: false, isError: true });
        });
    }, debounceMs);

    return () => {
      clearTimeout(timeoutId);
      activeAbortRef.current?.abort();
      activeAbortRef.current = null;
    };
  }, [debounceMs, enabled, excludedUserIdsKey, limit, query, searchUsers, token]);

  useMountEffect(() => () => {
    activeAbortRef.current?.abort();
    activeAbortRef.current = null;
  });

  return state;
};
