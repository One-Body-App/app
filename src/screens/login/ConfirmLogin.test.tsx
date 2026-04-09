import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Text, TouchableOpacity } from 'react-native';
import ConfirmLogin from './ConfirmLogin';

const mockDispatch = jest.fn();
const mockLogoutAction = jest.fn(() => ({ type: 'LOGOUT' }));
const mockNavigationReset = jest.fn();

function mockButton({ text, onPress }: any) {
  return React.createElement(TouchableOpacity, { onPress }, React.createElement(Text, null, text));
}

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: (state: unknown) => unknown) =>
    selector({
      auth: {
        userToken: '',
        getProfileData: null,
      },
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
  },
  logout: (...args: unknown[]) => mockLogoutAction(...args),
  sendVerificationEmail: {
    Request: jest.fn((params) => ({ type: 'SEND_VERIFICATION_EMAIL_REQUEST', ...params })),
  },
}));

jest.mock('@/src/services/api', () => ({
  ApiCall: jest.fn(),
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
});
