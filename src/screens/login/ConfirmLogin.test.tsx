import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Text, Pressable } from 'react-native';
import ConfirmLogin from './ConfirmLogin';

const mockReact = React;
const mockDispatch = jest.fn();
const mockApiCall: jest.Mock<Promise<any>, [unknown?]> = jest.fn();
const mockNativeText = Text;
const mockAuthState = {
  userToken: '',
  verifyEmailTokenPending: false,
  verifyEmailTokenError: null as string | null,
};
const mockGeneralState = {
  accountType: null as string | null,
};

function mockButton({ text, onPress }: any) {
  return React.createElement(Pressable, { onPress }, React.createElement(Text, null, text));
}

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: (state: unknown) => unknown) =>
    selector({
      auth: mockAuthState,
      general: mockGeneralState,
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
  sendVerificationEmail: {
    Request: jest.fn((params) => ({ type: 'SEND_VERIFICATION_EMAIL_REQUEST', ...params })),
  },
}));

jest.mock('@/src/services/api', () => ({
  ApiCall: (params?: unknown) => mockApiCall(params),
}));

jest.mock('@/src/services/notification/pushNotificationService', () => ({
  ensurePushPermission: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('../layout/UserStepsLayout', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => children,
}));

jest.mock('@/components/styled/Text', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) =>
    mockReact.createElement(mockNativeText, props, children),
}));
jest.mock('@/components/Button', () => ({
  __esModule: true,
  default: mockButton,
}));

const renderScreen = (params: Record<string, any> = {}) =>
  TestRenderer.create(
    <ConfirmLogin
      route={{ key: 'ConfirmLogin', name: 'ConfirmLogin', params } as any}
      navigation={{} as any}
    />
  );

const readAllText = (renderer: TestRenderer.ReactTestRenderer) =>
  renderer.root
    .findAllByType(Text)
    .map((node) => node.props.children)
    .flat()
    .filter((value) => typeof value === 'string')
    .join(' ');

describe('ConfirmLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState.userToken = '';
    mockAuthState.verifyEmailTokenPending = false;
    mockAuthState.verifyEmailTokenError = null;
    mockGeneralState.accountType = null;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('dispatches the authenticated resend verification action when a token is present', () => {
    jest.useFakeTimers();
    mockAuthState.userToken = 'access-token';

    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = renderScreen();
    });

    const resendButton = renderer!.root
      .findAllByType(mockButton)
      .find((node) => node.props.text === 'Resend verification email');

    expect(resendButton).toBeTruthy();

    act(() => {
      resendButton!.props.onPress();
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SEND_VERIFICATION_EMAIL_REQUEST',
      token: true,
      data: {},
      allowFalseSuccess: true,
    });
    expect(mockApiCall).not.toHaveBeenCalled();

    act(() => {
      jest.runOnlyPendingTimers();
      renderer!.unmount();
    });
  });

  it('uses the public resend verification endpoint when no token is present', async () => {
    jest.useFakeTimers();
    mockApiCall.mockResolvedValue({ status: 200, response: true });

    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = renderScreen({ prefillEmail: 'Person@Example.com ' });
    });

    const resendButton = renderer!.root
      .findAllByType(mockButton)
      .find((node) => node.props.text === 'Resend verification email');

    await act(async () => {
      await resendButton!.props.onPress();
    });

    expect(mockApiCall).toHaveBeenCalledWith({
      route: 'auth/sendVerificationEmail/public',
      verb: 'post',
      params: { email: 'person@example.com' },
    });

    act(() => {
      jest.runOnlyPendingTimers();
      renderer!.unmount();
    });
  });

  it('refreshes the profile when the user confirms they already verified', () => {
    mockAuthState.userToken = 'access-token';

    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = renderScreen();
    });

    const alreadyVerifiedButton = renderer!.root
      .findAllByType(mockButton)
      .find((node) => node.props.text === 'I already verified');

    expect(alreadyVerifiedButton).toBeTruthy();

    act(() => {
      alreadyVerifiedButton!.props.onPress();
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'GET_PROFILE_REQUEST',
      token: 'access-token',
    });

    act(() => {
      renderer!.unmount();
    });
  });

  it('renders the redux-driven verifying banner', () => {
    mockAuthState.verifyEmailTokenPending = true;

    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = renderScreen({ prefillEmail: 'person@example.com' });
    });

    expect(readAllText(renderer!)).toContain('Verifying your email...');

    act(() => {
      renderer!.unmount();
    });
  });

  it('renders the redux-driven verification error', () => {
    mockAuthState.verifyEmailTokenError = 'Token expired';

    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = renderScreen({ prefillEmail: 'person@example.com' });
    });

    expect(readAllText(renderer!)).toContain('Token expired');

    act(() => {
      renderer!.unmount();
    });
  });
});
