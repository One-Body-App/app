import React from 'react';
import { TextInput } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';

import Explore, { TRENDING_TOPICS_ROUTE } from '../index';

const mockDispatch = jest.fn();
const mockApiCall = jest.fn();

jest.mock('@react-navigation/native', () => {
  const ReactLocal = jest.requireActual('react');

  return {
    DrawerActions: {
      toggleDrawer: jest.fn(() => ({ type: 'TOGGLE_DRAWER' })),
    },
    useFocusEffect: jest.fn((callback) => {
      ReactLocal.useEffect(() => callback(), [callback]);
    }),
    useTheme: jest.fn(() => ({
      dark: false,
      colors: {
        background: '#ffffff',
        border: '#d9dfe2',
        card: '#f3f6f8',
        text: '#032f3c',
      },
    })),
  };
});

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: (state: unknown) => unknown) =>
    selector({
      auth: {
        userToken: 'token-1',
        getProfileData: {
          profileImage: '',
          interests: [],
        },
      },
    }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  })),
}));

jest.mock('react-native-fast-image', () => 'FastImage');
jest.mock('react-native-video', () => 'Video');
jest.mock('@react-native-community/blur', () => ({
  BlurView: 'BlurView',
}));
jest.mock('@react-native-vector-icons/material-design-icons', () => 'MaterialCommunityIcons');
jest.mock('@/assets/icons/search.svg', () => 'SearchIcon');
jest.mock('@/assets/svg/ProfileFill.svg', () => 'ProfileFill');
jest.mock('@/components/styled/Text', () => 'StyledText');
jest.mock('@/components/listItems/SocialItem', () => 'SocialItem');
jest.mock('@/components/listItems/PrayerItem', () => 'PrayerItem');
jest.mock('@/components/listItems/ArticleItem', () => 'ArticleItem');
jest.mock('@/components/listItems/UserItem', () => 'UserItem');

jest.mock('@/src/services/api', () => ({
  ApiCall: (...args: unknown[]) => mockApiCall(...args),
}));

jest.mock('@/src/services/deviceLocation', () => jest.fn(() => Promise.resolve(null)));
jest.mock('@/src/redux/actions/UserAction', () => ({
  getUserProfile: jest.fn(() => ({ type: 'GET_USER_PROFILE' })),
}));
jest.mock('@/src/hooks/useMountEffect', () => {
  const ReactLocal = jest.requireActual('react');
  return (callback: () => void | (() => void)) => {
    ReactLocal.useEffect(() => callback(), [callback]);
  };
});
jest.mock('@/src/hooks/useSpringboardEntry', () =>
  jest.fn(() => ({ getSpringboardStyle: () => ({}) }))
);
jest.mock('@/src/navigator/motionPolicy', () => ({
  getTabRootSpringboardPreset: jest.fn(() => 'default'),
}));
jest.mock('@/src/navigator/RootTabTransitionContext', () => ({
  useRootTabSwitchReplayToken: jest.fn(() => 0),
}));

const navigation = {
  dispatch: jest.fn(),
  push: jest.fn(),
  navigate: jest.fn(),
};

const route = {
  key: 'explore-screen',
  name: 'Explore',
  params: undefined,
};

const flushEffects = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

describe('Explore trending topics', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockDispatch.mockClear();
    mockApiCall.mockReset();
    navigation.dispatch.mockClear();
    navigation.push.mockClear();
    navigation.navigate.mockClear();

    mockApiCall.mockImplementation(({ route: requestRoute }: { route: string }) => {
      if (requestRoute === TRENDING_TOPICS_ROUTE) {
        return Promise.resolve({
          status: 200,
          response: [
            { _id: 'interest-1', name: 'Prayer Requests', popularity: 18 },
            { _id: 'interest-2', name: 'Bible Study', popularity: 9 },
          ],
        });
      }

      return Promise.resolve({ status: 200, response: [] });
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('requests trending topics from the weighted API route', async () => {
    await act(async () => {
      TestRenderer.create(<Explore navigation={navigation as any} route={route as any} />);
    });

    await flushEffects();

    expect(mockApiCall).toHaveBeenCalledWith(
      expect.objectContaining({
        route: TRENDING_TOPICS_ROUTE,
        token: 'token-1',
        verb: 'get',
      })
    );
  });

  it('delays topic-driven search text updates until the pill animation finishes', async () => {
    let tree: TestRenderer.ReactTestRenderer;

    await act(async () => {
      tree = TestRenderer.create(<Explore navigation={navigation as any} route={route as any} />);
    });

    await flushEffects();

    const topicPressable = tree!.root.findByProps({
      testID: 'trending-topic-pressable-interest-1',
    });

    act(() => {
      topicPressable.props.onPressIn();
      topicPressable.props.onPress();
    });

    expect(tree!.root.findByType(TextInput).props.value).toBe('');

    act(() => {
      jest.advanceTimersByTime(180);
    });

    expect(tree!.root.findByType(TextInput).props.value).toBe('Prayer Requests');

    act(() => {
      tree!.unmount();
    });
  });

  it('updates search text immediately for typed queries', async () => {
    let tree: TestRenderer.ReactTestRenderer;

    await act(async () => {
      tree = TestRenderer.create(<Explore navigation={navigation as any} route={route as any} />);
    });

    await flushEffects();

    const textInput = tree!.root.findByType(TextInput);

    act(() => {
      textInput.props.onChangeText('community prayer');
    });

    expect(tree!.root.findByType(TextInput).props.value).toBe('community prayer');

    act(() => {
      tree!.unmount();
    });
  });
});
