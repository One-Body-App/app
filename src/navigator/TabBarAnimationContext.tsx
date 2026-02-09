import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated } from 'react-native';

type TabBarTranslateY = Animated.Value | Animated.AnimatedInterpolation<number>;

type TabBarAnimationContextValue = {
  tabBarTranslateY: TabBarTranslateY;
  setTabBarTranslateY: (value: TabBarTranslateY | number) => void;
  resetTabBar: () => void;
};

const TabBarAnimationContext = createContext<TabBarAnimationContextValue | null>(null);

type TabBarAnimationProviderProps = {
  children: React.ReactNode;
};

export function TabBarAnimationProvider({ children }: TabBarAnimationProviderProps) {
  const defaultTranslateY = useRef(new Animated.Value(0)).current;
  const [tabBarTranslateY, setTabBarTranslateYState] =
    useState<TabBarTranslateY>(defaultTranslateY);

  const setTabBarTranslateY = useCallback(
    (nextValue: TabBarTranslateY | number) => {
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

  const resetTabBar = useCallback(() => {
    defaultTranslateY.setValue(0);
    setTabBarTranslateYState(defaultTranslateY);
  }, [defaultTranslateY]);

  const value = useMemo(
    () => ({
      tabBarTranslateY,
      setTabBarTranslateY,
      resetTabBar,
    }),
    [resetTabBar, setTabBarTranslateY, tabBarTranslateY]
  );

  return (
    <TabBarAnimationContext.Provider value={value}>{children}</TabBarAnimationContext.Provider>
  );
}

export function useTabBarAnimation() {
  return useContext(TabBarAnimationContext);
}
