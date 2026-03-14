import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { getConnectPortalCacheSnapshot, refreshConnectPortalPublishedEvents } from './index';
import type { ConnectPortalCacheSnapshot } from './types';

export type ConnectPortalErrorCode = 'network' | 'auth' | 'parse' | 'unknown';

export type ConnectPortalError = {
  code: ConnectPortalErrorCode;
  message: string;
} | null;

type ConnectPortalContextValue = {
  snapshot: ConnectPortalCacheSnapshot;
  loading: boolean;
  error: ConnectPortalError;
  refresh: (force?: boolean) => Promise<void>;
};

const EMPTY_SNAPSHOT: ConnectPortalCacheSnapshot = {
  drafts: [],
  organizerPublished: [],
  publicPublished: [],
  loadedAt: null,
};

const ConnectPortalContext = createContext<ConnectPortalContextValue | null>(null);

export function ConnectPortalProvider({ children }: PropsWithChildren): React.JSX.Element {
  const [snapshot, setSnapshot] = useState<ConnectPortalCacheSnapshot>(EMPTY_SNAPSHOT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ConnectPortalError>(null);

  const refresh = useCallback(async (force = false) => {
    setError(null);
    try {
      if (force) {
        await refreshConnectPortalPublishedEvents(true);
      }
      const nextSnapshot = await getConnectPortalCacheSnapshot();
      setSnapshot(nextSnapshot);
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : 'Unable to load Connect portal data right now.';
      setError({ code: 'network', message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      snapshot,
      loading,
      error,
      refresh,
    }),
    [snapshot, loading, error, refresh]
  );

  return <ConnectPortalContext.Provider value={value}>{children}</ConnectPortalContext.Provider>;
}

export const useConnectPortalData = () => {
  const context = useContext(ConnectPortalContext);
  if (!context) {
    throw new Error('useConnectPortalData must be used inside ConnectPortalProvider');
  }
  return context;
};
