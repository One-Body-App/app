import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Platform } from 'react-native';
import { useSelector } from 'react-redux';

import Home, { FeedTypes } from '../index';
import { PostType } from '@/utils/types';
import useSharedImageViewer from '@/components/imageViewer/useSharedImageViewer';
import { spacing } from '@/src/styles/spacing';

const mockReact = React;
const mockSocialItemProps: any[] = [];
const mockOpenImages = jest.fn();
const mockImageViewerElement = mockReact.createElement('MockImageViewer', {
  testID: 'home-image-viewer',
});
const mockApiCall = jest.fn();
const mockHideTabBar = jest.fn();
const mockSetTabBarTranslateY = jest.fn();
const mockResetTabBar = jest.fn();
const mockNavigationObject = {
  setOptions: jest.fn(),
  navigate: jest.fn(),
  push: jest.fn(),
  getParent: jest.fn(),
  dispatch: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => mockNavigationObject),
  useIsFocused: jest.fn(() => true),
  useTheme: jest.fn(() => ({
    dark: false,
    colors: {
      text: '#111111',
      card: '#ffffff',
      border: '#dddddd',
      background: '#ffffff',
    },
  })),
  useScrollToTop: jest.fn(),
  DrawerActions: {
    toggleDrawer: jest.fn(() => ({ type: 'TOGGLE_DRAWER' })),
  },
  useFocusEffect: jest.fn(),
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('react-native-simple-toast', () => ({
  show: jest.fn(),
}));

jest.mock('@react-native-community/blur', () => ({
  BlurView: 'BlurView',
}));

jest.mock('iconsax-react-native', () => {
  const ReactLocal = require('react');
  const Icon = ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
    ReactLocal.createElement('Icon', props, children);

  return {
    Heart: Icon,
    Message: Icon,
    Send2: Icon,
    ArchiveMinus: Icon,
    More: Icon,
    Gallery: Icon,
    ArrowDown2: Icon,
    Notification: Icon,
  };
});

jest.mock('@/navigator/TabBarAnimationContext', () => ({
  useTabBarAnimation: jest.fn(() => ({
    hideTabBar: mockHideTabBar,
    setTabBarTranslateY: mockSetTabBarTranslateY,
    resetTabBar: mockResetTabBar,
  })),
}));

jest.mock('@/src/navigator/motionPolicy', () => ({
  getTabRootSpringboardPreset: jest.fn(() => 'none'),
  HOME_FEED_LIST_BATCH_CONFIG: {
    initialNumToRender: 10,
    maxToRenderPerBatch: 10,
    windowSize: 5,
  },
  SHOULD_RUN_HOME_FEED_INTRO: false,
}));

jest.mock('@/src/navigator/RootTabTransitionContext', () => ({
  useRootTabSwitchReplayToken: jest.fn(() => 0),
}));

jest.mock('@/src/hooks/useSpringboardEntry', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    getSpringboardStyle: jest.fn(() => null),
  })),
}));

jest.mock('@/src/hooks/useMountEffect', () => {
  const ReactLocal = require('react');
  return {
    __esModule: true,
    default: (effect: () => void | (() => void)) => {
      ReactLocal.useEffect(effect, []);
    },
  };
});

jest.mock('@/src/hooks/useObservedEffect', () => {
  const ReactLocal = require('react');
  return {
    __esModule: true,
    default: (effect: () => void | (() => void), deps?: React.DependencyList) => {
      ReactLocal.useEffect(effect, deps);
    },
  };
});

jest.mock('@/src/hooks/useScrollIntentLock', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    onScrollBeginDrag: jest.fn(),
    onScrollEndDrag: jest.fn(),
    onMomentumScrollBegin: jest.fn(),
    onMomentumScrollEnd: jest.fn(),
  })),
}));

jest.mock('@/services/api', () => ({
  ApiCall: (...args: any[]) => mockApiCall(...args),
}));

jest.mock('../quickPost', () => ({
  buildQuickPostContent: jest.fn(() => null),
  getQuickPostErrorMessage: jest.fn(() => 'Unable to post right now.'),
  moderateQuickPostText: jest.fn(async () => ({ blocked: false })),
  QUICK_POST_PENDING_REVIEW_MESSAGE: 'Pending review',
}));

jest.mock('@/components/styled/Text', () => {
  return function MockStyledText({
    children,
    ...props
  }: {
    children?: React.ReactNode;
    [key: string]: unknown;
  }) {
    return mockReact.createElement('Text', props, children);
  };
});

jest.mock('@/components/listItems/ArticleItem', () => 'ArticleItem');
jest.mock('@/components/listItems/PrayerItem', () => 'PrayerItem');
jest.mock('@/components/avatar/FeedAvatar', () => 'FeedAvatar');
jest.mock('@/components/prayerWallComponent', () => 'PrayerWallComponent');
jest.mock('@/components/prayerWallSavedPrayersComponent', () => 'PrayerWallSavedPrayersComponent');
jest.mock('@/components/prayerWallMyPrayersComponent', () => 'PrayerWallMyPrayersComponent');
jest.mock(
  '@/components/prayerWallTestimoniesComponent',
  () => 'PrayerWallTestimoniesComponent'
);
jest.mock('@/components/GlassTabBar', () => 'GlassTabBar');
jest.mock('@/components/HeaderGradientOverlay', () => 'HeaderGradientOverlay');

jest.mock('@/components/listItems/SocialItem', () => {
  return function MockSocialItem(props: any) {
    mockSocialItemProps.push(props);
    return mockReact.createElement('SocialItem', props);
  };
});

jest.mock('@/components/imageViewer/useSharedImageViewer', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/services/feedTelemetry', () => ({
  flushFeedTelemetry: jest.fn(() => Promise.resolve()),
  setFeedTelemetryAuthToken: jest.fn(),
}));

jest.mock('@/services/ownedPostDeletion', () => ({
  deleteOwnedPost: jest.fn(),
  emitOwnedPostDeleted: jest.fn(),
  normalizeOwnedPostType: jest.fn((type: string) => type),
  subscribeToFeedItemUnavailable: jest.fn(() => jest.fn()),
  subscribeToOwnedPostDeleted: jest.fn(() => jest.fn()),
}));

jest.mock('@/services/postTelemetry', () => ({
  createPostTelemetryRequestId: jest.fn(() => 'request-id'),
  maybeTrackQualifiedPostView: jest.fn(),
  trackPostTelemetry: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  })),
}));

const mockedUseSelector = useSelector as jest.Mock;
const mockedUseSharedImageViewer = useSharedImageViewer as jest.Mock;
const originalRequestAnimationFrame = global.requestAnimationFrame;
const originalCancelAnimationFrame = global.cancelAnimationFrame;

const buildSocialFeedItem = (postId = 'social-post-1', overrides: Record<string, any> = {}) => ({
  postId,
  type: 'social',
  content: `Social image post ${postId}`,
  images: [`https://cdn.example.com/${postId}.jpg`],
  reactions: [],
  comments: [],
  userData: {
    _id: 'author-1',
    name: 'Author One',
    username: 'authorone',
    profileImage: '',
  },
  ...overrides,
});

const buildWatchFeedItem = () => ({
  postId: 'watch-post-1',
  type: 'watch',
  content: 'Watch image post',
  images: ['https://cdn.example.com/watch-1.jpg'],
  reactions: [],
  comments: [],
  userData: {
    _id: 'author-2',
    name: 'Author Two',
    username: 'authortwo',
    profileImage: '',
  },
});

describe('Home image viewer integration', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    global.requestAnimationFrame = jest.fn(() => 0) as any;
    global.cancelAnimationFrame = jest.fn() as any;
    mockSocialItemProps.length = 0;
    mockOpenImages.mockReset();
    mockApiCall.mockReset();
    mockHideTabBar.mockReset();
    mockSetTabBarTranslateY.mockReset();
    mockResetTabBar.mockReset();
    mockNavigationObject.setOptions.mockReset();
    mockNavigationObject.navigate.mockReset();
    mockNavigationObject.push.mockReset();
    mockNavigationObject.getParent.mockReset();
    mockNavigationObject.dispatch.mockReset();

    mockedUseSelector.mockImplementation((selector) =>
      selector({
        auth: {
          userToken: 'token-1',
          getProfileData: {
            _id: 'viewer-1',
            following: [],
            avatar: '',
            profile_image: '',
            profileImage: '',
          },
        },
      })
    );

    mockedUseSharedImageViewer.mockReturnValue({
      imageViewer: mockImageViewerElement,
      openImages: mockOpenImages,
    });

    mockApiCall.mockImplementation(({ route }: { route: string }) => {
      if (route.startsWith('user/get-following-feed/foryou/1')) {
        return Promise.resolve({
          status: 200,
          response: [buildSocialFeedItem(), buildWatchFeedItem()],
        });
      }

      if (route.startsWith('user/get-users-to-subscribe/')) {
        return Promise.resolve({
          status: 200,
          response: { data: [] },
        });
      }

      return Promise.resolve({
        status: 200,
        response: [],
      });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    global.requestAnimationFrame = originalRequestAnimationFrame;
    global.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  it('passes the shared image opener to Home feed social cards and mounts the viewer', async () => {
    let renderer: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        <Home
          navigation={
            {
              setParams: jest.fn(),
              navigate: jest.fn(),
              push: jest.fn(),
              dispatch: jest.fn(),
            } as any
          }
          route={
            {
              key: 'home-route',
              name: 'Home',
              params: { selectedTab: FeedTypes.ForYou },
            } as any
          }
        />
      );

      await Promise.resolve();
      await Promise.resolve();
    });

    const socialCard = mockSocialItemProps.find(
      (props) => props.itemData?.postId === 'social-post-1'
    );
    const watchCard = mockSocialItemProps.find(
      (props) => props.itemData?.postId === 'watch-post-1'
    );

    expect(socialCard).toBeTruthy();
    expect(watchCard).toBeTruthy();
    expect(socialCard.onOpenImages).toBe(mockOpenImages);
    expect(watchCard.onOpenImages).toBe(mockOpenImages);
    expect(watchCard.postType).toBe(PostType.watch);
    expect(renderer!.root.findByProps({ testID: 'home-image-viewer' })).toBeTruthy();
  });

  it('keeps replayed For You rows distinct by feedInstanceId and suppresses the caught-up footer', async () => {
    mockApiCall.mockImplementation(({ route }: { route: string }) => {
      if (route.startsWith('user/get-following-feed/foryou/1')) {
        return Promise.resolve({
          status: 200,
          response: [buildSocialFeedItem('social-post-1')],
        });
      }

      if (route.startsWith('user/get-following-feed/foryou/2')) {
        return Promise.resolve({
          status: 200,
          response: [
            buildSocialFeedItem('social-post-1', {
              feedInstanceId: 'for-you-replay:20:social-post-1',
            }),
          ],
        });
      }

      if (route.startsWith('user/get-following-feed/foryou/3')) {
        return Promise.resolve({
          status: 200,
          response: [],
        });
      }

      if (route.startsWith('user/get-users-to-subscribe/')) {
        return Promise.resolve({
          status: 200,
          response: { data: [] },
        });
      }

      return Promise.resolve({
        status: 200,
        response: [],
      });
    });

    let renderer: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        <Home
          navigation={
            {
              setParams: jest.fn(),
              navigate: jest.fn(),
              push: jest.fn(),
              dispatch: jest.fn(),
            } as any
          }
          route={
            {
              key: 'home-route',
              name: 'Home',
              params: { selectedTab: FeedTypes.ForYou },
            } as any
          }
        />
      );

      await Promise.resolve();
      await Promise.resolve();
    });

    const getFeedList = () =>
      renderer!.root.find(
        (node) =>
          typeof node.props?.onEndReached === 'function' &&
          typeof node.props?.data !== 'undefined' &&
          Array.isArray(node.props.data)
      );

    await act(async () => {
      getFeedList().props.onScrollBeginDrag();
      getFeedList().props.onEndReached();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(getFeedList().props.data).toHaveLength(2);

    await act(async () => {
      getFeedList().props.onScrollBeginDrag();
      getFeedList().props.onEndReached();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(
      renderer!
        .root.findAllByType('Text')
        .some((node) => node.props.children === 'You are all caught up.')
    ).toBe(false);
  });

  it('keeps the Share a Prayer CTA visible without reserving full tab-bar space on the Pray feed', async () => {
    let renderer: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        <Home
          navigation={
            {
              setParams: jest.fn(),
              navigate: jest.fn(),
              push: jest.fn(),
              dispatch: jest.fn(),
            } as any
          }
          route={
            {
              key: 'home-route',
              name: 'Home',
              params: { selectedTab: FeedTypes.Pray },
            } as any
          }
        />
      );

      await Promise.resolve();
      await Promise.resolve();
    });

    const expectedPrayPaddingBottom = Platform.OS === 'ios' ? spacing.x32 : spacing.x48;

    expect(
      renderer!.root
        .findAllByType('Text')
        .some((node) => node.props.children === 'Share a Prayer 🙏')
    ).toBe(true);
    const sharePrayerText = renderer!.root.findByProps({ children: 'Share a Prayer 🙏' });
    expect(
      renderer!.root.find(
        (node) =>
          node.type === 'View' &&
          node.props?.style?.flex === 1 &&
          node.props?.style?.paddingBottom === expectedPrayPaddingBottom
      )
    ).toBeTruthy();
    expect(sharePrayerText.parent?.props?.style).toEqual(
      expect.objectContaining({
        bottom: 0,
        minHeight: expectedPrayPaddingBottom,
      })
    );
  });

  it('renders the Prayer subtab glass bar on the Home Pray feed and switches prayer scenes', async () => {
    let renderer: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        <Home
          navigation={
            {
              setParams: jest.fn(),
              navigate: jest.fn(),
              push: jest.fn(),
              dispatch: jest.fn(),
            } as any
          }
          route={
            {
              key: 'home-route',
              name: 'Home',
              params: { selectedTab: FeedTypes.Pray },
            } as any
          }
        />
      );

      await Promise.resolve();
      await Promise.resolve();
    });

    const glassTabBar = renderer!.root.findByType('GlassTabBar');
    expect(glassTabBar.props.tabs).toEqual([
      { key: 'Wall', label: 'Wall' },
      { key: 'Testimonies', label: 'Testimonies' },
      { key: 'Saved', label: 'Saved' },
      { key: 'MyPrayers', label: 'My Prayers' },
    ]);
    expect(renderer!.root.findByType('PrayerWallComponent')).toBeTruthy();
    expect(renderer!.root.findByProps({ testID: 'home-prayer-subtab-rail' })).toBeTruthy();
    expect(renderer!.root.findByProps({ testID: 'home-prayer-scene-container' })).toBeTruthy();

    await act(async () => {
      glassTabBar.props.onTabChange(1);
    });

    expect(renderer!.root.findByType('PrayerWallTestimoniesComponent')).toBeTruthy();

    await act(async () => {
      glassTabBar.props.onTabChange(2);
    });

    expect(renderer!.root.findByType('PrayerWallSavedPrayersComponent')).toBeTruthy();

    await act(async () => {
      glassTabBar.props.onTabChange(3);
    });

    expect(renderer!.root.findByType('PrayerWallMyPrayersComponent')).toBeTruthy();
  });

  it('hides the Home Pray subtab rail only while a prayer list is actively scrolling', async () => {
    let renderer: TestRenderer.ReactTestRenderer;
    let nowTick = 1_000;
    const dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => {
      nowTick += 250;
      return nowTick;
    });

    try {
      await act(async () => {
        renderer = TestRenderer.create(
          <Home
            navigation={
              {
                setParams: jest.fn(),
                navigate: jest.fn(),
                push: jest.fn(),
                dispatch: jest.fn(),
              } as any
            }
            route={
              {
                key: 'home-route',
                name: 'Home',
                params: { selectedTab: FeedTypes.Pray },
              } as any
            }
          />
        );

        await Promise.resolve();
        await Promise.resolve();
      });

      const wall = renderer!.root.findByType('PrayerWallComponent');

      expect(
        renderer!.root.findByProps({ testID: 'home-prayer-subtab-rail' }).props.pointerEvents
      ).toBe('auto');

      await act(async () => {
        wall.props.onUserScrollStart();
        wall.props.onScrollOffsetChange(120);
        wall.props.onScrollOffsetChange(146);
      });

      expect(
        renderer!.root.findByProps({ testID: 'home-prayer-subtab-rail' }).props.pointerEvents
      ).toBe('none');

      await act(async () => {
        wall.props.onUserScrollEnd();
      });

      expect(
        renderer!.root.findByProps({ testID: 'home-prayer-subtab-rail' }).props.pointerEvents
      ).toBe('none');

      await act(async () => {
        wall.props.onUserScrollStart();
        wall.props.onScrollOffsetChange(120);
      });

      expect(
        renderer!.root.findByProps({ testID: 'home-prayer-subtab-rail' }).props.pointerEvents
      ).toBe('auto');
    } finally {
      dateNowSpy.mockRestore();
    }
  });

  it('hides the root tab bar while the Pray feed is active', async () => {
    let renderer: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        <Home
          navigation={
            {
              setParams: jest.fn(),
              navigate: jest.fn(),
              push: jest.fn(),
              dispatch: jest.fn(),
            } as any
          }
          route={
            {
              key: 'home-route',
              name: 'Home',
              params: { selectedTab: FeedTypes.Pray },
            } as any
          }
        />
      );

      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockHideTabBar).toHaveBeenCalledWith('home');

    await act(async () => {
      renderer!.unmount();
    });
  });

  it('restores the animated root tab bar when switching away from the Pray feed', async () => {
    let renderer: TestRenderer.ReactTestRenderer;
    const navigation = {
      setParams: jest.fn(),
      navigate: jest.fn(),
      push: jest.fn(),
      dispatch: jest.fn(),
    };

    await act(async () => {
      renderer = TestRenderer.create(
        <Home
          navigation={navigation as any}
          route={
            {
              key: 'home-route',
              name: 'Home',
              params: { selectedTab: FeedTypes.Pray },
            } as any
          }
        />
      );

      await Promise.resolve();
      await Promise.resolve();
    });

    mockHideTabBar.mockClear();
    mockResetTabBar.mockClear();
    mockSetTabBarTranslateY.mockClear();

    await act(async () => {
      renderer!.update(
        <Home
          navigation={navigation as any}
          route={
            {
              key: 'home-route',
              name: 'Home',
              params: { selectedTab: FeedTypes.ForYou },
            } as any
          }
        />
      );

      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockResetTabBar).toHaveBeenCalledWith('home');
    expect(mockSetTabBarTranslateY).toHaveBeenCalledWith(expect.anything(), 'home');
  });

  it('mirrors the Pray tab into route params immediately when the user taps Pray', async () => {
    let renderer: TestRenderer.ReactTestRenderer;
    const navigation = {
      setParams: jest.fn(),
      navigate: jest.fn(),
      push: jest.fn(),
      dispatch: jest.fn(),
    };

    await act(async () => {
      renderer = TestRenderer.create(
        <Home
          navigation={navigation as any}
          route={
            {
              key: 'home-route',
              name: 'Home',
              params: { selectedTab: FeedTypes.ForYou },
            } as any
          }
        />
      );

      await Promise.resolve();
      await Promise.resolve();
    });

    const prayLabel = renderer!.root.findByProps({ children: 'Pray' });
    let prayButton: typeof prayLabel | null = prayLabel;

    while (prayButton && typeof prayButton.props?.onPress !== 'function') {
      prayButton = prayButton.parent;
    }

    expect(prayButton?.props.onPress).toEqual(expect.any(Function));

    await act(async () => {
      prayButton!.props.onPress();
    });

    expect(navigation.setParams).toHaveBeenCalledWith({ selectedTab: FeedTypes.Pray });

    await act(async () => {
      renderer!.unmount();
    });
  });
});
