import React from 'react';
import { InteractionManager } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { useDispatch, useSelector } from 'react-redux';
import UserProfile from './index';

const mockDispatch = jest.fn();
const mockApiCall = jest.fn();
const mockProfileComponent = jest.fn(() => null);
const mockShare = jest.fn();
const mockRunAfterInteractions = jest.spyOn(InteractionManager, 'runAfterInteractions');

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('@react-navigation/native', () => {
  const ReactLocal = require('react');
  return {
    useTheme: jest.fn(() => ({
      colors: {
        background: '#FFFFFF',
        text: '#111111',
      },
      dark: false,
    })),
    useFocusEffect: jest.fn((callback) => {
      ReactLocal.useEffect(() => callback(), [callback]);
    }),
  };
});

jest.mock('@/components/profile/Profile', () => (props: unknown) => mockProfileComponent(props));
jest.mock('@/components/CustomModal', () => () => null);
jest.mock('@/components/styled/Text', () => 'StyledText');
jest.mock('@/services/api', () => ({
  ApiCall: (...args: unknown[]) => mockApiCall(...args),
}));
jest.mock('react-native-simple-toast', () => ({
  LONG: 'LONG',
  show: jest.fn(),
}));
jest.mock('@react-native-vector-icons/ionicons', () => 'Ionicons');

const mockedUseDispatch = useDispatch as unknown as jest.Mock;
const mockedUseSelector = useSelector as unknown as jest.Mock;

const flushMicrotasks = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

describe('UserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseDispatch.mockReturnValue(mockDispatch);
    mockedUseSelector.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        auth: {
          userToken: 'token',
          getProfileData: {
            _id: 'viewer-1',
            following: [],
          },
        },
        general: {
          loader: false,
        },
      })
    );
    mockApiCall.mockImplementation(({ route }: { route: string }) => {
      if (route.startsWith('user/get-related-users/')) {
        return Promise.resolve({ status: 200, response: [] });
      }

      return Promise.resolve({
        status: 200,
        response: {
          _id: 'user-1',
          username: 'vinbrown',
          name: 'Vinel Brown',
          following: [],
        },
      });
    });
    let queuedCallback: (() => void) | undefined;
    mockRunAfterInteractions.mockImplementation((callback: () => void) => {
      queuedCallback = callback;
      return {
        cancel: jest.fn(),
        then: jest.fn(),
      } as any;
    });
    (mockRunAfterInteractions as any).__queuedCallback = () => queuedCallback;
  });

  afterAll(() => {
    mockRunAfterInteractions.mockRestore();
  });

  it('keeps avatar expansion disabled on initial mount, then enables it after interactions', async () => {
    const navigation = {
      goBack: jest.fn(),
      setOptions: jest.fn(),
    };
    const route = {
      key: 'UserProfile-1',
      name: 'UserProfile',
      params: { id: 'user-1' },
    };

    await act(async () => {
      TestRenderer.create(<UserProfile navigation={navigation as any} route={route as any} />);
    });

    await flushMicrotasks();

    expect(mockProfileComponent).toHaveBeenCalled();
    expect(mockProfileComponent.mock.calls.at(-1)?.[0]).toMatchObject({
      avatarExpansionEnabled: false,
      variant: 'public',
    });

    await act(async () => {
      (mockRunAfterInteractions as any).__queuedCallback()?.();
    });

    expect(mockProfileComponent.mock.calls.at(-1)?.[0]).toMatchObject({
      avatarExpansionEnabled: true,
      variant: 'public',
    });
  });

  it('resets avatar expansion when route params change before re-enabling it', async () => {
    const navigation = {
      goBack: jest.fn(),
      setOptions: jest.fn(),
    };
    const firstRoute = {
      key: 'UserProfile-1',
      name: 'UserProfile',
      params: { id: 'user-1' },
    };
    const secondRoute = {
      key: 'UserProfile-2',
      name: 'UserProfile',
      params: { handle: 'someoneelse' },
    };

    let renderer: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        <UserProfile navigation={navigation as any} route={firstRoute as any} />
      );
    });

    await flushMicrotasks();

    await act(async () => {
      (mockRunAfterInteractions as any).__queuedCallback()?.();
    });

    expect(mockProfileComponent.mock.calls.at(-1)?.[0]).toMatchObject({
      avatarExpansionEnabled: true,
    });

    await act(async () => {
      renderer!.update(<UserProfile navigation={navigation as any} route={secondRoute as any} />);
    });

    await flushMicrotasks();

    expect(mockProfileComponent.mock.calls.at(-1)?.[0]).toMatchObject({
      avatarExpansionEnabled: false,
    });

    await act(async () => {
      (mockRunAfterInteractions as any).__queuedCallback()?.();
    });

    expect(mockProfileComponent.mock.calls.at(-1)?.[0]).toMatchObject({
      avatarExpansionEnabled: true,
    });
  });
});
