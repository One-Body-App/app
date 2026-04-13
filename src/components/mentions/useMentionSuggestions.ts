// eslint-disable-next-line no-restricted-imports
import { useEffect, useRef, useState } from 'react';
import useMountEffect from '@/src/hooks/useMountEffect';
import { fetchUserSuggestions, MentionUser } from '@/services/mentions';
import { normalizeHandle } from './mentionUtils';

type MentionSearchFn = typeof fetchUserSuggestions;

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
  const [suggestions, setSuggestions] = useState<MentionUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const requestIdRef = useRef(0);
  const activeAbortRef = useRef<AbortController | null>(null);

  const excludedUserIdsKey = excludedUserIds.join(',');

  useEffect(() => {
    const normalizedQuery = normalizeHandle(query);
    if (!enabled || normalizedQuery.length < 1) {
      activeAbortRef.current?.abort();
      activeAbortRef.current = null;
      requestIdRef.current += 1;
      setSuggestions([]);
      setIsLoading(false);
      setIsError(false);
      return undefined;
    }

    const effectRequestId = requestIdRef.current + 1;
    requestIdRef.current = effectRequestId;
    const timeoutId = setTimeout(() => {
      activeAbortRef.current?.abort();

      const controller = new AbortController();
      activeAbortRef.current = controller;
      setIsLoading(true);
      setIsError(false);

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
            excludedUserIdsKey
              .split(',')
              .map((value) => value.trim())
              .filter(Boolean)
          );
          setSuggestions(response.filter((item) => !excludedIds.has(item.id)).slice(0, limit));
          setIsLoading(false);
          setIsError(false);
        })
        .catch((error: any) => {
          if (requestIdRef.current !== effectRequestId) {
            return;
          }

          if (error?.name === 'AbortError') {
            setIsLoading(false);
            return;
          }

          setSuggestions([]);
          setIsLoading(false);
          setIsError(true);
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

  return {
    suggestions,
    isLoading,
    isError,
  };
};
