import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import {
  TabBarAnimationProvider,
  useTabBarAnimation,
} from '../TabBarAnimationContext';

function Capture({
  onReady,
}: {
  onReady: (value: NonNullable<ReturnType<typeof useTabBarAnimation>>) => void;
}) {
  const value = useTabBarAnimation();

  React.useEffect(() => {
    if (value) {
      onReady(value);
    }
  }, [onReady, value]);

  return null;
}

describe('TabBarAnimationContext', () => {
  it('lets a later owner ignore a stale reset from the previous owner', () => {
    let contextValue: NonNullable<ReturnType<typeof useTabBarAnimation>> | null = null;

    act(() => {
      TestRenderer.create(
        <TabBarAnimationProvider>
          <Capture
            onReady={(value) => {
              contextValue = value;
            }}
          />
        </TabBarAnimationProvider>
      );
    });

    expect(contextValue).toBeTruthy();

    act(() => {
      contextValue!.setTabBarTranslateY(24, 'home');
    });

    act(() => {
      contextValue!.setTabBarTranslateY(88, 'prayer-wall');
    });

    act(() => {
      contextValue!.resetTabBar('home');
    });

    act(() => {
      (contextValue!.tabBarTranslateY as any).stopAnimation?.();
    });

    let currentValue = -1;
    act(() => {
      (contextValue!.tabBarTranslateY as any).stopAnimation?.((value: number) => {
        currentValue = value;
      });
    });

    expect(currentValue).toBe(88);
  });

  it('still allows the active owner to reset the bar', () => {
    let contextValue: NonNullable<ReturnType<typeof useTabBarAnimation>> | null = null;

    act(() => {
      TestRenderer.create(
        <TabBarAnimationProvider>
          <Capture
            onReady={(value) => {
              contextValue = value;
            }}
          />
        </TabBarAnimationProvider>
      );
    });

    act(() => {
      contextValue!.setTabBarTranslateY(72, 'prayer-wall');
      contextValue!.resetTabBar('prayer-wall');
    });

    let currentValue = -1;
    act(() => {
      (contextValue!.tabBarTranslateY as any).stopAnimation?.((value: number) => {
        currentValue = value;
      });
    });

    expect(currentValue).toBe(0);
  });

  it('keeps the bar explicitly hidden from stale non-owner updates', () => {
    let contextValue: NonNullable<ReturnType<typeof useTabBarAnimation>> | null = null;

    act(() => {
      TestRenderer.create(
        <TabBarAnimationProvider>
          <Capture
            onReady={(value) => {
              contextValue = value;
            }}
          />
        </TabBarAnimationProvider>
      );
    });

    act(() => {
      contextValue!.hideTabBar('prayer-wall');
    });

    act(() => {
      contextValue!.setTabBarTranslateY(24, 'home');
    });

    expect(contextValue!.hiddenOwnerId).toBe('prayer-wall');
  });
});
