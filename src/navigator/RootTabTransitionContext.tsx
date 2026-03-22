import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import {
  AnimatedRootTabName,
  RootTabTransitionPayload,
  getRootTabTransitionDirection,
  isAnimatedRootTabName,
} from './rootTabTransition';

type RootTabTransitionContextValue = {
  currentTab: AnimatedRootTabName | null;
  latestTransition: RootTabTransitionPayload | null;
  reportActiveTab: (tabName: string | null | undefined) => void;
};

const RootTabTransitionContext = createContext<RootTabTransitionContextValue | null>(null);

type RootTabTransitionProviderProps = {
  children: React.ReactNode;
};

export function RootTabTransitionProvider({ children }: RootTabTransitionProviderProps) {
  const currentTabRef = useRef<AnimatedRootTabName | null>(null);
  const transitionTokenRef = useRef(0);
  const [currentTab, setCurrentTab] = useState<AnimatedRootTabName | null>(null);
  const [latestTransition, setLatestTransition] = useState<RootTabTransitionPayload | null>(null);

  const reportActiveTab = useCallback((tabName: string | null | undefined) => {
    if (!isAnimatedRootTabName(tabName)) {
      return;
    }

    const previousTab = currentTabRef.current;
    if (!previousTab) {
      currentTabRef.current = tabName;
      setCurrentTab(tabName);
      return;
    }

    if (previousTab === tabName) {
      return;
    }

    const direction = getRootTabTransitionDirection(previousTab, tabName);
    currentTabRef.current = tabName;
    setCurrentTab(tabName);

    if (direction === 'none') {
      return;
    }

    transitionTokenRef.current += 1;
    setLatestTransition({
      fromTab: previousTab,
      toTab: tabName,
      direction,
      token: transitionTokenRef.current,
    });
  }, []);

  const value = useMemo(
    () => ({
      currentTab,
      latestTransition,
      reportActiveTab,
    }),
    [currentTab, latestTransition, reportActiveTab]
  );

  return (
    <RootTabTransitionContext.Provider value={value}>{children}</RootTabTransitionContext.Provider>
  );
}

export function useRootTabTransition() {
  return useContext(RootTabTransitionContext);
}

export function useRootTabSwitchReplayToken(tabName: AnimatedRootTabName) {
  const transitionContext = useRootTabTransition();
  if (
    !transitionContext?.latestTransition ||
    transitionContext.latestTransition.toTab !== tabName
  ) {
    return 0;
  }

  return transitionContext.latestTransition.token;
}
