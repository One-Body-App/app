import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { useNotificationsDismissal } from './useNotificationsDismissal';
import { cleanupNotificationsDismissal, closeNotifications } from './dismissNotifications';

jest.mock('@react-navigation/native', () => {
  const ReactLocal = jest.requireActual('react');

  return {
    useFocusEffect: jest.fn((effect) => {
      ReactLocal.useEffect(() => effect(), [effect]);
    }),
  };
});

jest.mock('./dismissNotifications', () => ({
  cleanupNotificationsDismissal: jest.fn(),
  closeNotifications: jest.fn(),
}));

type HarnessProps = {
  navigation: {
    canGoBack?: () => boolean;
    getParent?: () => unknown;
    goBack?: () => void;
  };
  tabBarAnimation: {
    resetTabBar?: () => void;
    setTabBarTranslateY?: (value: number) => void;
  } | null;
  onCloseHandler: (handler: () => void) => void;
};

function NotificationsDismissalHarness({
  navigation,
  tabBarAnimation,
  onCloseHandler,
}: HarnessProps) {
  const handleCloseNotifications = useNotificationsDismissal({
    navigation,
    tabBarAnimation,
  });

  React.useEffect(() => {
    onCloseHandler(handleCloseNotifications);
  }, [handleCloseNotifications, onCloseHandler]);

  return null;
}

describe('useNotificationsDismissal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not run blur cleanup when the tab bar animation object identity changes', () => {
    const navigation = {
      canGoBack: jest.fn(() => true),
      getParent: jest.fn(),
      goBack: jest.fn(),
    };
    const firstTabBarAnimation = {
      resetTabBar: jest.fn(),
      setTabBarTranslateY: jest.fn(),
    };
    const secondTabBarAnimation = {
      resetTabBar: jest.fn(),
      setTabBarTranslateY: jest.fn(),
    };
    const onCloseHandler = jest.fn();

    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <NotificationsDismissalHarness
          navigation={navigation}
          tabBarAnimation={firstTabBarAnimation}
          onCloseHandler={onCloseHandler}
        />
      );
    });

    expect(cleanupNotificationsDismissal).not.toHaveBeenCalled();

    act(() => {
      renderer.update(
        <NotificationsDismissalHarness
          navigation={navigation}
          tabBarAnimation={secondTabBarAnimation}
          onCloseHandler={onCloseHandler}
        />
      );
    });

    expect(cleanupNotificationsDismissal).not.toHaveBeenCalled();

    act(() => {
      renderer.unmount();
    });

    expect(cleanupNotificationsDismissal).toHaveBeenCalledTimes(1);
    expect(cleanupNotificationsDismissal).toHaveBeenCalledWith({
      navigation,
      tabBarAnimation: secondTabBarAnimation,
    });
  });

  it('uses the latest tab bar animation controller when the user closes notifications', () => {
    const navigation = {
      canGoBack: jest.fn(() => true),
      getParent: jest.fn(),
      goBack: jest.fn(),
    };
    const firstTabBarAnimation = {
      resetTabBar: jest.fn(),
      setTabBarTranslateY: jest.fn(),
    };
    const secondTabBarAnimation = {
      resetTabBar: jest.fn(),
      setTabBarTranslateY: jest.fn(),
    };
    let closeHandler: (() => void) | undefined;

    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <NotificationsDismissalHarness
          navigation={navigation}
          tabBarAnimation={firstTabBarAnimation}
          onCloseHandler={(handler) => {
            closeHandler = handler;
          }}
        />
      );
    });

    act(() => {
      renderer.update(
        <NotificationsDismissalHarness
          navigation={navigation}
          tabBarAnimation={secondTabBarAnimation}
          onCloseHandler={(handler) => {
            closeHandler = handler;
          }}
        />
      );
    });

    act(() => {
      closeHandler?.();
    });

    expect(closeNotifications).toHaveBeenCalledTimes(1);
    expect(closeNotifications).toHaveBeenCalledWith({
      navigation,
      tabBarAnimation: secondTabBarAnimation,
    });

    act(() => {
      renderer.unmount();
    });
  });
});
