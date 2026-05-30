import React from 'react';
import { Text, TextInput } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import NewMessageScreen from '../newmessage';

const mockUseSelector = jest.fn();
const mockApiCall = jest.fn();

jest.mock('@react-navigation/native', () => {
  const ReactLocal = jest.requireActual('react');

  return {
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

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  })),
}));

jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => mockUseSelector(selector),
}));

jest.mock('@react-native-vector-icons/material-icons', () => 'MaterialIcons');

jest.mock('@/src/services/api', () => ({
  ApiCall: (...args: unknown[]) => mockApiCall(...args),
}));

const flushEffects = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

describe('NewMessageScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockUseSelector.mockImplementation((selector) =>
      selector({
        auth: {
          userToken: 'token-123',
        },
      })
    );
    mockApiCall.mockImplementation(({ route }: { route: string }) => {
      if (route === 'user/get-following') {
        return Promise.resolve({
          status: 200,
          response: {
            data: [
              {
                _id: 'user-2',
                name: 'Inbox Friend',
                username: 'inboxfriend',
              },
            ],
          },
        });
      }

      if (route === 'user/search') {
        return Promise.resolve({
          status: 200,
          response: {
            data: [],
          },
        });
      }

      return Promise.resolve({ status: 200, response: { data: [] } });
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('fetches connected accounts once when the screen gains focus', async () => {
    const navigation = {
      goBack: jest.fn(),
      navigate: jest.fn(),
    } as any;

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        <NewMessageScreen navigation={navigation} route={{} as any} />
      );
    });
    await flushEffects();
    await flushEffects();

    const followingCalls = mockApiCall.mock.calls.filter(
      ([request]) => request?.route === 'user/get-following'
    );

    expect(followingCalls).toHaveLength(1);
    expect(
      renderer!.root.findAllByType(Text).some((node) => node.props.children === 'Inbox Friend')
    ).toBe(true);
  });

  it('searches with the latest connected contacts without refetching the screen', async () => {
    const navigation = {
      goBack: jest.fn(),
      navigate: jest.fn(),
    } as any;

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        <NewMessageScreen navigation={navigation} route={{} as any} />
      );
    });
    await flushEffects();

    const searchInput = renderer!.root.findByType(TextInput);

    act(() => {
      searchInput.props.onChangeText('inbox');
      jest.advanceTimersByTime(300);
    });
    await flushEffects();

    const followingCalls = mockApiCall.mock.calls.filter(
      ([request]) => request?.route === 'user/get-following'
    );
    const searchCalls = mockApiCall.mock.calls.filter(
      ([request]) => request?.route === 'user/search'
    );

    expect(followingCalls).toHaveLength(1);
    expect(searchCalls).toHaveLength(1);
    expect(
      renderer!.root.findAllByType(Text).some((node) => node.props.children === 'Inbox Friend')
    ).toBe(true);
  });
});
