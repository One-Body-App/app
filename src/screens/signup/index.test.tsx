import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Animated, InteractionManager, Pressable } from 'react-native';
import SignupForm from './index';

const mockDispatch = jest.fn();
const mockReplace = jest.fn();
const mockNavigate = jest.fn();
const mockReset = jest.fn();
const mockGetAppleIdToken = jest.fn();
const mockGetGoogleIdToken = jest.fn();
const mockExchangeSocialToken = jest.fn();
const mockStartSSOFlow = jest.fn();
const mockActivateSsoSession = jest.fn();
const mockSignUpCreate = jest.fn();
const mockPrepareEmailAddressVerification = jest.fn();
const mockGetValidAccessToken = jest.fn();
const mockSyncClerkUserProfile = jest.fn();

jest.mock('expo-image', () => {
  const mockReact = jest.requireActual('react');
  const mockReactNative = jest.requireActual('react-native');
  return {
    Image: (props: any) => mockReact.createElement(mockReactNative.View, props),
  };
});

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: (state: any) => unknown) =>
    selector({
      auth: {
        signUpSuccess: undefined,
        signUpData: undefined,
        error: undefined,
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
  useFocusEffect: jest.fn(),
}));

jest.mock('@clerk/expo', () => ({
  useSSO: () => ({
    startSSOFlow: mockStartSSOFlow,
  }),
}));

jest.mock('@clerk/expo/legacy', () => ({
  useSignUp: () => ({
    isLoaded: true,
    signUp: {
      create: mockSignUpCreate,
      prepareEmailAddressVerification: mockPrepareEmailAddressVerification,
    },
  }),
}));

jest.mock('@invertase/react-native-apple-authentication', () => {
  const mockReact = jest.requireActual('react');
  const mockReactNative = jest.requireActual('react-native');

  const MockAppleButton = (props: any) =>
    mockReact.createElement(mockReactNative.Pressable, {
      ...props,
      testID: props.testID ?? 'mock-apple-button',
    });

  MockAppleButton.Type = {
    SIGN_UP: 'SignUp',
    CONTINUE: 'Continue',
  };

  MockAppleButton.Style = {
    BLACK: 'Black',
    WHITE: 'White',
  };

  return {
    AppleButton: MockAppleButton,
    appleAuth: {
      isSignUpButtonSupported: true,
    },
  };
});

jest.mock('@/src/redux/actions/AuthActions', () => ({
  sendVerificationEmail: {
    Request: jest.fn((payload) => ({ type: 'SEND_VERIFICATION_EMAIL_REQUEST', payload })),
  },
  getProfile: {
    Success: jest.fn((payload) => ({ type: 'GET_PROFILE_SUCCESS', payload })),
  },
  signUp: {
    Request: jest.fn((payload) => ({ type: 'SIGN_UP_REQUEST', payload })),
    Reset: jest.fn(() => ({ type: 'SIGN_UP_RESET' })),
  },
  setLoginData: jest.fn((payload) => ({ type: 'SET_LOGIN_DATA', payload })),
}));

jest.mock('@/src/redux/actions/GeneralActions', () => ({
  setAccountType: jest.fn((payload) => ({ type: 'SET_ACCOUNT_TYPE', payload })),
  setLoader: jest.fn((payload) => ({ type: 'SET_LOADER', payload })),
}));

jest.mock('@/src/services/api', () => ({
  ApiCall: jest.fn(),
}));

jest.mock('@/utils/validation/validator', () => jest.fn(() => Promise.resolve('')));

jest.mock('../layout/UserStepsLayout', () => {
  const mockReact = jest.requireActual('react');
  const mockReactNative = jest.requireActual('react-native');
  return function MockUserStepsLayout({ children, refreshControl }: any) {
    return mockReact.createElement(
      mockReactNative.View,
      null,
      refreshControl
        ? mockReact.createElement(mockReactNative.View, { testID: 'refresh-wrapper' })
        : null,
      children
    );
  };
});

jest.mock('@/components/styled/Text', () => {
  const mockReact = jest.requireActual('react');
  const mockReactNative = jest.requireActual('react-native');
  return function MockStyledText({ children, ...props }: any) {
    return mockReact.createElement(mockReactNative.Text, props, children);
  };
});

jest.mock('@/components/styled/TextInput', () => {
  const mockReact = jest.requireActual('react');
  const mockReactNative = jest.requireActual('react-native');
  return function MockStyledTextInput(props: any) {
    return mockReact.createElement(mockReactNative.TextInput, props);
  };
});

jest.mock('@/components/Button', () => {
  const mockReact = jest.requireActual('react');
  const mockReactNative = jest.requireActual('react-native');
  return function MockButton({ text, onPress }: any) {
    return mockReact.createElement(mockReactNative.Pressable, { onPress }, text);
  };
});

jest.mock('@react-native-community/blur', () => ({
  BlurView: () => null,
}));

jest.mock('react-native-recaptcha-that-works', () => {
  const mockReact = jest.requireActual('react');
  return {
    __esModule: true,
    default: mockReact.forwardRef((props: any, ref: any) => {
      mockReact.useImperativeHandle(ref, () => ({
        open: () => props.onVerify?.('mock-token'),
      }));
      return null;
    }),
  };
});

jest.mock('@react-native-vector-icons/material-design-icons', () => () => null);
jest.mock('@react-native-vector-icons/ionicons', () => () => null);

jest.mock('@/services/socialAuth', () => ({
  ensureGoogleSigninConfigured: jest.fn(),
  exchangeSocialToken: (...args: unknown[]) => mockExchangeSocialToken(...args),
  getAppleIdToken: (...args: unknown[]) => mockGetAppleIdToken(...args),
  getGoogleIdToken: (...args: unknown[]) => mockGetGoogleIdToken(...args),
}));

jest.mock('@/src/services/accountTypeStorage', () => ({
  clearPendingAccountType: jest.fn(() => Promise.resolve()),
  savePendingAccountType: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/src/services/pendingSocialContinuation', () => ({
  clearPendingSocialContinuation: jest.fn(),
  loadPendingSocialContinuation: jest.fn(() => null),
}));

jest.mock('@/src/services/authTokens', () => ({
  getValidAccessToken: () => mockGetValidAccessToken(),
}));

jest.mock('@/src/services/clerkSync', () => ({
  syncClerkUserProfile: (params?: unknown) => mockSyncClerkUserProfile(params),
}));

const fillInput = (
  renderer: TestRenderer.ReactTestRenderer,
  testID: string,
  value: string
) => {
  const input = renderer.root.findByProps({ testID }) as TestRenderer.ReactTestInstance;
  act(() => {
    input.props.onChangeText(value);
  });
};

const pressJoin = async (renderer: TestRenderer.ReactTestRenderer) => {
  const joinButton = renderer.root
    .findAllByType(Pressable)
    .find((node) => node.props.children === 'Join');

  await act(async () => {
    await joinButton!.props.onPress();
  });
  await act(async () => {
    await Promise.resolve();
  });
};

describe('SignupForm social buttons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(InteractionManager, 'runAfterInteractions').mockReturnValue({
      cancel: jest.fn(),
    } as any);
    jest.spyOn(Animated, 'timing').mockReturnValue({
      start: jest.fn(),
      stop: jest.fn(),
    } as any);
    jest.spyOn(Animated, 'parallel').mockReturnValue({
      start: jest.fn(),
      stop: jest.fn(),
    } as any);
    jest.spyOn(Animated, 'sequence').mockReturnValue({
      start: jest.fn(),
      stop: jest.fn(),
    } as any);
    jest.spyOn(Animated, 'delay').mockReturnValue({
      start: jest.fn(),
      stop: jest.fn(),
    } as any);
    mockGetAppleIdToken.mockResolvedValue({
      idToken: 'apple-token',
      nonce: 'apple-nonce',
      details: {
        email: 'person@example.com',
      },
    });
    mockExchangeSocialToken.mockResolvedValue({
      status: 200,
      response: {
        tokens: {
          accessToken: 'social-access-token',
        },
        isNewUser: false,
        authMethod: 'social',
        bypassMandatoryMfaOnboarding: true,
      },
    });
    mockSignUpCreate.mockResolvedValue({ status: 'missing_requirements' });
    mockPrepareEmailAddressVerification.mockResolvedValue({});
    mockActivateSsoSession.mockResolvedValue(undefined);
    mockStartSSOFlow.mockResolvedValue({
      createdSessionId: 'clerk-session-id',
      setActive: mockActivateSsoSession,
    });
    mockGetValidAccessToken.mockResolvedValue('clerk-access-token');
    mockSyncClerkUserProfile.mockResolvedValue({
      status: 200,
      response: { user: { _id: 'user_123' } },
    });
    const { ApiCall } = jest.requireMock('@/src/services/api') as { ApiCall: jest.Mock };
    ApiCall.mockResolvedValue({ status: 200, response: { ok: true } });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the native Apple signup button on iOS and starts the Clerk signup social flow', async () => {
    let renderer: TestRenderer.ReactTestRenderer;
    const navigation = {
      replace: mockReplace,
      navigate: mockNavigate,
      reset: mockReset,
    } as any;
    const route = {
      key: 'signup',
      name: 'SignUp',
      params: {
        accountType: 'individual',
      },
    } as any;

    act(() => {
      renderer = TestRenderer.create(<SignupForm navigation={navigation} route={route} />);
    });

    const appleButton = renderer!.root.findByProps({ testID: 'signup-apple-button' });
    expect(appleButton.props.buttonType).toBe('SignUp');

    await act(async () => {
      await appleButton.props.onPress();
    });

    expect(mockStartSSOFlow).toHaveBeenCalledWith({
      strategy: 'oauth_apple',
      redirectUrl: 'onebodyapp://oauth-native-callback',
    });
    expect(mockActivateSsoSession).toHaveBeenCalledWith({ session: 'clerk-session-id' });
    expect(mockSyncClerkUserProfile).toHaveBeenCalledWith({ accountType: 'individual' });
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SET_LOGIN_DATA',
        payload: expect.objectContaining({
          token: 'clerk-access-token',
          authMethod: 'social',
        }),
      })
    );
    expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'MainRoot' }] });
    expect(mockReplace).not.toHaveBeenCalledWith('Login', expect.anything());
  });

  it('submits individual signup with Clerk canonical first and last name fields', async () => {
    let renderer: TestRenderer.ReactTestRenderer;
    const navigation = {
      replace: mockReplace,
      navigate: mockNavigate,
      reset: mockReset,
    } as any;
    const route = {
      key: 'signup',
      name: 'SignUp',
      params: {
        accountType: 'individual',
      },
    } as any;

    act(() => {
      renderer = TestRenderer.create(<SignupForm navigation={navigation} route={route} />);
    });

    fillInput(renderer!, 'signup-username-input', 'person.test');
    fillInput(renderer!, 'signup-first-name-input', 'Person');
    fillInput(renderer!, 'signup-last-name-input', 'Example');
    fillInput(renderer!, 'signup-email-input', 'person@example.com');
    fillInput(renderer!, 'signup-password-input', 'Password1!');
    fillInput(renderer!, 'signup-confirm-password-input', 'Password1!');

    await pressJoin(renderer!);

    expect(mockSignUpCreate).toHaveBeenCalledWith({
      emailAddress: 'person@example.com',
      password: 'Password1!',
      username: 'person_test',
      firstName: 'Person',
      lastName: 'Example',
      legalAccepted: true,
      unsafeMetadata: {
        name: 'Person Example',
        username: 'person.test',
        accountType: 'individual',
      },
    });
    expect(mockPrepareEmailAddressVerification).toHaveBeenCalledWith({ strategy: 'email_code' });
    expect(mockReplace).toHaveBeenCalledWith(
      'ConfirmLogin',
      expect.objectContaining({
        mode: 'clerk-signup-code',
        prefillEmail: 'person@example.com',
        signupFirstName: 'Person',
        signupLastName: 'Example',
        signupName: 'Person Example',
        signupUsername: 'person.test',
        accountType: 'individual',
      })
    );

    act(() => {
      renderer!.unmount();
    });
  });

  it('submits organization signup with organization profile name and contact Clerk names', async () => {
    let renderer: TestRenderer.ReactTestRenderer;
    const navigation = {
      replace: mockReplace,
      navigate: mockNavigate,
      reset: mockReset,
    } as any;
    const route = {
      key: 'signup',
      name: 'SignUp',
      params: {
        accountType: 'organization',
      },
    } as any;

    act(() => {
      renderer = TestRenderer.create(<SignupForm navigation={navigation} route={route} />);
    });

    fillInput(renderer!, 'signup-username-input', 'onebodychurch');
    fillInput(renderer!, 'signup-organization-name-input', 'One Body Church');
    fillInput(renderer!, 'signup-first-name-input', 'Ministry');
    fillInput(renderer!, 'signup-last-name-input', 'Admin');
    fillInput(renderer!, 'signup-email-input', 'admin@example.com');
    fillInput(renderer!, 'signup-password-input', 'Password1!');
    fillInput(renderer!, 'signup-confirm-password-input', 'Password1!');

    await pressJoin(renderer!);

    expect(mockSignUpCreate).toHaveBeenCalledWith({
      emailAddress: 'admin@example.com',
      password: 'Password1!',
      username: 'onebodychurch',
      firstName: 'Ministry',
      lastName: 'Admin',
      legalAccepted: true,
      unsafeMetadata: {
        name: 'One Body Church',
        username: 'onebodychurch',
        accountType: 'organization',
        organizationName: 'One Body Church',
      },
    });
    expect(mockReplace).toHaveBeenCalledWith(
      'ConfirmLogin',
      expect.objectContaining({
        signupFirstName: 'Ministry',
        signupLastName: 'Admin',
        signupName: 'One Body Church',
        signupUsername: 'onebodychurch',
        accountType: 'organization',
      })
    );

    act(() => {
      renderer!.unmount();
    });
  });
});
