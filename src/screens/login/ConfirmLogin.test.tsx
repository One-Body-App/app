import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Text, Pressable, TextInput } from 'react-native';
import ConfirmLogin from './ConfirmLogin';

const mockReact = React;
const mockDispatch = jest.fn();
const mockApiCall: jest.Mock<Promise<any>, [unknown?]> = jest.fn();
const mockAttemptEmailAddressVerification = jest.fn();
const mockPrepareEmailAddressVerification = jest.fn();
const mockSignUpUpdate = jest.fn();
const mockSetActive = jest.fn();
const mockGetValidAccessToken = jest.fn();
const mockSyncClerkUserProfile = jest.fn();
const mockNavigationReset = jest.fn();
const mockToastShow = jest.fn();
const mockNativeText = Text;
const mockSignUpState = {
  status: undefined as string | undefined,
  createdSessionId: undefined as string | undefined,
};
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

jest.mock('@clerk/expo/legacy', () => ({
  useSignUp: () => ({
    isLoaded: true,
    signUp: {
      get status() {
        return mockSignUpState.status;
      },
      get createdSessionId() {
        return mockSignUpState.createdSessionId;
      },
      attemptEmailAddressVerification: mockAttemptEmailAddressVerification,
      prepareEmailAddressVerification: mockPrepareEmailAddressVerification,
      update: mockSignUpUpdate,
    },
    setActive: mockSetActive,
  }),
}));

jest.mock('react-native-simple-toast', () => ({
  __esModule: true,
  default: {
    LONG: 1,
    show: (...args: unknown[]) => mockToastShow(...args),
  },
}));

jest.mock('@/src/redux/actions/AuthActions', () => ({
  getProfile: {
    Request: jest.fn((params) => ({ type: 'GET_PROFILE_REQUEST', ...params })),
    Success: jest.fn((payload) => ({ type: 'GET_PROFILE_SUCCESS', payload })),
  },
  sendVerificationEmail: {
    Request: jest.fn((params) => ({ type: 'SEND_VERIFICATION_EMAIL_REQUEST', ...params })),
  },
  setLoginData: jest.fn((payload) => ({ type: 'SET_LOGIN_DATA', payload })),
}));

jest.mock('@/src/services/api', () => ({
  ApiCall: (params?: unknown) => mockApiCall(params),
}));

jest.mock('@/src/services/authTokens', () => ({
  getValidAccessToken: () => mockGetValidAccessToken(),
}));

jest.mock('@/src/services/clerkSync', () => ({
  syncClerkUserProfile: (params?: unknown) => mockSyncClerkUserProfile(params),
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
      navigation={{ reset: mockNavigationReset } as any}
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
    mockSignUpState.status = undefined;
    mockSignUpState.createdSessionId = undefined;
    mockAttemptEmailAddressVerification.mockResolvedValue({
      status: 'complete',
      createdSessionId: 'sess_123',
    });
    mockPrepareEmailAddressVerification.mockResolvedValue({});
    mockSignUpUpdate.mockResolvedValue({
      status: 'complete',
      createdSessionId: 'sess_updated',
    });
    mockSetActive.mockResolvedValue({});
    mockSyncClerkUserProfile.mockResolvedValue({
      status: 200,
      response: { user: { _id: 'user_123' } },
    });
    mockGetValidAccessToken.mockResolvedValue('clerk-token');
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

  it('refreshes the profile when the user confirms they already verified', async () => {
    mockAuthState.userToken = 'access-token';

    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = renderScreen();
    });

    const alreadyVerifiedButton = renderer!.root
      .findAllByType(mockButton)
      .find((node) => node.props.text === 'I already verified');

    expect(alreadyVerifiedButton).toBeTruthy();

    await act(async () => {
      await alreadyVerifiedButton!.props.onPress();
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

    expect(readAllText(renderer!)).toContain('Verifying your email');

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

  it('verifies a Clerk signup code, syncs Mongo, and activates the app session', async () => {
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = renderScreen({
        mode: 'clerk-signup-code',
        prefillEmail: 'person@example.com',
        signupName: 'Person Example',
        signupUsername: 'person.test',
        accountType: 'individual',
      });
    });

    const codeInput = renderer!.root.findByType(TextInput);
    act(() => {
      codeInput.props.onChangeText('123456');
    });

    const verifyButton = renderer!.root
      .findAllByType(mockButton)
      .find((node) => node.props.text === 'Verify code');

    await act(async () => {
      await verifyButton!.props.onPress();
    });

    expect(mockAttemptEmailAddressVerification).toHaveBeenCalledWith({ code: '123456' });
    expect(mockSetActive).toHaveBeenCalledWith(
      expect.objectContaining({
        session: 'sess_123',
        navigate: expect.any(Function),
      })
    );
    expect(mockSyncClerkUserProfile).toHaveBeenCalledWith({
      email: 'person@example.com',
      name: 'Person Example',
      username: 'person.test',
      accountType: 'individual',
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_LOGIN_DATA',
      payload: expect.objectContaining({
        token: 'clerk-token',
        authMethod: 'password',
      }),
    });
    expect(mockNavigationReset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'MainRoot' }],
    });

    act(() => {
      renderer!.unmount();
    });
  });

  it('completes an already-complete Clerk signup session without resubmitting the code', async () => {
    mockSignUpState.status = 'complete';
    mockSignUpState.createdSessionId = 'sess_existing';

    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = renderScreen({
        mode: 'clerk-signup-code',
        prefillEmail: 'person@example.com',
      });
    });

    const verifyButton = renderer!.root
      .findAllByType(mockButton)
      .find((node) => node.props.text === 'Verify code');

    await act(async () => {
      await verifyButton!.props.onPress();
    });

    expect(mockAttemptEmailAddressVerification).not.toHaveBeenCalled();
    expect(mockSetActive).toHaveBeenCalledWith(
      expect.objectContaining({
        session: 'sess_existing',
        navigate: expect.any(Function),
      })
    );
    expect(mockNavigationReset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'MainRoot' }],
    });

    act(() => {
      renderer!.unmount();
    });
  });

  it('recovers from Clerk already-verified errors when the signup session exists', async () => {
    mockSignUpState.createdSessionId = 'sess_existing';
    mockAttemptEmailAddressVerification.mockRejectedValue({
      errors: [{ message: 'This verification has already been verified.' }],
    });

    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = renderScreen({
        mode: 'clerk-signup-code',
        prefillEmail: 'person@example.com',
      });
    });

    const codeInput = renderer!.root.findByType(TextInput);
    act(() => {
      codeInput.props.onChangeText('123456');
    });

    const verifyButton = renderer!.root
      .findAllByType(mockButton)
      .find((node) => node.props.text === 'Verify code');

    await act(async () => {
      await verifyButton!.props.onPress();
    });

    expect(mockSetActive).toHaveBeenCalledWith(
      expect.objectContaining({
        session: 'sess_existing',
        navigate: expect.any(Function),
      })
    );
    expect(readAllText(renderer!)).not.toContain('This verification has already been verified.');
    expect(mockNavigationReset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'MainRoot' }],
    });

    act(() => {
      renderer!.unmount();
    });
  });

  it('patches Clerk missing signup requirements and activates the completed session', async () => {
    mockAttemptEmailAddressVerification.mockResolvedValue({
      status: 'missing_requirements',
      missingFields: ['first_name', 'last_name', 'username', 'legal_accepted'],
    });
    mockSignUpUpdate.mockResolvedValue({
      status: 'complete',
      createdSessionId: 'sess_patched',
    });

    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = renderScreen({
        mode: 'clerk-signup-code',
        prefillEmail: 'person@example.com',
        signupFirstName: 'Person',
        signupLastName: 'Example',
        signupName: 'Person Example',
        signupUsername: 'person.test',
        accountType: 'individual',
      });
    });

    const codeInput = renderer!.root.findByType(TextInput);
    act(() => {
      codeInput.props.onChangeText('123456');
    });

    const verifyButton = renderer!.root
      .findAllByType(mockButton)
      .find((node) => node.props.text === 'Verify code');

    await act(async () => {
      await verifyButton!.props.onPress();
    });

    expect(mockSignUpUpdate).toHaveBeenCalledWith({
      firstName: 'Person',
      lastName: 'Example',
      username: 'person_test',
      legalAccepted: true,
    });
    expect(mockSetActive).toHaveBeenCalledWith(
      expect.objectContaining({
        session: 'sess_patched',
        navigate: expect.any(Function),
      })
    );
    expect(mockNavigationReset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'MainRoot' }],
    });

    act(() => {
      renderer!.unmount();
    });
  });

  it('shows a clear missing-fields message when Clerk requirements cannot be patched', async () => {
    mockAttemptEmailAddressVerification.mockResolvedValue({
      status: 'missing_requirements',
      missingFields: ['first_name', 'last_name'],
    });

    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = renderScreen({
        mode: 'clerk-signup-code',
        prefillEmail: 'person@example.com',
      });
    });

    const codeInput = renderer!.root.findByType(TextInput);
    act(() => {
      codeInput.props.onChangeText('123456');
    });

    const verifyButton = renderer!.root
      .findAllByType(mockButton)
      .find((node) => node.props.text === 'Verify code');

    await act(async () => {
      await verifyButton!.props.onPress();
    });

    expect(mockSignUpUpdate).not.toHaveBeenCalled();
    expect(mockSetActive).not.toHaveBeenCalled();
    expect(readAllText(renderer!)).toContain('Clerk needs first name, last name');

    act(() => {
      renderer!.unmount();
    });
  });

  it('routes to login when Clerk says the verification is already complete without a session', async () => {
    mockAttemptEmailAddressVerification.mockRejectedValue({
      errors: [{ code: 'verification_already_verified' }],
    });

    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = renderScreen({
        mode: 'clerk-signup-code',
        prefillEmail: 'Person@Example.com ',
      });
    });

    const codeInput = renderer!.root.findByType(TextInput);
    act(() => {
      codeInput.props.onChangeText('123456');
    });

    const verifyButton = renderer!.root
      .findAllByType(mockButton)
      .find((node) => node.props.text === 'Verify code');

    await act(async () => {
      await verifyButton!.props.onPress();
    });

    expect(mockSetActive).not.toHaveBeenCalled();
    expect(mockToastShow).toHaveBeenCalledWith(
      'Your email is already verified. Sign in to continue.',
      1
    );
    expect(mockNavigationReset).toHaveBeenCalledWith({
      index: 0,
      routes: [
        {
          name: 'Login',
          params: { prefillEmail: 'person@example.com' },
        },
      ],
    });

    act(() => {
      renderer!.unmount();
    });
  });

  it('resends a Clerk signup verification code without using the legacy endpoint', async () => {
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = renderScreen({
        mode: 'clerk-signup-code',
        prefillEmail: 'person@example.com',
      });
    });

    const resendButton = renderer!.root
      .findAllByType(mockButton)
      .find((node) => node.props.text === 'Resend code');

    await act(async () => {
      await resendButton!.props.onPress();
    });

    expect(mockPrepareEmailAddressVerification).toHaveBeenCalledWith({
      strategy: 'email_code',
    });
    expect(mockApiCall).not.toHaveBeenCalled();

    act(() => {
      renderer!.unmount();
    });
  });
});
