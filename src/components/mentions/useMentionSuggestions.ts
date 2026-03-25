import { useEffect, useRef, useState } from 'react';
import { fetchUserSuggestions, MentionUser } from '@/services/mentions';
import { normalizeHandle } from './mentionUtils';

type MentionSearchFn = typeof fetchUserSuggestions;

export const useMentionSuggestions = ({
  query,
  token,
  limit = 8,
  debounceMs = 250,
  enabled = true,
  searchUsers = fetchUserSuggestions,
}: {
  query: string;
  token?: string | null;
  limit?: number;
  debounceMs?: number;
  enabled?: boolean;
  searchUsers?: MentionSearchFn;
}) => {
  const [suggestions, setSuggestions] = useState<MentionUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const requestIdRef = useRef(0);
  const activeAbortRef = useRef<AbortController | null>(null);

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
      })
        .then((response) => {
          if (requestIdRef.current !== effectRequestId) {
            return;
          }

          setSuggestions(response.slice(0, limit));
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
  }, [debounceMs, enabled, limit, query, searchUsers, token]);

  useEffect(() => {
    return () => {
      activeAbortRef.current?.abort();
      activeAbortRef.current = null;
    };
  }, []);

  return {
    suggestions,
    isLoading,
    isError,
  };
};
