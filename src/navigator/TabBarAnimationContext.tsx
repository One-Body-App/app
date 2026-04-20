import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated } from 'react-native';

type TabBarTranslateY = Animated.Value | Animated.AnimatedInterpolation<number>;

type TabBarAnimationOwnerId = string | undefined;

type TabBarAnimationContextValue = {
  hiddenOwnerId?: string;
  tabBarTranslateY: TabBarTranslateY;
  hideTabBar: (ownerId?: string) => void;
  setTabBarTranslateY: (value: TabBarTranslateY | number, ownerId?: string) => void;
  resetTabBar: (ownerId?: string) => void;
};

const TabBarAnimationContext = createContext<TabBarAnimationContextValue | null>(null);

type TabBarAnimationProviderProps = {
  children: React.ReactNode;
};

export function TabBarAnimationProvider({ children }: TabBarAnimationProviderProps) {
  const defaultTranslateY = useRef(new Animated.Value(0)).current;
  const ownerIdRef = useRef<TabBarAnimationOwnerId>(undefined);
  const hiddenOwnerIdRef = useRef<TabBarAnimationOwnerId>(undefined);
  const [hiddenOwnerId, setHiddenOwnerId] = useState<string | undefined>(undefined);
  const [tabBarTranslateY, setTabBarTranslateYState] =
    useState<TabBarTranslateY>(defaultTranslateY);

  const setTabBarTranslateY = useCallback(
    (nextValue: TabBarTranslateY | number, ownerId?: string) => {
      if (hiddenOwnerIdRef.current && hiddenOwnerIdRef.current !== ownerId) {
        return;
      }

      ownerIdRef.current = ownerId;

      if (typeof nextValue === 'number') {
        const safeValue = Number.isFinite(nextValue) ? nextValue : 0;
        defaultTranslateY.setValue(safeValue);
        setTabBarTranslateYState(defaultTranslateY);
        return;
      }

      if (!nextValue) {
        defaultTranslateY.setValue(0);
        setTabBarTranslateYState(defaultTranslateY);
        return;
      }

      setTabBarTranslateYState(nextValue);
    },
    [defaultTranslateY]
  );

  const hideTabBar = useCallback((ownerId?: string) => {
    ownerIdRef.current = ownerId;
    hiddenOwnerIdRef.current = ownerId;
    setHiddenOwnerId(ownerId);
  }, []);

  const resetTabBar = useCallback(
    (ownerId?: string) => {
      if (ownerId && ownerIdRef.current && ownerIdRef.current !== ownerId) {
        return;
      }

      ownerIdRef.current = undefined;
      hiddenOwnerIdRef.current = undefined;
      setHiddenOwnerId(undefined);
      defaultTranslateY.setValue(0);
      setTabBarTranslateYState(defaultTranslateY);
    },
    [defaultTranslateY]
  );

  const value = useMemo(
    () => ({
      hiddenOwnerId,
      hideTabBar,
      tabBarTranslateY,
      setTabBarTranslateY,
      resetTabBar,
    }),
    [hiddenOwnerId, hideTabBar, resetTabBar, setTabBarTranslateY, tabBarTranslateY]
  );

  return (
    <TabBarAnimationContext.Provider value={value}>{children}</TabBarAnimationContext.Provider>
  );
}

export function useTabBarAnimation() {
  return useContext(TabBarAnimationContext);
}
