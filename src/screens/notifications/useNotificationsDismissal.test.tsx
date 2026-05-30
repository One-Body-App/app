import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { useNotificationsDismissal } from './useNotificationsDismissal';
import { cleanupNotificationsDismissal, closeNotifications } from './dismissNotifications';

jest.mock('./dismissNotifications', () => ({
  cleanupNotificationsDismissal: jest.fn(),
  closeNotifications: jest.fn(),
}));

type HarnessProps = {
  navigation: {
    addListener?: (
      eventName: 'beforeRemove',
      listener: () => void
    ) => void | (() => void) | { remove?: () => void };
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

  it('does not run cleanup when notifications loses focus because settings is pushed', () => {
    const navigation = {
      addListener: jest.fn(() => jest.fn()),
      canGoBack: jest.fn(() => true),
      getParent: jest.fn(),
      goBack: jest.fn(),
    };
    const tabBarAnimation = {
      resetTabBar: jest.fn(),
      setTabBarTranslateY: jest.fn(),
    };

    act(() => {
      TestRenderer.create(
        <NotificationsDismissalHarness
          navigation={navigation}
          tabBarAnimation={tabBarAnimation}
          onCloseHandler={jest.fn()}
        />
      );
    });

    expect(navigation.addListener).toHaveBeenCalledWith('beforeRemove', expect.any(Function));
    expect(cleanupNotificationsDismissal).not.toHaveBeenCalled();
  });

  it('uses the latest tab bar animation controller when notifications is removed', () => {
    const navigation = {
      addListener: jest.fn(),
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
    let beforeRemoveHandler: (() => void) | undefined;

    let renderer: TestRenderer.ReactTestRenderer;
    navigation.addListener.mockImplementation((_eventName, listener) => {
      beforeRemoveHandler = listener;
      return jest.fn();
    });

    act(() => {
      renderer = TestRenderer.create(
        <NotificationsDismissalHarness
          navigation={navigation}
          tabBarAnimation={firstTabBarAnimation}
          onCloseHandler={jest.fn()}
        />
      );
    });

    act(() => {
      renderer.update(
        <NotificationsDismissalHarness
          navigation={navigation}
          tabBarAnimation={secondTabBarAnimation}
          onCloseHandler={jest.fn()}
        />
      );
    });

    act(() => {
      beforeRemoveHandler?.();
    });

    expect(cleanupNotificationsDismissal).toHaveBeenCalledTimes(1);
    expect(cleanupNotificationsDismissal).toHaveBeenCalledWith({
      navigation,
      tabBarAnimation: secondTabBarAnimation,
    });

    act(() => {
      renderer.unmount();
    });
  });

  it('uses the latest tab bar animation controller when the user closes notifications', () => {
    const navigation = {
      addListener: jest.fn(() => jest.fn()),
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
