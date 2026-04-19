import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Image, InteractionManager, Platform, Text, TouchableOpacity } from 'react-native';
import type { MfaChallengeResponse } from '@/services/login';
import { PASSKEY_ASSOCIATION_FALLBACK_MESSAGE } from '@/src/utils/passkeyErrors';
import LoginComponent from './index';

const mockDispatch = jest.fn();
const mockSetOptions = jest.fn();
const mockNavigate = jest.fn();
const mockReset = jest.fn();
const mockBeginPasskeyLogin = jest.fn();
const mockBeginPasskeyRegistration = jest.fn();
const mockSendEmailMfaCode = jest.fn();
const mockAuthenticate = jest.fn();
const mockRegister = jest.fn();
const mockFinishPasskeyLogin = jest.fn();
const mockFinishPasskeyRegistration = jest.fn();
const mockExchangeSocialToken = jest.fn();
const mockGetGoogleIdToken = jest.fn();
const mockGetAppleIdToken = jest.fn();
const mockSavePendingSocialContinuation = jest.fn();
const mockClearPendingSocialContinuation = jest.fn();

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    reset: mockReset,
    setOptions: mockSetOptions,
  }),
  useTheme: () => ({
    dark: false,
    colors: {
      background: '#ffffff',
    },
  }),
}));

jest.mock('@/src/redux/actions/GeneralActions', () => ({
  setAccountType: jest.fn((payload) => ({ type: 'SET_ACCOUNT_TYPE', payload })),
  setLoader: jest.fn((payload) => ({ type: 'SET_LOADER', payload })),
}));

jest.mock('@/src/redux/actions/AuthActions', () => ({
  getProfile: {
    Request: jest.fn((payload) => ({ type: 'GET_PROFILE_REQUEST', payload })),
    Success: jest.fn((payload) => ({ type: 'GET_PROFILE_SUCCESS', payload })),
  },
  setLoginData: jest.fn((payload) => ({ type: 'SET_LOGIN_DATA', payload })),
}));

jest.mock('@/services/login', () => ({
  beginPasskeyLogin: (params?: unknown) => mockBeginPasskeyLogin(params),
  beginPasskeyRegistration: (params?: unknown) => mockBeginPasskeyRegistration(params),
  beginTotpSetup: jest.fn(),
  finishPasskeyLogin: (params?: unknown) => mockFinishPasskeyLogin(params),
  finishPasskeyRegistration: (params?: unknown) => mockFinishPasskeyRegistration(params),
  loginWithEmailAndPassword: jest.fn(),
  sendEmailMfaCode: (params?: unknown) => mockSendEmailMfaCode(params),
  verifyBackupCode: jest.fn(),
  verifyEmailMfaCode: jest.fn(),
  verifyTotpCode: jest.fn(),
  verifyTotpSetup: jest.fn(),
}));

jest.mock('@/services/socialAuth', () => ({
  ensureGoogleSigninConfigured: jest.fn(),
  exchangeSocialToken: (...args: unknown[]) => mockExchangeSocialToken(...args),
  getAppleIdToken: (...args: unknown[]) => mockGetAppleIdToken(...args),
  getGoogleIdToken: (...args: unknown[]) => mockGetGoogleIdToken(...args),
}));

jest.mock('@/src/services/pendingSocialContinuation', () => ({
  clearPendingSocialContinuation: (...args: unknown[]) =>
    mockClearPendingSocialContinuation(...args),
  savePendingSocialContinuation: (...args: unknown[]) => mockSavePendingSocialContinuation(...args),
}));

jest.mock('@/src/services/accountTypeStorage', () => ({
  clearPendingAccountType: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-passkey', () => ({
  Passkey: {
    authenticate: (request?: unknown) => mockAuthenticate(request),
    register: (request?: unknown) => mockRegister(request),
    isSupported: jest.fn(() => true),
  },
}));

jest.mock('../styled/Text', () => {
  const mockReact = jest.requireActual('react');
  const mockReactNative = jest.requireActual('react-native');
  return function MockStyledText({ children, ...props }: any) {
    return mockReact.createElement(mockReactNative.Text, props, children);
  };
});

jest.mock('../styled/TextInput', () => {
  const mockReact = jest.requireActual('react');
  const mockReactNative = jest.requireActual('react-native');
  return function MockStyledTextInput(props: any) {
    return mockReact.createElement(mockReactNative.TextInput, props);
  };
});

jest.mock('../CustomClipboard', () => {
  const mockReact = jest.requireActual('react');
  return mockReact.forwardRef(() => null);
});

jest.mock('lottie-react-native', () => {
  const mockReact = jest.requireActual('react');
  const mockReactNative = jest.requireActual('react-native');
  return function MockLottieView(props: any) {
    return mockReact.createElement(mockReactNative.View, props);
  };
});

jest.mock('react-native-qrcode-svg', () => {
  const mockReact = jest.requireActual('react');
  const mockReactNative = jest.requireActual('react-native');
  return function MockQrCode(props: any) {
    return mockReact.createElement(mockReactNative.View, props);
  };
});

jest.mock('@react-native-vector-icons/ionicons', () => {
  const mockReact = jest.requireActual('react');
  const mockReactNative = jest.requireActual('react-native');
  return function MockIonicons({ name }: any) {
    return mockReact.createElement(mockReactNative.Text, null, name);
  };
});

const challengeBase: MfaChallengeResponse = {
  mfaRequired: true,
  enrollmentRequired: false,
  mfaToken: 'mfa-token',
  preferredMethod: 'passkey',
  availableMethods: ['passkey', 'email'],
  emailMasked: 'p***@example.com',
  reason: 'mandatory_mfa',
};

const originalPlatformOs = Platform.OS;
let runAfterInteractionsSpy: jest.SpyInstance | undefined;
const mountedRenderers: TestRenderer.ReactTestRenderer[] = [];

const associationError = new Error(
  "RequestFailed: The operation couldn't be completed. Unable to verify webcredentials association of 9N63S64RJ2.com.onebodyapp with domain app.onebodyapp.com. Please try again in a few seconds. (code: 1004, domain: com.apple.AuthenticationServices.AuthorizationError)"
);

const flushPromises = async (cycles = 6) => {
  if (cycles <= 0) {
    return;
  }

  await act(async () => {
    await Promise.resolve();
  });

  await flushPromises(cycles - 1);
};

const flattenText = (children: React.ReactNode): string => {
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map((child) => flattenText(child)).join('');
  }

  return '';
};

const getRenderedText = (renderer: TestRenderer.ReactTestRenderer) =>
  renderer.root
    .findAllByType(Text)
    .map((node) => flattenText(node.props.children))
    .join(' ');

const findTouchableByLabel = (renderer: TestRenderer.ReactTestRenderer, label: string) => {
  return renderer.root.findAllByType(TouchableOpacity).find((node) => {
    const text = node
      .findAllByType(Text)
      .map((textNode) => flattenText(textNode.props.children))
      .join(' ');
    return text.includes(label);
  });
};

describe('LoginComponent passkey fallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    runAfterInteractionsSpy?.mockRestore();
    runAfterInteractionsSpy = jest
      .spyOn(InteractionManager, 'runAfterInteractions')
      .mockImplementation((work: any) => {
        work?.();
        return { cancel: jest.fn() } as any;
      });
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'ios',
    });
    mockBeginPasskeyLogin.mockResolvedValue({
      status: 200,
      response: {
        challenge: 'YWJjZA',
        allowCredentials: [],
      },
    });
    mockBeginPasskeyRegistration.mockResolvedValue({
      status: 200,
      response: {
        challenge: 'YWJjZA',
        user: { id: 'ZGV2aWNlLXVzZXI' },
        excludeCredentials: [],
      },
    });
    mockAuthenticate.mockRejectedValue(associationError);
    mockRegister.mockRejectedValue(associationError);
    mockFinishPasskeyLogin.mockReset();
    mockFinishPasskeyRegistration.mockReset();
    mockSendEmailMfaCode.mockResolvedValue({
      status: 200,
      response: { sent: true },
    });
    mockGetGoogleIdToken.mockResolvedValue({
      idToken: 'google-id-token',
      details: {
        email: 'person@example.com',
        displayName: 'Person Example',
      },
    });
    mockGetAppleIdToken.mockResolvedValue({
      idToken: 'apple-id-token',
      nonce: 'apple-nonce',
      details: {
        email: 'person@example.com',
        displayName: 'Person Example',
      },
    });
  });

  afterEach(() => {
    act(() => {
      while (mountedRenderers.length > 0) {
        mountedRenderers.pop()?.unmount();
      }
    });
    runAfterInteractionsSpy?.mockRestore();
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: originalPlatformOs,
    });
  });

  it('falls back to email when iOS passkey association fails during login MFA', async () => {
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <LoginComponent currentUserEmail="person@example.com" initialMfaChallenge={challengeBase} />
      );
    });
    mountedRenderers.push(renderer!);

    await flushPromises();

    expect(mockBeginPasskeyLogin).toHaveBeenCalledTimes(1);
    expect(mockSendEmailMfaCode).toHaveBeenCalledWith({ mfaToken: 'mfa-token' });

    const renderedText = getRenderedText(renderer!);
    expect(renderedText).toContain(PASSKEY_ASSOCIATION_FALLBACK_MESSAGE);
    expect(renderedText).not.toContain('Unable to verify webcredentials association');
    expect(renderedText).not.toContain('Verify with Passkey');

    const passkeyButton = findTouchableByLabel(renderer!, 'Passkey');
    expect(passkeyButton?.props.disabled).toBe(true);

    await act(async () => {
      passkeyButton?.props.onPress?.();
    });
    await flushPromises(2);

    expect(mockBeginPasskeyLogin).toHaveBeenCalledTimes(1);
  }, 15000);

  it('auto-starts passkey enrollment without requiring a manual tap', async () => {
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <LoginComponent
          currentUserEmail="person@example.com"
          initialMfaChallenge={{
            ...challengeBase,
            enrollmentRequired: true,
          }}
        />
      );
    });
    mountedRenderers.push(renderer!);

    await flushPromises();

    expect(mockBeginPasskeyRegistration).toHaveBeenCalledTimes(1);
    expect(mockSendEmailMfaCode).not.toHaveBeenCalled();
  });

  it('runs passkey enrollment only once per challenge token on Android rerenders', async () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'android',
    });
    mockRegister.mockRejectedValue(new Error('NotAllowedError: User canceled'));

    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <LoginComponent
          currentUserEmail="person@example.com"
          initialMfaChallenge={{
            ...challengeBase,
            enrollmentRequired: true,
          }}
        />
      );
    });
    mountedRenderers.push(renderer!);

    await flushPromises();

    act(() => {
      renderer!.update(
        <LoginComponent
          currentUserEmail="person@example.com"
          initialMfaChallenge={{
            ...challengeBase,
            enrollmentRequired: true,
          }}
        />
      );
    });

    await flushPromises();

    expect(mockBeginPasskeyRegistration).toHaveBeenCalledTimes(1);
    expect(InteractionManager.runAfterInteractions).not.toHaveBeenCalled();
  });

  it('dispatches immediate profile loading after Android passkey enrollment succeeds', async () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'android',
    });
    mockRegister.mockResolvedValue({
      id: 'credential-id',
      rawId: 'credential-raw-id',
      type: 'public-key',
      response: {
        clientDataJSON: 'client-data',
        attestationObject: 'attestation-object',
      },
    });
    mockFinishPasskeyRegistration.mockResolvedValue({
      status: 200,
      response: {
        tokens: {
          accessToken: 'passkey-access-token',
        },
      },
    });

    act(() => {
      mountedRenderers.push(
        TestRenderer.create(
          <LoginComponent
            currentUserEmail="person@example.com"
            initialMfaChallenge={{
              ...challengeBase,
              enrollmentRequired: true,
            }}
          />
        )
      );
    });

    await flushPromises();

    expect(mockBeginPasskeyRegistration).toHaveBeenCalledTimes(1);
    expect(mockFinishPasskeyRegistration).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_LOGIN_DATA',
      payload: {
        token: 'passkey-access-token',
        resetProfile: true,
      },
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'GET_PROFILE_REQUEST',
      payload: {
        token: 'passkey-access-token',
      },
    });
    expect(mockReset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'MainRoot' }],
    });
  });

  it('routes new social users to account type selection instead of auto-creating an account', async () => {
    mockExchangeSocialToken.mockResolvedValue({
      status: 200,
      response: {
        signupRequired: true,
        provider: 'google',
        details: {
          email: 'person@example.com',
          displayName: 'Person Example',
        },
      },
    });

    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(<LoginComponent currentUserEmail="person@example.com" />);
    });
    mountedRenderers.push(renderer!);

    const googleButton = renderer!.root.findAllByType(TouchableOpacity).find((node) => {
      return node.findAllByType(Image).length > 0;
    });

    expect(googleButton).toBeTruthy();

    await act(async () => {
      await googleButton?.props.onPress?.();
    });
    await flushPromises();

    expect(mockExchangeSocialToken).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'google',
        intent: 'login',
        createIfMissing: false,
      })
    );
    expect(mockSavePendingSocialContinuation).toHaveBeenCalledWith({
      intent: 'login',
      provider: 'google',
      idToken: 'google-id-token',
      nonce: undefined,
      details: {
        email: 'person@example.com',
        displayName: 'Person Example',
      },
    });
    expect(mockNavigate).toHaveBeenCalledWith('AccountType', {
      continuePendingSocialSignup: true,
    });
  });

  it('signs social users in directly without routing through the MFA screen', async () => {
    mockExchangeSocialToken.mockResolvedValue({
      status: 200,
      response: {
        tokens: {
          accessToken: 'social-access-token',
        },
        authMethod: 'social',
        bypassMandatoryMfaOnboarding: true,
      },
    });

    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(<LoginComponent currentUserEmail="person@example.com" />);
    });
    mountedRenderers.push(renderer!);

    const appleButton = renderer!.root.findAllByType(TouchableOpacity).find((node) => {
      return node.props.accessibilityLabel === 'Continue with Apple';
    });

    expect(appleButton).toBeTruthy();

    await act(async () => {
      await appleButton?.props.onPress?.();
    });
    await flushPromises();

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SET_LOGIN_DATA',
        payload: expect.objectContaining({
          token: 'social-access-token',
          authMethod: 'social',
          bypassMandatoryMfaOnboarding: true,
        }),
      })
    );
    expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'MainRoot' }] });
  });
});
