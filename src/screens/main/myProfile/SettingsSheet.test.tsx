import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Text, TouchableOpacity, View } from 'react-native';
import SettingsSheet from './SettingsSheet';

const mockDispatch = jest.fn();
const mockNavigate = jest.fn();
const mockLogOutAction = jest.fn(() => ({ type: 'LOGOUT' }));
const mockFacebookLogOut = jest.fn();
const mockClearAuthTokens = jest.fn();

function mockButton({ text, onPress, leftIcon }: any) {
  return React.createElement(
    TouchableOpacity,
    { onPress },
    React.createElement(View, null, leftIcon),
    React.createElement(Text, null, text)
  );
}

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
  useTheme: () => ({
    colors: {
      background: '#ffffff',
    },
  }),
}));

jest.mock('react-native-fast-image', () => 'FastImage');
jest.mock('react-native-rate', () => ({
  __esModule: true,
  default: {
    rate: jest.fn(),
  },
  AndroidMarket: {
    Google: 'Google',
  },
}));
jest.mock('react-native-fbsdk-next', () => ({
  LoginManager: {
    logOut: (...args: []) => mockFacebookLogOut(...args),
  },
}));
jest.mock('@/services/authTokens', () => ({
  clearAuthTokens: (...args: []) => mockClearAuthTokens(...args),
}));
jest.mock('@/src/redux/actions/AuthActions', () => ({
  logout: (...args: []) => mockLogOutAction(...args),
}));
jest.mock('@/components/styled/Text', () => 'StyledText');
jest.mock('@/src/components/CustomModal', () => ({
  __esModule: true,
  default: ({ children, modalVisible }: { children?: React.ReactNode; modalVisible: boolean }) =>
    modalVisible ? children : null,
}));
jest.mock('@/components/Button', () => ({
  __esModule: true,
  default: mockButton,
}));
jest.mock('@/services/constants', () => ({
  NO_PROFILE_IMAGE: 'https://cdn.example.com/no-profile.png',
  OpenURLButton: jest.fn(),
}));

describe('SettingsSheet logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('dispatches the shared logout action without inline cleanup', () => {
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <SettingsSheet
          setShowModal={jest.fn()}
          showModal
          userData={
            {
              name: 'Test User',
              username: 'testuser',
              profileImage: '',
            } as any
          }
        />
      );
    });

    const logoutButton = renderer!.root
      .findAllByType(mockButton)
      .find((node) => node.props.text === 'Log out');

    expect(logoutButton).toBeTruthy();

    act(() => {
      logoutButton!.props.onPress();
    });

    expect(mockLogOutAction).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'LOGOUT' });
    expect(mockFacebookLogOut).not.toHaveBeenCalled();
    expect(mockClearAuthTokens).not.toHaveBeenCalled();
  });
});
