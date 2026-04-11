import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Text, TouchableOpacity } from 'react-native';
import ConfirmLogin from './ConfirmLogin';

const mockDispatch = jest.fn();
const mockLogoutAction = jest.fn(() => ({ type: 'LOGOUT' }));
const mockNavigationReset = jest.fn();
const mockApiCall = jest.fn();
const mockAuthState = {
  userToken: '',
  getProfileData: null as any,
};

function mockButton({ text, onPress }: any) {
  return React.createElement(TouchableOpacity, { onPress }, React.createElement(Text, null, text));
}

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: (state: unknown) => unknown) =>
    selector({
      auth: mockAuthState,
    }),
}));

jest.mock('@react-navigation/native', () => ({
  useTheme: () => ({
    dark: false,
    colors: {
      background: '#ffffff',
    },
  }),
}));

jest.mock('@react-native-community/geolocation', () => ({
  requestAuthorization: jest.fn(),
}));

jest.mock('@/src/redux/actions/AuthActions', () => ({
  getProfile: {
    Request: jest.fn((params) => ({ type: 'GET_PROFILE_REQUEST', ...params })),
    Success: jest.fn((payload) => ({ type: 'GET_PROFILE_SUCCESS', payload })),
  },
  logout: (...args: unknown[]) => mockLogoutAction(...args),
  sendVerificationEmail: {
    Request: jest.fn((params) => ({ type: 'SEND_VERIFICATION_EMAIL_REQUEST', ...params })),
  },
}));

jest.mock('@/src/services/api', () => ({
  ApiCall: (...args: unknown[]) => mockApiCall(...args),
}));

jest.mock('@/src/services/notification/pushNotificationService', () => ({
  ensurePushPermission: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('../layout/UserStepsLayout', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => children,
}));

jest.mock('@/components/styled/Text', () => 'StyledText');
jest.mock('@/components/Button', () => ({
  __esModule: true,
  default: mockButton,
}));

describe('ConfirmLogin logout action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState.userToken = '';
    mockAuthState.getProfileData = null;
  });

  it('dispatches the shared logout action without resetting navigation inline', () => {
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <ConfirmLogin
          route={{ key: 'ConfirmLogin', name: 'ConfirmLogin', params: {} } as any}
          navigation={{ reset: mockNavigationReset } as any}
        />
      );
    });

    const signOutButton = renderer!.root
      .findAllByType(mockButton)
      .find((node) => node.props.text === 'Back to sign in');

    expect(signOutButton).toBeTruthy();

    act(() => {
      signOutButton!.props.onPress();
    });

    expect(mockLogoutAction).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'LOGOUT' });
    expect(mockNavigationReset).not.toHaveBeenCalled();
  });

  it('optimistically marks email verified after a successful deep link verification', async () => {
    mockAuthState.userToken = 'access-token';
    mockAuthState.getProfileData = {
      _id: 'user-1',
      email: 'person@example.com',
      emailVerified: false,
      isProfileCompleted: false,
    };
    mockApiCall.mockResolvedValue({ status: 200, response: true });

    await act(async () => {
      TestRenderer.create(
        <ConfirmLogin
          route={
            {
              key: 'ConfirmLogin',
              name: 'ConfirmLogin',
              params: { token: 'verify-token', prefillEmail: 'person@example.com' },
            } as any
          }
          navigation={{ reset: mockNavigationReset } as any}
        />
      );
      await Promise.resolve();
    });

    expect(mockApiCall).toHaveBeenCalledWith({
      route: 'auth/verify-email',
      verb: 'post',
      params: { token: 'verify-token' },
    });
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'GET_PROFILE_SUCCESS',
        payload: expect.objectContaining({
          emailVerified: true,
          email: 'person@example.com',
        }),
      })
    );
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'GET_PROFILE_REQUEST',
      token: 'access-token',
    });
  });
});
