import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Image, InteractionManager, Platform, Text, TextInput, Pressable } from 'react-native';
import type { MfaChallengeResponse } from '@/services/login';
import { PASSKEY_ASSOCIATION_FALLBACK_MESSAGE } from '@/src/utils/passkeyErrors';
import LoginComponent from './index';

const mockDispatch = jest.fn();
const mockSetOptions = jest.fn();
const mockNavigate = jest.fn();
const mockReset = jest.fn();
const mockBeginPasskeyLogin = jest.fn();
const mockBeginPasskeyRegistration = jest.fn();
const mockBeginAuthenticatedMfaLogin = jest.fn();
const mockSendEmailMfaCode = jest.fn();
const mockAuthenticate = jest.fn();
const mockRegister = jest.fn();
const mockFinishPasskeyLogin = jest.fn();
const mockFinishPasskeyRegistration = jest.fn();
const mockMigrateLegacyPasswordToClerk = jest.fn();
const mockExchangeSocialToken = jest.fn();
const mockGetGoogleIdToken = jest.fn();
const mockGetAppleIdToken = jest.fn();
const mockSavePendingSocialContinuation = jest.fn();
const mockClearPendingSocialContinuation = jest.fn();
const mockStartSSOFlow = jest.fn();
const mockActivateSsoSession = jest.fn();
const mockSignInCreate = jest.fn();
const mockPrepareSecondFactor = jest.fn();
const mockAttemptSecondFactor = jest.fn();
const mockSetActive = jest.fn();
const mockGetValidAccessToken = jest.fn();
const mockSyncClerkUserProfile = jest.fn();
const mockMarkPendingLoginMfa = jest.fn();
const mockClearPendingLoginMfa = jest.fn();

jest.mock('@clerk/expo', () => ({
  useSSO: () => ({
    startSSOFlow: mockStartSSOFlow,
  }),
}));

jest.mock('@clerk/expo/legacy', () => ({
  useSignIn: () => ({
    isLoaded: true,
    signIn: {
      create: mockSignInCreate,
      prepareSecondFactor: mockPrepareSecondFactor,
      attemptSecondFactor: mockAttemptSecondFactor,
    },
    setActive: mockSetActive,
  }),
}));

jest.mock('expo-image', () => {
  const mockReactNative = jest.requireActual('react-native');
  return {
    Image: mockReactNative.Image,
  };
});

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
  beginAuthenticatedMfaLogin: (token?: unknown) => mockBeginAuthenticatedMfaLogin(token),
  beginPasskeyLogin: (params?: unknown) => mockBeginPasskeyLogin(params),
  beginPasskeyRegistration: (params?: unknown) => mockBeginPasskeyRegistration(params),
  beginTotpSetup: jest.fn(),
  finishPasskeyLogin: (params?: unknown) => mockFinishPasskeyLogin(params),
  finishPasskeyRegistration: (params?: unknown) => mockFinishPasskeyRegistration(params),
  migrateLegacyPasswordToClerk: (...args: unknown[]) => mockMigrateLegacyPasswordToClerk(...args),
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

jest.mock('@/src/services/authTokens', () => ({
  getValidAccessToken: (...args: unknown[]) => mockGetValidAccessToken(...args),
}));

jest.mock('@/src/services/pendingLoginMfa', () => ({
  markPendingLoginMfa: (...args: unknown[]) => mockMarkPendingLoginMfa(...args),
  clearPendingLoginMfa: (...args: unknown[]) => mockClearPendingLoginMfa(...args),
}));

jest.mock('@/src/services/clerkSync', () => ({
  syncClerkUserProfile: (...args: unknown[]) => mockSyncClerkUserProfile(...args),
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
  return renderer.root.findAllByType(Pressable).find((node) => {
    const text = node
      .findAllByType(Text)
      .map((textNode) => flattenText(textNode.props.children))
      .join(' ');
    return text.includes(label);
  });
};

const findTouchableByExactLabel = (renderer: TestRenderer.ReactTestRenderer, label: string) => {
  return renderer.root.findAllByType(Pressable).find((node) => {
    const text = node
      .findAllByType(Text)
      .map((textNode) => flattenText(textNode.props.children))
      .join(' ')
      .trim();
    return text === label;
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
    mockActivateSsoSession.mockResolvedValue(undefined);
    mockStartSSOFlow.mockResolvedValue({
      createdSessionId: 'clerk-session-id',
      setActive: mockActivateSsoSession,
    });
    mockSignInCreate.mockResolvedValue({
      status: 'complete',
      createdSessionId: 'clerk-password-session-id',
    });
    mockPrepareSecondFactor.mockResolvedValue({
      status: 'needs_second_factor',
    });
    mockAttemptSecondFactor.mockResolvedValue({
      status: 'complete',
      createdSessionId: 'clerk-mfa-session-id',
    });
    mockSetActive.mockResolvedValue(undefined);
    mockMigrateLegacyPasswordToClerk.mockResolvedValue({
      status: 401,
      response: { migrated: false },
    });
    mockBeginAuthenticatedMfaLogin.mockResolvedValue({
      status: 200,
      response: { mfaRequired: false },
    });
    mockGetValidAccessToken.mockResolvedValue('social-access-token');
    mockSyncClerkUserProfile.mockResolvedValue({
      status: 200,
      response: {},
    });
    mockMarkPendingLoginMfa.mockResolvedValue(undefined);
    mockClearPendingLoginMfa.mockResolvedValue(undefined);
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

  it('falls back to email after the user starts passkey and iOS association fails', async () => {
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <LoginComponent currentUserEmail="person@example.com" initialMfaChallenge={challengeBase} />
      );
    });
    mountedRenderers.push(renderer!);

    await flushPromises();

    expect(mockBeginPasskeyLogin).not.toHaveBeenCalled();
    expect(mockSendEmailMfaCode).not.toHaveBeenCalled();
    expect(getRenderedText(renderer!)).toContain('Verify with Passkey');

    const primaryButton = findTouchableByLabel(renderer!, 'Verify with Passkey');
    expect(primaryButton).toBeTruthy();

    await act(async () => {
      await primaryButton?.props.onPress?.();
    });
    await flushPromises();

    expect(mockBeginPasskeyLogin).toHaveBeenCalledTimes(1);
    expect(mockSendEmailMfaCode).toHaveBeenCalledWith({ mfaToken: 'mfa-token' });

    const renderedText = getRenderedText(renderer!);
    expect(renderedText).toContain(PASSKEY_ASSOCIATION_FALLBACK_MESSAGE);
    expect(renderedText).toContain('Verify your email');
    expect(renderedText).toContain('Verification code');
    expect(renderedText).not.toContain('Unable to verify webcredentials association');
    expect(renderedText).not.toContain('Verify with Passkey');
    expect(findTouchableByExactLabel(renderer!, 'Passkey')).toBeUndefined();
    expect(findTouchableByExactLabel(renderer!, 'Backup Code')).toBeUndefined();

    expect(mockBeginPasskeyLogin).toHaveBeenCalledTimes(1);
  }, 15000);

  it('shows passkey login MFA without method chips or automatic passkey launch', async () => {
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <LoginComponent
          currentUserEmail="person@example.com"
          initialMfaChallenge={{
            ...challengeBase,
            availableMethods: ['passkey', 'email', 'backup'],
          }}
        />
      );
    });
    mountedRenderers.push(renderer!);

    await flushPromises();

    const renderedText = getRenderedText(renderer!);
    expect(renderedText).toContain('Verify with Passkey');
    expect(renderedText).toContain('Having trouble with your passkey? Verify by email instead.');
    expect(renderedText).not.toContain('Use other MFA options');
    expect(findTouchableByExactLabel(renderer!, 'Passkey')).toBeUndefined();
    expect(findTouchableByExactLabel(renderer!, 'Authenticator')).toBeUndefined();
    expect(findTouchableByExactLabel(renderer!, 'Email')).toBeUndefined();
    expect(findTouchableByExactLabel(renderer!, 'Backup Code')).toBeUndefined();
    expect(mockBeginPasskeyLogin).not.toHaveBeenCalled();
    expect(mockSendEmailMfaCode).not.toHaveBeenCalled();
  });

  it('retries passkey login once when the server challenge was stale', async () => {
    mockAuthenticate.mockResolvedValue({
      id: 'credential-id',
      rawId: 'credential-raw-id',
      type: 'public-key',
      response: {
        authenticatorData: 'authenticator-data',
        clientDataJSON: 'client-data',
        signature: 'signature',
        userHandle: 'user-handle',
      },
    });
    mockFinishPasskeyLogin
      .mockResolvedValueOnce({
        status: 400,
        response: { message: 'No passkey challenge in progress' },
      })
      .mockResolvedValueOnce({
        status: 200,
        response: {
          tokens: {
            accessToken: 'passkey-access-token',
          },
        },
      });

    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <LoginComponent currentUserEmail="person@example.com" initialMfaChallenge={challengeBase} />
      );
    });
    mountedRenderers.push(renderer!);

    await flushPromises();

    const primaryButton = findTouchableByLabel(renderer!, 'Verify with Passkey');
    await act(async () => {
      await primaryButton?.props.onPress?.();
    });
    await flushPromises();

    expect(mockBeginPasskeyLogin).toHaveBeenCalledTimes(2);
    expect(mockAuthenticate).toHaveBeenCalledTimes(2);
    expect(mockFinishPasskeyLogin).toHaveBeenCalledTimes(2);
    expect(getRenderedText(renderer!)).not.toContain('No passkey challenge in progress');
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_LOGIN_DATA',
      payload: {
        token: 'passkey-access-token',
        resetProfile: true,
      },
    });
  });

  it('sends email and switches to email verification from passkey login fallback', async () => {
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <LoginComponent currentUserEmail="person@example.com" initialMfaChallenge={challengeBase} />
      );
    });
    mountedRenderers.push(renderer!);

    await flushPromises();

    const fallback = findTouchableByLabel(renderer!, 'Verify by email instead');
    expect(fallback).toBeTruthy();

    await act(async () => {
      await fallback?.props.onPress?.();
    });
    await flushPromises();

    expect(mockSendEmailMfaCode).toHaveBeenCalledWith({ mfaToken: 'mfa-token' });
    const renderedText = getRenderedText(renderer!);
    expect(renderedText).toContain('Verify your email');
    expect(renderedText).toContain('We sent a verification code to p***@example.com.');
    expect(renderedText).toContain('Verification code');
    expect(renderedText).not.toContain('Verify with Passkey');
  });

  it('shows authenticator login MFA only when TOTP is preferred', async () => {
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <LoginComponent
          currentUserEmail="person@example.com"
          initialMfaChallenge={{
            ...challengeBase,
            preferredMethod: 'totp',
            availableMethods: ['totp', 'email', 'backup'],
          }}
        />
      );
    });
    mountedRenderers.push(renderer!);

    await flushPromises();

    const renderedText = getRenderedText(renderer!);
    expect(renderedText).toContain('Authenticator');
    expect(renderedText).toContain('Open your authenticator app and enter the 6-digit code.');
    expect(renderedText).toContain(
      'Having trouble with your authenticator app? Verify by email instead.'
    );
    expect(renderedText).toContain('Verification code');
    expect(renderedText).not.toContain('Connect your authenticator app');
    expect(findTouchableByExactLabel(renderer!, 'Backup Code')).toBeUndefined();
    expect(mockSendEmailMfaCode).not.toHaveBeenCalled();
  });

  it('sends email immediately and renders verify email UI when email is preferred for login MFA', async () => {
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <LoginComponent
          currentUserEmail="person@example.com"
          initialMfaChallenge={{
            ...challengeBase,
            preferredMethod: 'email',
            availableMethods: ['email', 'backup'],
          }}
        />
      );
    });
    mountedRenderers.push(renderer!);

    await flushPromises();

    expect(mockSendEmailMfaCode).toHaveBeenCalledWith({ mfaToken: 'mfa-token' });
    const renderedText = getRenderedText(renderer!);
    expect(renderedText).toContain('Verify your email');
    expect(renderedText).toContain('We sent a verification code to p***@example.com.');
    expect(renderedText).toContain('Verification code');
    expect(findTouchableByExactLabel(renderer!, 'Backup Code')).toBeUndefined();
  });

  it('shows passkey enrollment without starting setup before the user taps the CTA', async () => {
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

    expect(getRenderedText(renderer!)).toContain('Create a Passkey');
    expect(getRenderedText(renderer!)).toContain('Set up your Passkey');
    expect(mockBeginPasskeyRegistration).not.toHaveBeenCalled();
    expect(mockSendEmailMfaCode).not.toHaveBeenCalled();
  });

  it('does not start Android passkey enrollment on rerenders before the user taps the CTA', async () => {
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

    expect(mockBeginPasskeyRegistration).not.toHaveBeenCalled();
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

    const primaryButton = findTouchableByLabel(mountedRenderers[0], 'Set up your Passkey');
    expect(primaryButton).toBeTruthy();

    await act(async () => {
      await primaryButton?.props.onPress?.();
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

  it('starts Google SSO through Clerk and signs in with the created session', async () => {
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(<LoginComponent currentUserEmail="person@example.com" />);
    });
    mountedRenderers.push(renderer!);

    const googleButton = renderer!.root.findAllByType(Pressable).find((node) => {
      return node.findAllByType(Image).length > 0;
    });

    expect(googleButton).toBeTruthy();

    await act(async () => {
      await googleButton?.props.onPress?.();
    });
    await flushPromises();

    expect(mockStartSSOFlow).toHaveBeenCalledWith({
      strategy: 'oauth_google',
      redirectUrl: 'onebodyapp://oauth-native-callback',
    });
    expect(mockActivateSsoSession).toHaveBeenCalledWith(
      expect.objectContaining({
        session: 'clerk-session-id',
        navigate: expect.any(Function),
      })
    );
    expect(mockGetValidAccessToken).toHaveBeenCalledWith({ forceRefreshClerk: true });
    expect(mockSyncClerkUserProfile).toHaveBeenCalledWith({});
    expect(mockBeginAuthenticatedMfaLogin).toHaveBeenCalledWith('social-access-token');
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

  it('requires app MFA after social sign-in when enrolled MFA is active', async () => {
    mockBeginAuthenticatedMfaLogin.mockResolvedValueOnce({
      status: 200,
      response: {
        ...challengeBase,
        mfaToken: 'social-mfa-token',
        enrollmentRequired: false,
        preferredMethod: 'passkey',
        availableMethods: ['passkey', 'email'],
        emailMasked: 'p***@example.com',
      },
    });

    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(<LoginComponent currentUserEmail="person@example.com" />);
    });
    mountedRenderers.push(renderer!);

    const googleButton = renderer!.root.findAllByType(Pressable).find((node) => {
      return node.findAllByType(Image).length > 0;
    });

    expect(googleButton).toBeTruthy();

    await act(async () => {
      await googleButton?.props.onPress?.();
    });
    await flushPromises();

    expect(mockActivateSsoSession).toHaveBeenCalledWith(
      expect.objectContaining({
        session: 'clerk-session-id',
        navigate: expect.any(Function),
      })
    );
    expect(mockGetValidAccessToken).toHaveBeenCalledWith({ forceRefreshClerk: true });
    expect(mockSyncClerkUserProfile).toHaveBeenCalledWith({});
    expect(mockBeginAuthenticatedMfaLogin).toHaveBeenCalledWith('social-access-token');
    expect(mockMarkPendingLoginMfa).toHaveBeenCalledTimes(1);
    expect(mockDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SET_LOGIN_DATA' })
    );
    expect(mockReset).not.toHaveBeenCalled();
    expect(getRenderedText(renderer!)).toContain('Verify with Passkey');

    mockAuthenticate.mockResolvedValueOnce({
      id: 'credential-id',
      rawId: 'credential-raw-id',
      type: 'public-key',
      response: {
        authenticatorData: 'authenticator-data',
        clientDataJSON: 'client-data',
        signature: 'signature',
        userHandle: 'user-handle',
      },
    });
    mockFinishPasskeyLogin.mockResolvedValueOnce({
      status: 200,
      response: {
        tokens: {
          accessToken: 'legacy-social-mfa-token',
        },
      },
    });

    const primaryButton = findTouchableByLabel(renderer!, 'Verify with Passkey');
    await act(async () => {
      await primaryButton?.props.onPress?.();
    });
    await flushPromises();

    expect(mockFinishPasskeyLogin).toHaveBeenCalledWith(
      expect.objectContaining({ mfaToken: 'social-mfa-token' })
    );
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_LOGIN_DATA',
      payload: {
        token: 'social-access-token',
        resetProfile: true,
      },
    });
    expect(mockClearPendingLoginMfa).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'GET_PROFILE_REQUEST',
      payload: {
        token: 'social-access-token',
      },
    });
  });

  it('signs social users in directly without routing through the MFA screen', async () => {
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(<LoginComponent currentUserEmail="person@example.com" />);
    });
    mountedRenderers.push(renderer!);

    const appleButton = renderer!.root.findAllByType(Pressable).find((node) => {
      return node.props.accessibilityLabel === 'Continue with Apple';
    });

    expect(appleButton).toBeTruthy();

    await act(async () => {
      await appleButton?.props.onPress?.();
    });
    await flushPromises();

    expect(mockStartSSOFlow).toHaveBeenCalledWith({
      strategy: 'oauth_apple',
      redirectUrl: 'onebodyapp://oauth-native-callback',
    });
    expect(mockActivateSsoSession).toHaveBeenCalledWith(
      expect.objectContaining({
        session: 'clerk-session-id',
        navigate: expect.any(Function),
      })
    );
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

  it('checks app MFA after Clerk password sign-in before entering the app', async () => {
    mockGetValidAccessToken.mockResolvedValueOnce('clerk-access-token');

    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(<LoginComponent currentUserEmail="person@example.com" />);
    });
    mountedRenderers.push(renderer!);

    const inputs = renderer!.root.findAllByType(TextInput);

    await act(async () => {
      inputs[0].props.onChangeText('person@example.com');
      inputs[1].props.onChangeText('password');
    });

    const signInButton = findTouchableByLabel(renderer!, 'Sign In');
    await act(async () => {
      await signInButton?.props.onPress?.();
    });
    await flushPromises();

    expect(mockSetActive).toHaveBeenCalledWith(
      expect.objectContaining({
        session: 'clerk-password-session-id',
        navigate: expect.any(Function),
      })
    );
    expect(mockGetValidAccessToken).toHaveBeenCalledWith({ forceRefreshClerk: true });
    expect(mockBeginAuthenticatedMfaLogin).toHaveBeenCalledWith('clerk-access-token');
    expect(mockClearPendingLoginMfa).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_LOGIN_DATA',
      payload: {
        token: 'clerk-access-token',
        resetProfile: true,
      },
    });
    expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'MainRoot' }] });
  });

  it('requires app MFA after Clerk password sign-in when enrolled MFA is active', async () => {
    mockGetValidAccessToken.mockResolvedValueOnce('clerk-access-token');
    mockBeginAuthenticatedMfaLogin.mockResolvedValueOnce({
      status: 200,
      response: {
        ...challengeBase,
        mfaToken: 'login-mfa-token',
        enrollmentRequired: false,
        preferredMethod: 'passkey',
        availableMethods: ['passkey', 'email'],
        emailMasked: 'p***@example.com',
      },
    });

    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(<LoginComponent currentUserEmail="person@example.com" />);
    });
    mountedRenderers.push(renderer!);

    const inputs = renderer!.root.findAllByType(TextInput);

    await act(async () => {
      inputs[0].props.onChangeText('person@example.com');
      inputs[1].props.onChangeText('password');
    });

    const signInButton = findTouchableByLabel(renderer!, 'Sign In');
    await act(async () => {
      await signInButton?.props.onPress?.();
    });
    await flushPromises();

    expect(mockSetActive).toHaveBeenCalledWith(
      expect.objectContaining({
        session: 'clerk-password-session-id',
        navigate: expect.any(Function),
      })
    );
    expect(mockGetValidAccessToken).toHaveBeenCalledWith({ forceRefreshClerk: true });
    expect(mockBeginAuthenticatedMfaLogin).toHaveBeenCalledWith('clerk-access-token');
    expect(mockMarkPendingLoginMfa).toHaveBeenCalledTimes(1);
    expect(mockDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SET_LOGIN_DATA' })
    );
    expect(mockReset).not.toHaveBeenCalled();
    expect(getRenderedText(renderer!)).toContain('Verify with Passkey');
    expect(mockBeginPasskeyLogin).not.toHaveBeenCalled();

    mockAuthenticate.mockResolvedValueOnce({
      id: 'credential-id',
      rawId: 'credential-raw-id',
      type: 'public-key',
      response: {
        authenticatorData: 'authenticator-data',
        clientDataJSON: 'client-data',
        signature: 'signature',
        userHandle: 'user-handle',
      },
    });
    mockFinishPasskeyLogin.mockResolvedValueOnce({
      status: 200,
      response: {
        tokens: {
          accessToken: 'legacy-password-mfa-token',
        },
      },
    });

    const primaryButton = findTouchableByLabel(renderer!, 'Verify with Passkey');
    await act(async () => {
      await primaryButton?.props.onPress?.();
    });
    await flushPromises();

    expect(mockFinishPasskeyLogin).toHaveBeenCalledWith(
      expect.objectContaining({ mfaToken: 'login-mfa-token' })
    );
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_LOGIN_DATA',
      payload: {
        token: 'clerk-access-token',
        resetProfile: true,
      },
    });
    expect(mockClearPendingLoginMfa).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'GET_PROFILE_REQUEST',
      payload: {
        token: 'clerk-access-token',
      },
    });
  });

  it('prepares and completes Clerk email MFA after password sign-in needs a second factor', async () => {
    mockSignInCreate.mockResolvedValueOnce({
      status: 'needs_second_factor',
      supportedSecondFactors: [
        {
          strategy: 'email_code',
          emailAddressId: 'idn_123',
          safeIdentifier: 'p***@example.com',
        },
      ],
    });
    mockGetValidAccessToken.mockResolvedValueOnce('clerk-mfa-access-token');

    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(<LoginComponent currentUserEmail="person@example.com" />);
    });
    mountedRenderers.push(renderer!);

    const initialInputs = renderer!.root.findAllByType(TextInput);

    await act(async () => {
      initialInputs[0].props.onChangeText('Person@Example.com');
      initialInputs[1].props.onChangeText('password');
    });

    const signInButton = findTouchableByLabel(renderer!, 'Sign In');
    await act(async () => {
      await signInButton?.props.onPress?.();
    });
    await flushPromises();

    expect(mockSignInCreate).toHaveBeenCalledWith({
      identifier: 'person@example.com',
      password: 'password',
      strategy: 'password',
    });
    expect(mockPrepareSecondFactor).toHaveBeenCalledWith({
      strategy: 'email_code',
      emailAddressId: 'idn_123',
    });
    expect(getRenderedText(renderer!)).toContain('p***@example.com');

    const codeInput = renderer!.root
      .findAllByType(TextInput)
      .find((node) => node.props.placeholder === 'Enter code');

    await act(async () => {
      codeInput?.props.onChangeText('123456');
    });

    const verifyButton = findTouchableByLabel(renderer!, 'Verify');
    await act(async () => {
      await verifyButton?.props.onPress?.();
    });
    await flushPromises();

    expect(mockAttemptSecondFactor).toHaveBeenCalledWith({
      strategy: 'email_code',
      code: '123456',
    });
    expect(mockSetActive).toHaveBeenCalledWith(
      expect.objectContaining({
        session: 'clerk-mfa-session-id',
        navigate: expect.any(Function),
      })
    );
    expect(mockGetValidAccessToken).toHaveBeenCalledWith({ forceRefreshClerk: true });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_LOGIN_DATA',
      payload: {
        token: 'clerk-mfa-access-token',
        resetProfile: true,
      },
    });
    expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'MainRoot' }] });
  });

  it('does not attempt legacy migration when Clerk rejects the password', async () => {
    mockSignInCreate.mockRejectedValueOnce({
      errors: [
        {
          code: 'form_password_incorrect',
          message: 'Password is incorrect',
        },
      ],
    });

    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(<LoginComponent currentUserEmail="person@example.com" />);
    });
    mountedRenderers.push(renderer!);

    const inputs = renderer!.root.findAllByType(TextInput);

    await act(async () => {
      inputs[0].props.onChangeText('person@example.com');
      inputs[1].props.onChangeText('wrong-password');
    });

    const signInButton = findTouchableByLabel(renderer!, 'Sign In');
    await act(async () => {
      await signInButton?.props.onPress?.();
    });
    await flushPromises();

    expect(mockMigrateLegacyPasswordToClerk).not.toHaveBeenCalled();
    const renderedText = getRenderedText(renderer!);
    expect(renderedText).toContain('Incorrect email or password.');
    expect(renderedText).not.toContain('Password is incorrect');
  });

  it('shows a generic credential error when legacy migration rejects a missing Clerk account', async () => {
    mockSignInCreate.mockRejectedValueOnce({
      errors: [
        {
          code: 'form_identifier_not_found',
          message: "Couldn't find your account",
        },
      ],
    });
    mockMigrateLegacyPasswordToClerk.mockResolvedValueOnce({
      status: 401,
      response: { message: 'Invalid credentials' },
    });

    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(<LoginComponent currentUserEmail="person@example.com" />);
    });
    mountedRenderers.push(renderer!);

    const inputs = renderer!.root.findAllByType(TextInput);

    await act(async () => {
      inputs[0].props.onChangeText('person@example.com');
      inputs[1].props.onChangeText('password');
    });

    const signInButton = findTouchableByLabel(renderer!, 'Sign In');
    await act(async () => {
      await signInButton?.props.onPress?.();
    });
    await flushPromises();

    expect(mockMigrateLegacyPasswordToClerk).toHaveBeenCalledWith(
      {
        email: 'person@example.com',
        password: 'password',
      },
      {
        suppressErrorLog: true,
      }
    );
    const renderedText = getRenderedText(renderer!);
    expect(renderedText).toContain('Incorrect email or password.');
    expect(renderedText).not.toContain("Couldn't find your account");
    expect(renderedText).not.toContain('Invalid credentials');
  });
});
