import { Image } from 'expo-image';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  RefreshControl,
  ScrollView,
  Pressable,
  View,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useNavigation, useTheme } from '@react-navigation/native';
import { useSSO } from '@clerk/expo';
import { useSignIn } from '@clerk/expo/legacy';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from '@react-native-vector-icons/ionicons';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import noop from 'lodash/noop';
import QRCode from 'react-native-qrcode-svg';
import { MainStackParamList } from '@/src/navigator/types';
import { setLoader } from '@/src/redux/actions/GeneralActions';
import { getProfile, setLoginData } from '@/src/redux/actions/AuthActions';
import {
  beginPasskeyLogin,
  beginPasskeyRegistration,
  beginTotpSetup,
  MfaChallengeResponse,
  MfaMethod,
  sendEmailMfaCode,
  verifyBackupCode,
  verifyEmailMfaCode,
  verifyTotpCode,
  verifyTotpSetup,
  finishPasskeyLogin,
  finishPasskeyRegistration,
  migrateLegacyPasswordToClerk,
} from '@/services/login';
import { getSocialAuthActionLabel } from '@/src/utils/socialAuthFlow';
import { clearPendingSocialContinuation } from '@/src/services/pendingSocialContinuation';
import { syncClerkUserProfile } from '@/src/services/clerkSync';
import resolveInitialMfaMethod from '@/src/utils/mfa';
import {
  isPasskeyAssociationError,
  isPasskeyCancellationError,
  PASSKEY_ASSOCIATION_FALLBACK_MESSAGE,
} from '@/src/utils/passkeyErrors';
import { getValidAccessToken } from '@/src/services/authTokens';
import { clearPendingLoginMfa } from '@/src/services/pendingLoginMfa';
import useMountEffect from '@/src/hooks/useMountEffect';
import useObservedEffect from '@/src/hooks/useObservedEffect';

import Button from '../Button';
import CustomClipboard, { CustomClipboardHandle } from '../CustomClipboard';
import StyledText from '../styled/Text';
import StyledTextInput from '../styled/TextInput';
import createLoginStyles from './styles';

type Nav = NativeStackNavigationProp<MainStackParamList, 'Login'>;

const googleIcon = require('@/assets/icons/google.png');

const passkeyHeroAnimation = require('../../assets/animations/Password Authentication');
const passkeyHeroAnimationAndroid = require('../../assets/animations/onboarding-intro');
const passkeyHeroFallbackAnimation = require('../../assets/animations/choose-your-colors');

const oneBodyLottieColorFilters = [
  { keypath: 'Correct', color: '#12D2D9' },
  { keypath: 'Cloud e', color: '#12D2D9' },
  { keypath: 'Finger Scan', color: '#126B87' },
  { keypath: 'Pin 1', color: '#126B87' },
  { keypath: 'Pin 2', color: '#126B87' },
  { keypath: 'Pin 3', color: '#126B87' },
  { keypath: 'Pin 4', color: '#126B87' },
  { keypath: 'Pin 5', color: '#126B87' },
  { keypath: 'Pin 6', color: '#126B87' },
  { keypath: 'Pin Tab', color: '#032F3C' },
  { keypath: 'Object', color: '#032F3C' },
  { keypath: 'Cloud 1', color: '#12D2D9' },
];

type LoginComponentProps = {
  currentUserEmail?: string;
  initialMfaChallenge?: MfaChallengeResponse;
  onMfaLaunchScreenChange?: (isVisible: boolean) => void;
};

type ClerkEmailSecondFactor = {
  strategy?: string;
  emailAddressId?: string;
  email_address_id?: string;
  safeIdentifier?: string;
  safe_identifier?: string;
};

const getClerkEmailSecondFactor = (signInAttempt: any) => {
  const factors =
    signInAttempt?.supportedSecondFactors ?? signInAttempt?.supported_second_factors ?? null;

  if (!Array.isArray(factors)) {
    return null;
  }

  const factor = factors.find((item: ClerkEmailSecondFactor) => item?.strategy === 'email_code') as
    | ClerkEmailSecondFactor
    | undefined;

  if (!factor) {
    return null;
  }

  return {
    emailAddressId: factor.emailAddressId ?? factor.email_address_id,
    safeIdentifier: factor.safeIdentifier ?? factor.safe_identifier,
  };
};

const passkeyClient: any = (() => {
  try {
    // eslint-disable-next-line global-require
    return require('react-native-passkey');
  } catch (error) {
    return null;
  }
})();

const resolvePasskeyApi = () => {
  const passkeyApi =
    passkeyClient?.Passkey ??
    passkeyClient?.default?.Passkey ??
    passkeyClient?.default ??
    passkeyClient;

  return {
    register: passkeyApi?.register,
    authenticate: passkeyApi?.authenticate,
    isSupported:
      typeof passkeyApi?.isSupported === 'function'
        ? passkeyApi.isSupported.bind(passkeyApi)
        : undefined,
  };
};

const sanitizeAnalyticsReason = (value: unknown) => {
  if (typeof value !== 'string' || !value.trim()) {
    return 'unknown';
  }

  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return normalized.slice(0, 72) || 'unknown';
};

const getClerkErrorMessage = (error: any, fallback = 'Sign in failed.') => {
  return (
    error?.errors?.[0]?.longMessage ?? error?.errors?.[0]?.message ?? error?.message ?? fallback
  );
};

const SIGN_IN_CREDENTIALS_MESSAGE = 'Incorrect email or password.';

const getClerkErrorDetails = (error: any) => {
  const firstError = error?.errors?.[0] ?? {};
  const code = typeof firstError?.code === 'string' ? firstError.code : '';
  const message = getClerkErrorMessage(error, '');

  return {
    code,
    message,
    normalizedMessage: message.toLowerCase(),
  };
};

const isClerkIdentifierNotFoundError = (error: any) => {
  const { code, normalizedMessage } = getClerkErrorDetails(error);

  return (
    code === 'form_identifier_not_found' ||
    normalizedMessage.includes("couldn't find your account") ||
    normalizedMessage.includes("couldn't find an account")
  );
};

const isClerkCredentialError = (error: any) => {
  const { code, normalizedMessage } = getClerkErrorDetails(error);

  return (
    isClerkIdentifierNotFoundError(error) ||
    code === 'form_password_incorrect' ||
    normalizedMessage.includes('password is incorrect') ||
    normalizedMessage.includes('incorrect password')
  );
};

const getSignInErrorMessage = (error: any) => {
  if (isClerkCredentialError(error)) {
    return SIGN_IN_CREDENTIALS_MESSAGE;
  }

  return getClerkErrorMessage(error);
};

const getIncompleteClerkSignInMessage = (result: any) => {
  const status = String(result?.status ?? '');
  if (status === 'needs_second_factor') {
    return 'Additional verification is required before signing in.';
  }
  if (status === 'needs_first_factor') {
    return 'Enter the verification code sent to your email to continue.';
  }
  if (status === 'needs_identifier') {
    return 'Enter your email address to continue.';
  }
  if (status === 'needs_new_password') {
    return 'Reset your password to finish signing in.';
  }
  if (status === 'needs_factor_one' || status === 'needs_factor_two') {
    return 'Additional verification is required before signing in.';
  }
  return 'Additional verification is required. Please check your email and try again.';
};

const isLoginMfaChallenge = (challenge: MfaChallengeResponse | null) =>
  !!challenge && !challenge.enrollmentRequired;

const getLoginMfaFallbackCopy = (method: MfaMethod) => {
  if (method === 'totp') {
    return 'Having trouble with your authenticator app? Verify by email instead.';
  }

  return 'Having trouble with your passkey? Verify by email instead.';
};

const PASSKEY_LOGIN_STALE_CHALLENGE_MESSAGE =
  'We could not finish that passkey challenge. Please try again or verify by email instead.';

const isPasskeyChallengeMissingMessage = (message?: unknown) =>
  typeof message === 'string' && message.toLowerCase().includes('no passkey challenge in progress');

const apiMessage = (response: unknown, fallback: string) => {
  const message = (response as { message?: unknown } | null)?.message;
  return typeof message === 'string' && message.trim() ? message : fallback;
};

const passkeyLoginFinishError = (response: unknown) => {
  const message = apiMessage(response, 'Unable to verify passkey.');
  const error = new Error(
    isPasskeyChallengeMissingMessage(message) ? PASSKEY_LOGIN_STALE_CHALLENGE_MESSAGE : message
  );
  (error as any).passkeyChallengeMissing = isPasskeyChallengeMissingMessage(message);
  return error;
};

const isPasskeyChallengeMissingError = (error: unknown) =>
  Boolean((error as { passkeyChallengeMissing?: boolean } | null)?.passkeyChallengeMissing) ||
  isPasskeyChallengeMissingMessage((error as Error | null)?.message);

const toBase64FromBase64Url = (value?: string) => {
  if (!value || typeof value !== 'string') {
    return value ?? '';
  }
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const paddingNeeded = normalized.length % 4;
  if (paddingNeeded === 0) {
    return normalized;
  }
  return `${normalized}${'='.repeat(4 - paddingNeeded)}`;
};

const toBase64UrlFromBase64 = (value?: string) => {
  if (!value || typeof value !== 'string') {
    return value ?? '';
  }
  return value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const normalizePasskeyRegistrationRequestForNative = (request: any) => ({
  ...request,
  challenge: toBase64FromBase64Url(request?.challenge),
  user: {
    ...(request?.user ?? {}),
    id: toBase64FromBase64Url(request?.user?.id),
  },
  excludeCredentials: Array.isArray(request?.excludeCredentials)
    ? request.excludeCredentials.map((credential: any) => ({
        ...credential,
        id: toBase64FromBase64Url(credential?.id),
      }))
    : request?.excludeCredentials,
});

const normalizePasskeyAuthenticationRequestForNative = (request: any) => ({
  ...request,
  challenge: toBase64FromBase64Url(request?.challenge),
  allowCredentials: Array.isArray(request?.allowCredentials)
    ? request.allowCredentials.map((credential: any) => ({
        ...credential,
        id: toBase64FromBase64Url(credential?.id),
      }))
    : request?.allowCredentials,
});

const normalizePasskeyRegistrationResponseForServer = (response: any) => ({
  ...response,
  type: response?.type ?? 'public-key',
  id: toBase64UrlFromBase64(response?.id),
  rawId: toBase64UrlFromBase64(response?.rawId),
  response: {
    ...(response?.response ?? {}),
    clientDataJSON: toBase64UrlFromBase64(response?.response?.clientDataJSON),
    attestationObject: toBase64UrlFromBase64(response?.response?.attestationObject),
  },
});

const normalizePasskeyAuthenticationResponseForServer = (response: any) => ({
  ...response,
  type: response?.type ?? 'public-key',
  id: toBase64UrlFromBase64(response?.id),
  rawId: toBase64UrlFromBase64(response?.rawId),
  response: {
    ...(response?.response ?? {}),
    authenticatorData: toBase64UrlFromBase64(response?.response?.authenticatorData),
    clientDataJSON: toBase64UrlFromBase64(response?.response?.clientDataJSON),
    signature: toBase64UrlFromBase64(response?.response?.signature),
    userHandle: response?.response?.userHandle
      ? toBase64UrlFromBase64(response.response.userHandle)
      : response?.response?.userHandle,
  },
});

const extractTotpSetupCode = (otpauthUri: string) => {
  if (!otpauthUri) {
    return '';
  }

  const match = otpauthUri.match(/[?&]secret=([^&]+)/i);
  if (!match?.[1]) {
    return otpauthUri;
  }

  try {
    return decodeURIComponent(match[1]);
  } catch (_error) {
    return match[1];
  }
};

function LoginComponent({
  currentUserEmail,
  initialMfaChallenge,
  onMfaLaunchScreenChange,
}: LoginComponentProps) {
  const dispatch = useDispatch();
  const navigation = useNavigation<Nav>();
  const { isLoaded: isSignInLoaded, signIn, setActive } = useSignIn();
  const { startSSOFlow } = useSSO();
  const { dark } = useTheme();
  const styles = useMemo(() => createLoginStyles(dark), [dark]);
  const trackMfaEvent = noop as (eventName: string, params: Record<string, any>) => undefined;
  const initialMfaMethod: MfaMethod = initialMfaChallenge
    ? resolveInitialMfaMethod(initialMfaChallenge)
    : 'passkey';
  const initialMfaChallengeSignature = [
    initialMfaChallenge?.mfaToken ?? '',
    initialMfaChallenge?.enrollmentRequired ? '1' : '0',
    initialMfaChallenge?.preferredMethod ?? '',
    initialMfaChallenge?.availableMethods?.join(',') ?? '',
    initialMfaChallenge?.emailMasked ?? '',
    initialMfaChallenge?.reason ?? '',
  ].join('|');

  const [form, setForm] = useState(() => ({
    email: currentUserEmail ?? '',
    password: '',
    code: '',
  }));
  const [hidePass, setHidePass] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [successText, setSuccessText] = useState<string>('');
  const [mfaChallenge, setMfaChallenge] = useState<MfaChallengeResponse | null>(
    () => initialMfaChallenge ?? null
  );
  const [selectedMfaMethod, setSelectedMfaMethod] = useState<MfaMethod>(() => initialMfaMethod);
  const [totpOtpauth, setTotpOtpauth] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [pendingAccessToken, setPendingAccessToken] = useState<string>('');
  const [clerkMfaEmail, setClerkMfaEmail] = useState<string>('');
  const [isPasskeyAssociationUnavailable, setIsPasskeyAssociationUnavailable] = useState(false);
  const [showOtherMfaOptions, setShowOtherMfaOptions] = useState(false);
  const [useAndroidFallbackHero, setUseAndroidFallbackHero] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const clipboardRef = useRef<CustomClipboardHandle>(null);
  const locationPromptedRef = useRef(false);
  const hasPasskeyHeroLoadedRef = useRef(false);
  const submissionInFlightRef = useRef(false);
  const passkeyInFlightRef = useRef<Promise<void> | null>(null);
  const handledInitialMfaChallengeSignatureRef = useRef<string | null>(null);
  const postClerkMfaAccessTokenRef = useRef('');

  const logAndroidPasskey = useCallback((event: string, payload?: Record<string, unknown>) => {
    if (__DEV__ && Platform.OS === 'android') {
      console.log('[AndroidPasskey]', event, payload ?? {});
    }
  }, []);

  const handleClerkTaskNavigation = useCallback(
    async ({ session }: { session?: { currentTask?: { key?: string } | null } | null }) => {
      const taskKey = session?.currentTask?.key;
      if (!taskKey || taskKey === 'setup-mfa') {
        return;
      }

      if (taskKey === 'reset-password') {
        navigation.navigate(
          'ForgotPassword' as any,
          {
            email: form.email.trim() || undefined,
          } as any
        );
      }
    },
    [form.email, navigation]
  );

  useMountEffect(() => {
    AsyncStorage.getItem('location_permission_requested').then((val) => {
      locationPromptedRef.current = val === '1';
    });
  });

  useObservedEffect(() => {
    if (!initialMfaChallenge) return;
    if (handledInitialMfaChallengeSignatureRef.current === initialMfaChallengeSignature) {
      return;
    }
    handledInitialMfaChallengeSignatureRef.current = initialMfaChallengeSignature;

    const preferredMethod = resolveInitialMfaMethod(initialMfaChallenge);

    hasPasskeyHeroLoadedRef.current = false;
    submissionInFlightRef.current = false;
    passkeyInFlightRef.current = null;
    trackMfaEvent('mfa_method_selected', {
      method: preferredMethod,
      source: 'challenge_prefill',
      enrollment_required: initialMfaChallenge.enrollmentRequired,
      reason: initialMfaChallenge.reason,
      fallback: preferredMethod !== initialMfaChallenge.preferredMethod,
    });

    if (preferredMethod === 'email' && !initialMfaChallenge.enrollmentRequired) {
      sendEmailMfaCode({ mfaToken: initialMfaChallenge.mfaToken })
        .then((res) => {
          if (res.status === 200) {
            setSuccessText(`A verification code was sent to ${initialMfaChallenge.emailMasked}.`);
          }
        })
        .catch(() => undefined);
    }
  }, [initialMfaChallenge, initialMfaChallengeSignature, trackMfaEvent]);

  useObservedEffect(() => {
    if (!mfaChallenge || selectedMfaMethod !== 'passkey') {
      return;
    }

    logAndroidPasskey('mfa_challenge_mounted', {
      enrollmentRequired: mfaChallenge.enrollmentRequired,
      reason: mfaChallenge.reason,
      availableMethods: mfaChallenge.availableMethods,
    });
  }, [logAndroidPasskey, mfaChallenge, selectedMfaMethod]);

  const completeLogin = useCallback(
    (accessToken: string) => {
      clearPendingLoginMfa().catch(() => undefined);
      clearPendingSocialContinuation();
      logAndroidPasskey('token_accepted', {
        hasAccessToken: Boolean(accessToken),
        source: mfaChallenge?.enrollmentRequired ? 'passkey_enrollment' : 'auth_success',
      });
      dispatch(setLoginData({ token: accessToken, resetProfile: true }));
      dispatch(getProfile.Request({ token: accessToken }));
      logAndroidPasskey('profile_request_start', {
        source: mfaChallenge?.enrollmentRequired ? 'passkey_enrollment' : 'auth_success',
      });
      navigation.reset({ index: 0, routes: [{ name: 'MainRoot' as any }] });
    },
    [dispatch, logAndroidPasskey, mfaChallenge?.enrollmentRequired, navigation]
  );

  const completeSyncedClerkLogin = useCallback(
    async ({
      accessToken,
      authMethod,
      bypassMandatoryMfaOnboarding,
      email,
    }: {
      accessToken: string;
      authMethod: 'password' | 'social';
      bypassMandatoryMfaOnboarding?: boolean;
      email?: string;
    }) => {
      const syncResult = await syncClerkUserProfile({
        token: accessToken,
        email,
      });
      if (syncResult.status !== 200) {
        const message =
          typeof syncResult.response?.message === 'string'
            ? syncResult.response.message
            : 'Unable to sync your account. Please try again.';
        throw new Error(message);
      }

      clearPendingLoginMfa().catch(() => undefined);
      clearPendingSocialContinuation();
      const syncedProfile = syncResult.response?.user ?? syncResult.response;
      dispatch(
        setLoginData({
          token: accessToken,
          resetProfile: true,
          authMethod,
          bypassMandatoryMfaOnboarding,
        })
      );
      dispatch(getProfile.Success(syncedProfile));
      navigation.reset({ index: 0, routes: [{ name: 'MainRoot' as any }] });
    },
    [dispatch, navigation]
  );

  const handleAuthResult = useCallback(
    async (response: any) => {
      if (response?.mfaRequired) {
        const challenge = response as MfaChallengeResponse;
        const preferredMethod = resolveInitialMfaMethod(challenge);
        setMfaChallenge(challenge);
        setSelectedMfaMethod(preferredMethod);
        setForm((prev) => ({ ...prev, code: '' }));
        setSuccessText('');
        setTotpOtpauth('');
        setIsPasskeyAssociationUnavailable(false);
        setShowOtherMfaOptions(false);
        trackMfaEvent('mfa_method_selected', {
          method: preferredMethod,
          source: 'challenge_response',
          enrollment_required: challenge.enrollmentRequired,
          reason: challenge.reason,
          fallback: preferredMethod !== challenge.preferredMethod,
        });
        if (preferredMethod === 'email' && !challenge.enrollmentRequired) {
          await sendEmailMfaCode({ mfaToken: challenge.mfaToken });
          setSuccessText(`A verification code was sent to ${challenge.emailMasked}.`);
        }
        return;
      }

      const token = postClerkMfaAccessTokenRef.current || response?.tokens?.accessToken;
      if (!token) {
        throw new Error('Invalid authentication response');
      }

      const codes = Array.isArray(response?.backupCodes) ? response.backupCodes : [];
      if (codes.length > 0) {
        setBackupCodes(codes);
        setPendingAccessToken(token);
        postClerkMfaAccessTokenRef.current = '';
        setSuccessText('Save these backup codes in a safe place. They are shown only once.');
        return;
      }

      postClerkMfaAccessTokenRef.current = '';
      completeLogin(token);
    },
    [completeLogin, trackMfaEvent]
  );

  const requestEmailMfaCode = useCallback(
    async (challenge: MfaChallengeResponse, successMessage?: string) => {
      const res = await sendEmailMfaCode({ mfaToken: challenge.mfaToken });
      if (res.status !== 200) {
        throw new Error((res.response as any)?.message ?? 'Unable to send email code.');
      }

      setSuccessText(successMessage ?? `A verification code was sent to ${challenge.emailMasked}.`);
      return res;
    },
    []
  );

  const ensureLocationPermission = useCallback(async () => {
    if (locationPromptedRef.current) return;
    try {
      let granted = false;
      if (Platform.OS === 'android') {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Allow location',
            message: 'We use your city to help secure your login.',
            buttonPositive: 'Allow',
          }
        );
        granted = result === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        Geolocation.requestAuthorization();
        granted = true;
      }

      if (granted) {
        Geolocation.getCurrentPosition(
          () => undefined,
          () => undefined,
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 }
        );
      }
    } catch (e) {
      // ignore permission errors; login can proceed
    } finally {
      await AsyncStorage.setItem('location_permission_requested', '1');
      locationPromptedRef.current = true;
    }
  }, []);

  const runPasskey = useCallback(async () => {
    if (!mfaChallenge) return;
    if (passkeyInFlightRef.current) {
      await passkeyInFlightRef.current;
      return;
    }

    const { register, authenticate, isSupported } = resolvePasskeyApi();
    const flow = mfaChallenge.enrollmentRequired ? 'enroll' : 'challenge';
    const operation = (async () => {
      setIsSubmitting(true);
      trackMfaEvent('mfa_method_begin', {
        method: 'passkey',
        flow,
        reason: mfaChallenge.reason,
      });

      if (typeof isSupported === 'function' && !isSupported()) {
        setError(
          `Passkeys are not supported on this ${Platform.OS === 'android' ? 'Android' : 'iOS'} device.`
        );
        trackMfaEvent('mfa_method_failure', {
          method: 'passkey',
          flow,
          reason: 'unsupported_device',
        });
        return;
      }

      if (!register || !authenticate) {
        setError('Passkey API is unavailable in this build.');
        trackMfaEvent('mfa_method_failure', {
          method: 'passkey',
          flow,
          reason: 'passkey_api_unavailable',
        });
        return;
      }

      try {
        if (mfaChallenge.enrollmentRequired) {
          logAndroidPasskey('begin_registration_start', {
            reason: mfaChallenge.reason,
          });
          let begin = await beginPasskeyRegistration({
            mfaToken: mfaChallenge.mfaToken,
            deviceName: Platform.OS === 'ios' ? 'iPhone' : 'Android Device',
          });

          if (begin.status >= 500 && Platform.OS === 'android') {
            begin = await beginPasskeyRegistration({
              mfaToken: mfaChallenge.mfaToken,
            });
          }

          if (begin.status !== 200) {
            throw new Error(
              (begin.response as any)?.message ?? 'Unable to begin passkey registration.'
            );
          }
          logAndroidPasskey('begin_registration_end', {
            status: begin.status,
          });
          const nativeRegistrationRequest = normalizePasskeyRegistrationRequestForNative(
            begin.response
          );
          logAndroidPasskey('native_prompt_start', {
            flow,
          });
          const credential = await register(nativeRegistrationRequest);
          logAndroidPasskey('native_prompt_end', {
            flow,
            success: true,
          });
          logAndroidPasskey('finish_registration_start', {
            reason: mfaChallenge.reason,
          });
          const finish = await finishPasskeyRegistration({
            mfaToken: mfaChallenge.mfaToken,
            response: normalizePasskeyRegistrationResponseForServer(credential),
          });
          if (finish.status !== 200) {
            throw new Error((finish.response as any)?.message ?? 'Unable to verify passkey.');
          }
          logAndroidPasskey('finish_registration_end', {
            status: finish.status,
          });
          trackMfaEvent('mfa_method_success', {
            method: 'passkey',
            flow,
          });
          await handleAuthResult(finish.response);
          return;
        }

        const runPasskeyLoginAttempt = async () => {
          const begin = await beginPasskeyLogin({ mfaToken: mfaChallenge.mfaToken });
          if (begin.status !== 200) {
            throw new Error(apiMessage(begin.response, 'Unable to begin passkey login.'));
          }
          const nativeAuthenticationRequest = normalizePasskeyAuthenticationRequestForNative(
            begin.response
          );
          logAndroidPasskey('native_prompt_start', {
            flow,
          });
          const assertion = await authenticate(nativeAuthenticationRequest);
          logAndroidPasskey('native_prompt_end', {
            flow,
            success: true,
          });
          const finish = await finishPasskeyLogin({
            mfaToken: mfaChallenge.mfaToken,
            response: normalizePasskeyAuthenticationResponseForServer(assertion),
          });
          if (finish.status !== 200) {
            throw passkeyLoginFinishError(finish.response);
          }
          return finish.response;
        };

        let authResult: unknown;
        try {
          authResult = await runPasskeyLoginAttempt();
        } catch (passkeyLoginError) {
          if (!isPasskeyChallengeMissingError(passkeyLoginError)) {
            throw passkeyLoginError;
          }
          logAndroidPasskey('stale_challenge_retry', {
            flow,
          });
          authResult = await runPasskeyLoginAttempt();
        }
        trackMfaEvent('mfa_method_success', {
          method: 'passkey',
          flow,
        });
        await handleAuthResult(authResult);
      } catch (mfaError: any) {
        logAndroidPasskey('native_prompt_end', {
          flow,
          success: false,
          message: mfaError?.message ?? String(mfaError),
        });
        if (isPasskeyCancellationError(mfaError)) {
          trackMfaEvent('mfa_method_cancelled', {
            method: 'passkey',
            flow,
            reason: 'user_cancelled',
          });
          setError('');
          return;
        }
        if (
          Platform.OS === 'ios' &&
          !mfaChallenge.enrollmentRequired &&
          mfaChallenge.availableMethods.includes('email') &&
          isPasskeyAssociationError(mfaError)
        ) {
          setSelectedMfaMethod('email');
          setIsPasskeyAssociationUnavailable(true);
          setShowOtherMfaOptions(true);
          setForm((prev) => ({ ...prev, code: '' }));
          setError('');
          trackMfaEvent('mfa_method_failure', {
            method: 'passkey',
            flow,
            reason: 'ios_webcredentials_association',
          });
          trackMfaEvent('mfa_fallback_selected', {
            from_method: 'passkey',
            to_method: 'email',
            enrollment_required: false,
            reason: mfaChallenge.reason,
          });
          trackMfaEvent('mfa_method_selected', {
            method: 'email',
            source: 'auto_fallback',
            enrollment_required: false,
            reason: mfaChallenge.reason,
            fallback: true,
            preferred_method: mfaChallenge.preferredMethod,
          });
          trackMfaEvent('mfa_method_begin', {
            method: 'email',
            flow,
            reason: mfaChallenge.reason,
          });
          try {
            await requestEmailMfaCode(mfaChallenge, PASSKEY_ASSOCIATION_FALLBACK_MESSAGE);
            trackMfaEvent('mfa_method_success', {
              method: 'email',
              flow,
              stage: 'send_code',
            });
            return;
          } catch (emailError: any) {
            trackMfaEvent('mfa_method_failure', {
              method: 'email',
              flow,
              reason: sanitizeAnalyticsReason(emailError?.message),
            });
            throw emailError;
          }
        }
        trackMfaEvent('mfa_method_failure', {
          method: 'passkey',
          flow,
          reason: sanitizeAnalyticsReason(mfaError?.message),
        });
        throw mfaError;
      }
    })();

    passkeyInFlightRef.current = operation;

    try {
      await operation;
    } finally {
      if (passkeyInFlightRef.current === operation) {
        passkeyInFlightRef.current = null;
      }
      setIsSubmitting(false);
    }
  }, [handleAuthResult, logAndroidPasskey, mfaChallenge, requestEmailMfaCode, trackMfaEvent]);

  useObservedEffect(() => {
    setIsPasskeyAssociationUnavailable(false);
  }, [mfaChallenge?.mfaToken]);

  const submitMfa = useCallback(async () => {
    if (!mfaChallenge) return;
    if (!mfaChallenge.mfaToken) {
      throw new Error('Missing MFA session');
    }

    if (selectedMfaMethod === 'passkey') {
      await runPasskey();
      return;
    }

    const flow = mfaChallenge.enrollmentRequired ? 'enroll' : 'challenge';
    trackMfaEvent('mfa_method_begin', {
      method: selectedMfaMethod,
      flow,
      reason: mfaChallenge.reason,
    });

    try {
      if (selectedMfaMethod === 'totp' && mfaChallenge.enrollmentRequired && !totpOtpauth) {
        const begin = await beginTotpSetup({ mfaToken: mfaChallenge.mfaToken });
        if (begin.status !== 200) {
          throw new Error(
            (begin.response as any)?.message ?? 'Unable to begin authenticator setup.'
          );
        }
        setTotpOtpauth((begin.response as any)?.otpauth ?? '');
        setShowOtherMfaOptions(true);
        setSuccessText('Enter the verification code from your authenticator app.');
        return;
      }

      if (!form.code.trim()) {
        setError('Enter your verification code.');
        return;
      }

      if (selectedMfaMethod === 'totp') {
        if (mfaChallenge.enrollmentRequired) {
          if (!totpOtpauth) {
            const begin = await beginTotpSetup({ mfaToken: mfaChallenge.mfaToken });
            if (begin.status !== 200) {
              throw new Error(
                (begin.response as any)?.message ?? 'Unable to begin authenticator setup.'
              );
            }
            setTotpOtpauth((begin.response as any)?.otpauth ?? '');
          }
          const verify = await verifyTotpSetup({
            mfaToken: mfaChallenge.mfaToken,
            code: form.code.trim(),
          });
          if (verify.status !== 200) {
            throw new Error((verify.response as any)?.message ?? 'Invalid authenticator code.');
          }
          trackMfaEvent('mfa_method_success', { method: selectedMfaMethod, flow });
          await handleAuthResult(verify.response);
          return;
        }

        const verify = await verifyTotpCode({
          mfaToken: mfaChallenge.mfaToken,
          code: form.code.trim(),
        });
        if (verify.status !== 200) {
          throw new Error((verify.response as any)?.message ?? 'Invalid authenticator code.');
        }
        trackMfaEvent('mfa_method_success', { method: selectedMfaMethod, flow });
        await handleAuthResult(verify.response);
        return;
      }

      if (selectedMfaMethod === 'backup') {
        const verify = await verifyBackupCode({
          mfaToken: mfaChallenge.mfaToken,
          code: form.code.trim(),
        });
        if (verify.status !== 200) {
          throw new Error((verify.response as any)?.message ?? 'Invalid backup code.');
        }
        trackMfaEvent('mfa_method_success', { method: selectedMfaMethod, flow });
        await handleAuthResult(verify.response);
        return;
      }

      const verify = await verifyEmailMfaCode({
        mfaToken: mfaChallenge.mfaToken,
        code: form.code.trim(),
      });
      if (verify.status !== 200) {
        throw new Error((verify.response as any)?.message ?? 'Invalid email code.');
      }
      trackMfaEvent('mfa_method_success', { method: selectedMfaMethod, flow });
      await handleAuthResult(verify.response);
    } catch (mfaError: any) {
      trackMfaEvent('mfa_method_failure', {
        method: selectedMfaMethod,
        flow,
        reason: sanitizeAnalyticsReason(mfaError?.message),
      });
      throw mfaError;
    }
  }, [
    form.code,
    handleAuthResult,
    mfaChallenge,
    runPasskey,
    selectedMfaMethod,
    totpOtpauth,
    trackMfaEvent,
  ]);

  const selectMethod = useCallback(
    async (method: MfaMethod) => {
      if (!mfaChallenge) return;
      const fallback = method !== mfaChallenge.preferredMethod;
      if (method === 'passkey' && isPasskeyAssociationUnavailable) {
        setError('');
        setSuccessText(PASSKEY_ASSOCIATION_FALLBACK_MESSAGE);
        return;
      }
      setSelectedMfaMethod(method);
      setError('');
      setSuccessText('');
      setForm((prev) => ({ ...prev, code: '' }));
      trackMfaEvent('mfa_method_selected', {
        method,
        source: 'user',
        enrollment_required: mfaChallenge.enrollmentRequired,
        reason: mfaChallenge.reason,
        fallback,
        preferred_method: mfaChallenge.preferredMethod,
      });
      if (fallback) {
        trackMfaEvent('mfa_fallback_selected', {
          from_method: mfaChallenge.preferredMethod,
          to_method: method,
          enrollment_required: mfaChallenge.enrollmentRequired,
          reason: mfaChallenge.reason,
        });
      }
      if (mfaChallenge.enrollmentRequired) {
        setShowOtherMfaOptions(method !== 'passkey');
      } else {
        setShowOtherMfaOptions(true);
      }

      if (method === 'email' && !mfaChallenge.enrollmentRequired) {
        trackMfaEvent('mfa_method_begin', {
          method: 'email',
          flow: mfaChallenge.enrollmentRequired ? 'enroll' : 'challenge',
          reason: mfaChallenge.reason,
        });
        try {
          await requestEmailMfaCode(mfaChallenge);
        } catch (emailError: any) {
          trackMfaEvent('mfa_method_failure', {
            method: 'email',
            flow: mfaChallenge.enrollmentRequired ? 'enroll' : 'challenge',
            reason: sanitizeAnalyticsReason(emailError?.message),
          });
          throw emailError;
        }
        trackMfaEvent('mfa_method_success', {
          method: 'email',
          flow: mfaChallenge.enrollmentRequired ? 'enroll' : 'challenge',
          stage: 'send_code',
        });
      }
    },
    [isPasskeyAssociationUnavailable, mfaChallenge, requestEmailMfaCode, trackMfaEvent]
  );

  const handleEmailAsMfaEnrollment = async () => {
    if (!mfaChallenge || !mfaChallenge.enrollmentRequired) {
      return;
    }

    if (submissionInFlightRef.current) {
      return;
    }

    submissionInFlightRef.current = true;
    setIsSubmitting(true);
    setError('');
    setSuccessText('');
    dispatch(setLoader(true));
    try {
      const fallback = mfaChallenge.preferredMethod !== 'email';
      trackMfaEvent('mfa_method_selected', {
        method: 'email',
        source: 'user',
        enrollment_required: true,
        reason: mfaChallenge.reason,
        fallback,
        preferred_method: mfaChallenge.preferredMethod,
      });
      if (fallback) {
        trackMfaEvent('mfa_fallback_selected', {
          from_method: selectedMfaMethod,
          to_method: 'email',
          enrollment_required: true,
          reason: mfaChallenge.reason,
        });
      }

      trackMfaEvent('mfa_method_begin', {
        method: 'email',
        flow: 'enroll',
        reason: mfaChallenge.reason,
      });

      const verify = await verifyEmailMfaCode({
        mfaToken: mfaChallenge.mfaToken,
        code: '',
      });

      if (verify.status !== 200) {
        throw new Error((verify.response as any)?.message ?? 'Unable to continue with email MFA.');
      }

      const accessToken = (verify.response as any)?.tokens?.accessToken;
      if (!accessToken) {
        throw new Error('Unable to continue with email MFA.');
      }

      trackMfaEvent('mfa_method_success', {
        method: 'email',
        flow: 'enroll',
      });

      completeLogin(accessToken);
      setTimeout(() => {
        Alert.alert(
          'Security Notice',
          'Email alone is not a secure method of 2 factor authentication. Please consider utilizing a Passkey or Authenticator to secure your account.'
        );
      }, 300);
    } catch (mfaError: any) {
      trackMfaEvent('mfa_method_failure', {
        method: 'email',
        flow: 'enroll',
        reason: sanitizeAnalyticsReason(mfaError?.message),
      });
      setError(mfaError?.message ?? 'Unable to continue with email MFA.');
    } finally {
      submissionInFlightRef.current = false;
      setIsSubmitting(false);
      dispatch(setLoader(false));
    }
  };

  const submitClerkEmailMfa = useCallback(async () => {
    if (!isSignInLoaded || !signIn || !setActive) {
      setError('Sign in is still loading. Please try again.');
      return;
    }

    if (!form.code.trim()) {
      setError('Enter your verification code.');
      return;
    }
    const normalizedEmail = form.email.trim().toLowerCase();

    const result = await signIn.attemptSecondFactor({
      strategy: 'email_code',
      code: form.code.trim(),
    });

    if (result.status !== 'complete' || !result.createdSessionId) {
      setError(getIncompleteClerkSignInMessage(result));
      return;
    }

    await setActive({ session: result.createdSessionId, navigate: handleClerkTaskNavigation });
    const accessToken = await getValidAccessToken({ forceRefreshClerk: true });
    if (!accessToken) {
      throw new Error('Unable to start Clerk session.');
    }

    await completeSyncedClerkLogin({
      accessToken,
      authMethod: 'password',
      email: normalizedEmail,
    });
  }, [
    completeSyncedClerkLogin,
    form.code,
    form.email,
    handleClerkTaskNavigation,
    isSignInLoaded,
    setActive,
    signIn,
  ]);

  const signInUser = useCallback(async () => {
    if (submissionInFlightRef.current) {
      return;
    }

    submissionInFlightRef.current = true;
    setIsSubmitting(true);
    try {
      setError('');
      setSuccessText('');
      dispatch(setLoader(true));

      if (backupCodes.length > 0 && pendingAccessToken) {
        completeLogin(pendingAccessToken);
        return;
      }

      if (clerkMfaEmail) {
        await submitClerkEmailMfa();
        return;
      }

      if (mfaChallenge) {
        await submitMfa();
        return;
      }

      if (!form.email || !form.password) {
        setError('Enter your email and password.');
        return;
      }
      if (!isSignInLoaded || !signIn || !setActive) {
        setError('Sign in is still loading. Please try again.');
        return;
      }

      await ensureLocationPermission();

      const normalizedEmail = form.email.trim().toLowerCase();
      const attemptClerkPasswordSignIn = () =>
        signIn.create({
          identifier: normalizedEmail,
          password: form.password,
          strategy: 'password',
        });

      let result;
      try {
        result = await attemptClerkPasswordSignIn();
      } catch (clerkError: any) {
        if (!isClerkIdentifierNotFoundError(clerkError)) {
          throw clerkError;
        }

        const migration = await migrateLegacyPasswordToClerk(
          {
            email: normalizedEmail,
            password: form.password,
          },
          {
            suppressErrorLog: true,
          }
        );

        if (migration?.status === 200 && migration.response?.migrated) {
          result = await attemptClerkPasswordSignIn();
        } else if (migration?.status === 401) {
          throw new Error(SIGN_IN_CREDENTIALS_MESSAGE);
        } else {
          const migrationMessage =
            (migration?.response as any)?.message ?? 'Unable to finish account migration.';
          throw new Error(migrationMessage);
        }
      }

      if (result.status === 'needs_second_factor') {
        const emailFactor = getClerkEmailSecondFactor(result);
        if (!emailFactor) {
          setError('Your account requires a second factor that is not available here.');
          return;
        }

        await signIn.prepareSecondFactor({
          strategy: 'email_code',
          emailAddressId: emailFactor.emailAddressId,
        });
        setForm((prev) => ({ ...prev, code: '' }));
        setClerkMfaEmail(emailFactor.safeIdentifier ?? normalizedEmail);
        setSuccessText(
          `A verification code was sent to ${emailFactor.safeIdentifier ?? normalizedEmail}.`
        );
        return;
      }

      if (result.status !== 'complete' || !result.createdSessionId) {
        setError(getIncompleteClerkSignInMessage(result));
        return;
      }

      await setActive({ session: result.createdSessionId, navigate: handleClerkTaskNavigation });
      const accessToken = await getValidAccessToken({ forceRefreshClerk: true });
      if (!accessToken) {
        throw new Error('Unable to start Clerk session.');
      }

      await completeSyncedClerkLogin({
        accessToken,
        authMethod: 'password',
        email: normalizedEmail,
      });
    } catch (e: any) {
      const fallbackMessage = getClerkErrorMessage(e);
      if (fallbackMessage.toLowerCase().includes('verify your email')) {
        navigation.navigate('ConfirmLogin', {
          showConfirmationEmailMessage: true,
          prefillEmail: form.email,
        } as any);
        return;
      }
      setError(getSignInErrorMessage(e));
    } finally {
      submissionInFlightRef.current = false;
      setIsSubmitting(false);
      dispatch(setLoader(false));
    }
  }, [
    backupCodes.length,
    completeLogin,
    completeSyncedClerkLogin,
    dispatch,
    ensureLocationPermission,
    form.email,
    form.password,
    isSignInLoaded,
    clerkMfaEmail,
    handleClerkTaskNavigation,
    mfaChallenge,
    navigation,
    pendingAccessToken,
    setActive,
    signIn,
    submitClerkEmailMfa,
    submitMfa,
  ]);

  const handleSocialLogin = useCallback(
    async (provider: 'google' | 'apple') => {
      if (socialLoading || mfaChallenge || clerkMfaEmail || submissionInFlightRef.current) return;
      const providerLabel = provider === 'google' ? 'Google' : 'Apple';
      setError('');
      setSuccessText('');
      dispatch(setLoader(true));
      setSocialLoading(true);
      try {
        await ensureLocationPermission();
        const { createdSessionId, setActive: activateSsoSession } = await startSSOFlow({
          strategy: provider === 'google' ? 'oauth_google' : 'oauth_apple',
          redirectUrl: 'onebodyapp://oauth-native-callback',
        } as any);

        if (!createdSessionId || !activateSsoSession) {
          setError(`Unable to sign in with ${providerLabel}. Please try again.`);
          return;
        }

        await activateSsoSession({
          session: createdSessionId,
          navigate: handleClerkTaskNavigation,
        });
        const accessToken = await getValidAccessToken({ forceRefreshClerk: true });
        if (!accessToken) {
          throw new Error('Unable to start Clerk session.');
        }

        await completeSyncedClerkLogin({
          accessToken,
          authMethod: 'social',
          bypassMandatoryMfaOnboarding: true,
        });
      } catch (e: any) {
        setError(
          e?.message ??
            `Unable to ${getSocialAuthActionLabel('login')} with ${providerLabel}. Please try again.`
        );
      } finally {
        dispatch(setLoader(false));
        setSocialLoading(false);
      }
    },
    [
      clerkMfaEmail,
      completeSyncedClerkLogin,
      dispatch,
      ensureLocationPermission,
      handleClerkTaskNavigation,
      mfaChallenge,
      socialLoading,
      startSSOFlow,
    ]
  );

  const methodButton = (method: MfaMethod, label: string) => {
    const isSelected = selectedMfaMethod === method;
    const isDisabled = isSubmitting || (method === 'passkey' && isPasskeyAssociationUnavailable);
    let labelColor = '#222';
    if (dark) {
      labelColor = '#ddd';
    }
    if (isSelected) {
      labelColor = '#fff';
    }

    return (
      <Pressable
        key={method}
        disabled={isDisabled}
        onPress={() => selectMethod(method)}
        style={{
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: isSelected ? '#41899f' : '#8b929a',
          backgroundColor: isSelected ? '#41899f' : 'transparent',
          opacity: isDisabled ? 0.6 : 1,
        }}
      >
        <StyledText style={{ color: labelColor }}>{label}</StyledText>
      </Pressable>
    );
  };

  const isClerkMfaPending = !!clerkMfaEmail;
  const isLoginMfa = isLoginMfaChallenge(mfaChallenge);
  const canUseEmailFallback =
    isLoginMfa &&
    selectedMfaMethod !== 'email' &&
    mfaChallenge?.availableMethods.includes('email') === true;
  const isLoginPasskeyScreen = isLoginMfa && selectedMfaMethod === 'passkey';
  const isLoginTotpScreen = isLoginMfa && selectedMfaMethod === 'totp';
  const isLoginEmailScreen = isLoginMfa && selectedMfaMethod === 'email';
  const showCodeInput =
    (mfaChallenge && selectedMfaMethod !== 'passkey' && selectedMfaMethod !== 'backup') ||
    isClerkMfaPending;
  const handleLoginEmailFallback = useCallback(() => {
    if (!mfaChallenge || !canUseEmailFallback) {
      return;
    }

    selectMethod('email').catch((e: any) => {
      setError(e?.message ?? 'Unable to send email verification code.');
    });
  }, [canUseEmailFallback, mfaChallenge, selectMethod]);
  const mfaHeaderText = (() => {
    if (!mfaChallenge && !isClerkMfaPending) {
      return 'Welcome back';
    }

    if (isLoginEmailScreen || isClerkMfaPending) {
      return 'Verify your email';
    }

    if (isLoginTotpScreen) {
      return 'Authenticator';
    }

    return 'Secure Sign-In';
  })();
  const subHeaderText = (() => {
    if (!mfaChallenge && !isClerkMfaPending) {
      return 'Sign in to your account';
    }

    if (isLoginEmailScreen || isClerkMfaPending) {
      return 'Enter the verification code sent to your email.';
    }

    if (isLoginTotpScreen) {
      return 'Enter the code from your authenticator app.';
    }

    if (mfaChallenge?.enrollmentRequired) {
      return 'Set up multi-factor authentication to continue';
    }

    return 'Confirm your identity to continue.';
  })();
  const primaryButtonText = (() => {
    if (backupCodes.length > 0 && pendingAccessToken) {
      return 'I Saved My Backup Codes';
    }

    if (!mfaChallenge && !isClerkMfaPending) {
      return 'Sign In';
    }

    if (isClerkMfaPending) {
      return 'Verify';
    }

    if (selectedMfaMethod !== 'passkey') {
      return 'Verify';
    }

    if (mfaChallenge?.enrollmentRequired) {
      return 'Set Up Passkey';
    }

    return 'Verify with Passkey';
  })();
  const showMfaLaunchScreen = !!mfaChallenge && mfaChallenge.enrollmentRequired;
  const showPasskeyLoginScreen = isLoginPasskeyScreen;
  const showMfaHeroScreen = showMfaLaunchScreen || showPasskeyLoginScreen;
  const isPasskeyEnrollmentScreen =
    showMfaLaunchScreen && selectedMfaMethod === 'passkey' && !showOtherMfaOptions;
  const isPasskeyLoginScreen = showPasskeyLoginScreen;
  const isTotpEnrollmentScreen = showMfaLaunchScreen && selectedMfaMethod === 'totp';
  const totpSetupCode = useMemo(() => extractTotpSetupCode(totpOtpauth), [totpOtpauth]);
  const handleCopyManualTotpCode = useCallback(() => {
    if (!totpSetupCode) {
      return;
    }
    clipboardRef.current?.copy(totpSetupCode);
    setSuccessText('Setup code copied to clipboard.');
  }, [totpSetupCode]);
  const handleBackFromMfaLaunch = useCallback(() => {
    setMfaChallenge(null);
    setSelectedMfaMethod('passkey');
    setShowOtherMfaOptions(false);
    setTotpOtpauth('');
    setBackupCodes([]);
    setPendingAccessToken('');
    postClerkMfaAccessTokenRef.current = '';
    clearPendingLoginMfa().catch(() => undefined);
    setIsPasskeyAssociationUnavailable(false);
    setError('');
    setSuccessText('');
    setIsSubmitting(false);
    submissionInFlightRef.current = false;
    passkeyInFlightRef.current = null;
  }, []);
  const handleBackFromClerkMfa = useCallback(() => {
    setClerkMfaEmail('');
    setForm((prev) => ({ ...prev, code: '' }));
    setError('');
    setSuccessText('');
    setIsSubmitting(false);
    submissionInFlightRef.current = false;
  }, []);
  const handleMfaLaunchBack = useCallback(() => {
    if (selectedMfaMethod === 'totp') {
      setSelectedMfaMethod('passkey');
      setShowOtherMfaOptions(false);
      setError('');
      setSuccessText('');
      setForm((prev) => ({ ...prev, code: '' }));
      return;
    }

    handleBackFromMfaLaunch();
  }, [handleBackFromMfaLaunch, selectedMfaMethod]);
  const launchPrimaryButtonText = (() => {
    if (backupCodes.length > 0 && pendingAccessToken) {
      return 'I Saved My Backup Codes';
    }
    if (isPasskeyLoginScreen) {
      return 'Verify with Passkey';
    }
    if (selectedMfaMethod === 'totp') {
      return totpOtpauth ? 'Verify Authenticator Code' : 'Set up Authenticator App';
    }
    return 'Set up your Passkey';
  })();
  const launchHeaderTitle = isTotpEnrollmentScreen ? 'Authenticator' : 'Passkeys';
  const launchTitleText = (() => {
    if (isPasskeyLoginScreen) {
      return 'Verify with your Passkey';
    }
    if (isPasskeyEnrollmentScreen) {
      return 'Create a Passkey';
    }
    return 'Set up your authenticator app';
  })();
  const launchDescriptionText = (() => {
    if (isPasskeyLoginScreen) {
      return 'Use the passkey you set up during account security to finish signing in.';
    }
    if (isPasskeyEnrollmentScreen) {
      return 'Passkeys uses the same method as unlocking your phone, making your account nearly impossible to hack.';
    }
    return 'Use your authenticator app to generate verification codes each time you sign in.';
  })();
  let heroAnimationSource = passkeyHeroAnimation;
  if (Platform.OS === 'android') {
    heroAnimationSource = passkeyHeroAnimationAndroid;
  }
  if (useAndroidFallbackHero) {
    heroAnimationSource = passkeyHeroFallbackAnimation;
  }
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 250);
  }, []);
  const refreshControl = React.createElement(RefreshControl, {
    refreshing: isRefreshing,
    onRefresh: handleRefresh,
  });

  useObservedEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    if (
      Platform.OS === 'android' &&
      showMfaHeroScreen &&
      !hasPasskeyHeroLoadedRef.current &&
      !useAndroidFallbackHero
    ) {
      timeout = setTimeout(() => {
        if (!hasPasskeyHeroLoadedRef.current) {
          setUseAndroidFallbackHero(true);
        }
      }, 1800);
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [showMfaHeroScreen, useAndroidFallbackHero]);

  useObservedEffect(() => {
    if (Platform.OS === 'ios') {
      navigation.setOptions({ headerShown: !showMfaHeroScreen });
    }

    return () => {
      if (Platform.OS === 'ios') {
        navigation.setOptions({ headerShown: true });
      }
    };
  }, [navigation, showMfaHeroScreen]);

  useObservedEffect(() => {
    onMfaLaunchScreenChange?.(showMfaHeroScreen);

    if (Platform.OS !== 'android' || !showMfaHeroScreen) {
      return () => {
        onMfaLaunchScreenChange?.(false);
      };
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleMfaLaunchBack();
      return true;
    });

    return () => {
      subscription.remove();
      onMfaLaunchScreenChange?.(false);
    };
  }, [handleMfaLaunchBack, onMfaLaunchScreenChange, showMfaHeroScreen]);

  if (showMfaHeroScreen) {
    return (
      <View style={styles.screenContainer}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.heroScrollContent}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          alwaysBounceVertical
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 12,
              marginBottom: 8,
            }}
          >
            <Pressable
              disabled={isSubmitting}
              onPress={handleMfaLaunchBack}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                justifyContent: 'center',
                alignItems: 'center',
                opacity: isSubmitting ? 0.6 : 1,
              }}
            >
              <Ionicons name="arrow-back" size={26} color="#126B87" />
            </Pressable>
            <StyledText
              style={{
                flex: 1,
                textAlign: 'center',
                marginRight: 40,
                fontFamily: 'Rubik',
                fontWeight: '700',
                fontSize: 18,
                color: dark ? '#FFFFFF' : '#0e181b',
              }}
            >
              {launchHeaderTitle}
            </StyledText>
          </View>

          <LottieView
            key={useAndroidFallbackHero ? 'mfa-hero-fallback' : 'mfa-hero-primary'}
            source={heroAnimationSource}
            autoPlay
            loop
            colorFilters={Platform.OS === 'ios' ? oneBodyLottieColorFilters : undefined}
            renderMode={Platform.OS === 'android' ? 'SOFTWARE' : 'AUTOMATIC'}
            hardwareAccelerationAndroid={false}
            enableSafeModeAndroid
            cacheComposition={false}
            onAnimationLoaded={() => {
              hasPasskeyHeroLoadedRef.current = true;
            }}
            onAnimationFailure={(errorMessage) => {
              if (Platform.OS === 'android') {
                setUseAndroidFallbackHero(true);
              }
              console.warn('MFA hero animation failed to load', errorMessage);
            }}
            style={{
              width: '100%',
              height: 320,
              marginBottom: 24,
              alignSelf: 'center',
            }}
            resizeMode="contain"
          />

          <StyledText
            style={{
              fontFamily: 'Rubik',
              fontWeight: '700',
              fontSize: 26,
              lineHeight: 34,
              color: dark ? '#FFFFFF' : '#0e181b',
              marginBottom: 12,
            }}
          >
            {launchTitleText}
          </StyledText>

          <StyledText
            style={{
              fontFamily: 'Lato',
              fontWeight: '500',
              fontSize: 16,
              lineHeight: 26,
              color: dark ? '#A7B7BC' : '#4e6a71',
              marginBottom: 30,
            }}
          >
            {launchDescriptionText}
          </StyledText>

          {isPasskeyEnrollmentScreen ? (
            <View style={{ rowGap: 20, marginBottom: 28 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: 'rgba(17, 106, 136, 0.12)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 14,
                  }}
                >
                  <Ionicons name="finger-print-outline" size={24} color="#126B87" />
                </View>
                <View style={{ flex: 1 }}>
                  <StyledText
                    style={{
                      fontFamily: 'Rubik',
                      fontWeight: '700',
                      fontSize: 16,
                      lineHeight: 22,
                      color: dark ? '#FFFFFF' : '#0e181b',
                    }}
                  >
                    Sign in using biometrics
                  </StyledText>
                  <StyledText
                    style={{
                      fontFamily: 'Lato',
                      fontSize: 14,
                      lineHeight: 20,
                      color: dark ? '#A7B7BC' : '#4e6a71',
                    }}
                  >
                    Quick access with FaceID or TouchID
                  </StyledText>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: 'rgba(17, 106, 136, 0.12)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 14,
                  }}
                >
                  <Ionicons name="sync-outline" size={24} color="#126B87" />
                </View>
                <View style={{ flex: 1 }}>
                  <StyledText
                    style={{
                      fontFamily: 'Rubik',
                      fontWeight: '700',
                      fontSize: 16,
                      lineHeight: 22,
                      color: dark ? '#FFFFFF' : '#0e181b',
                    }}
                  >
                    Syncs across your devices
                  </StyledText>
                  <StyledText
                    style={{
                      fontFamily: 'Lato',
                      fontSize: 14,
                      lineHeight: 20,
                      color: dark ? '#A7B7BC' : '#4e6a71',
                    }}
                  >
                    Available on all your logged-in platforms
                  </StyledText>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: 'rgba(17, 106, 136, 0.12)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 14,
                  }}
                >
                  <Ionicons name="shield-checkmark-outline" size={24} color="#126B87" />
                </View>
                <View style={{ flex: 1 }}>
                  <StyledText
                    style={{
                      fontFamily: 'Rubik',
                      fontWeight: '700',
                      fontSize: 16,
                      lineHeight: 22,
                      color: dark ? '#FFFFFF' : '#0e181b',
                    }}
                  >
                    Instant and secure
                  </StyledText>
                  <StyledText
                    style={{
                      fontFamily: 'Lato',
                      fontSize: 14,
                      lineHeight: 20,
                      color: dark ? '#A7B7BC' : '#4e6a71',
                    }}
                  >
                    End-to-end encryption for your safety
                  </StyledText>
                </View>
              </View>
            </View>
          ) : null}

          {isTotpEnrollmentScreen && totpOtpauth ? (
            <View
              style={{
                marginBottom: 14,
                borderRadius: 16,
                paddingHorizontal: 14,
                paddingTop: 14,
                paddingBottom: 10,
                backgroundColor: dark ? '#202328' : '#EFF2F4',
              }}
            >
              <StyledText
                style={{
                  color: dark ? '#FFFFFF' : '#0f172a',
                  fontFamily: 'Rubik',
                  fontWeight: '700',
                  fontSize: 18,
                }}
              >
                Step 2: Connect your authenticator app
              </StyledText>
              <View
                style={{
                  height: 1,
                  backgroundColor: dark ? '#334155' : '#d4dbe1',
                  marginVertical: 10,
                }}
              />
              <StyledText style={{ color: dark ? '#D4D8DC' : '#334155', fontSize: 15 }}>
                Use your authenticator app to scan this code.
              </StyledText>

              <View
                style={{
                  marginTop: 12,
                  marginBottom: 12,
                  alignItems: 'flex-start',
                }}
              >
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    padding: 8,
                    borderRadius: 10,
                  }}
                >
                  <QRCode value={totpOtpauth} size={126} />
                </View>
              </View>

              <StyledText
                style={{
                  color: dark ? '#D4D8DC' : '#334155',
                  fontSize: 12,
                  marginBottom: 3,
                }}
              >
                Setup code
              </StyledText>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <StyledText
                  style={{
                    color: dark ? '#FFFFFF' : '#0f172a',
                    fontFamily: 'Rubik',
                    fontWeight: '600',
                    fontSize: 16,
                  }}
                >
                  {totpSetupCode}
                </StyledText>
                <Pressable
                  onPress={handleCopyManualTotpCode}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{
                    marginLeft: 8,
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="copy-outline" size={36} color="#126B87" />
                </Pressable>
              </View>
            </View>
          ) : null}

          {isTotpEnrollmentScreen && (
            <View style={styles.inputSpacer}>
              <StyledText style={styles.inputLabel}>Verification code</StyledText>
              <StyledTextInput
                placeholder="Enter code"
                placeholderTextColor={dark ? '#999DA1' : '#838584'}
                autoCapitalize="characters"
                keyboardType="number-pad"
                value={form.code}
                backgroundColor={dark ? '#202328' : '#F2F3F3'}
                inputWrapperStyle={styles.inputWrapper}
                onChangeText={(v) => setForm((prev) => ({ ...prev, code: v }))}
              />
            </View>
          )}

          {!!successText && <StyledText style={styles.successAlertText}>{successText}</StyledText>}
          {!!error && <StyledText style={styles.fieldError}>{error}</StyledText>}

          {backupCodes.length > 0 ? (
            <View style={{ marginTop: 8, marginBottom: 8, rowGap: 6 }}>
              {backupCodes.map((code) => (
                <StyledText
                  key={code}
                  style={{ color: dark ? '#fff' : '#111827', fontWeight: '700' }}
                >
                  {code}
                </StyledText>
              ))}
            </View>
          ) : null}

          <Pressable
            disabled={isSubmitting}
            onPress={() => {
              if (backupCodes.length > 0 && pendingAccessToken) {
                completeLogin(pendingAccessToken);
                return;
              }
              signInUser();
            }}
            style={[styles.heroPrimaryBtn, isSubmitting ? styles.heroPrimaryBtnDisabled : null]}
          >
            <StyledText style={styles.heroPrimaryBtnText}>{launchPrimaryButtonText}</StyledText>
          </Pressable>

          {isPasskeyLoginScreen && canUseEmailFallback ? (
            <Pressable disabled={isSubmitting} onPress={handleLoginEmailFallback}>
              <StyledText
                style={{
                  textAlign: 'center',
                  color: dark ? '#A7B7BC' : '#4e6a71',
                  fontFamily: 'Lato',
                  fontWeight: '700',
                  fontSize: 16,
                }}
              >
                {getLoginMfaFallbackCopy(selectedMfaMethod)}
              </StyledText>
            </Pressable>
          ) : null}

          {isPasskeyEnrollmentScreen && mfaChallenge?.availableMethods.includes('totp') ? (
            <Pressable
              disabled={isSubmitting}
              onPress={() => {
                selectMethod('totp').catch((e: any) => {
                  setError(e?.message ?? 'Unable to switch to authenticator.');
                });
              }}
            >
              <StyledText
                style={{
                  textAlign: 'center',
                  color: dark ? '#A7B7BC' : '#4e6a71',
                  fontFamily: 'Lato',
                  fontWeight: '700',
                  fontSize: 16,
                }}
              >
                Use other MFA options
              </StyledText>
            </Pressable>
          ) : null}

          {isTotpEnrollmentScreen && mfaChallenge?.availableMethods.includes('email') ? (
            <Pressable
              disabled={isSubmitting}
              onPress={() => {
                handleEmailAsMfaEnrollment().catch((e: any) => {
                  setError(e?.message ?? 'Unable to continue with email MFA.');
                });
              }}
            >
              <StyledText
                style={{
                  textAlign: 'center',
                  color: dark ? '#A7B7BC' : '#4e6a71',
                  fontFamily: 'Lato',
                  fontWeight: '700',
                  fontSize: 16,
                }}
              >
                Use email as MFA (less secure)
              </StyledText>
            </Pressable>
          ) : null}
          <CustomClipboard ref={clipboardRef} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scrollContent}
        refreshControl={refreshControl}
      >
        <View style={[styles.headerFrame, { marginTop: 28 }]}>
          <StyledText style={styles.welcomeText}>{mfaHeaderText}</StyledText>
          <StyledText style={styles.subHeaderText}>{subHeaderText}</StyledText>
        </View>

        <View style={styles.cardContainer}>
          {!mfaChallenge ? (
            <View style={styles.newAccountRow}>
              <StyledText style={styles.newAccountText}>New to One Body? </StyledText>
              <Pressable
                onPress={() => {
                  navigation.navigate('AccountType' as any);
                }}
              >
                <StyledText style={styles.newAccountLink}>Create an account</StyledText>
              </Pressable>
            </View>
          ) : null}

          {!mfaChallenge || isClerkMfaPending ? (
            <View style={styles.inputSpacer}>
              <StyledText style={styles.inputLabel}>Email</StyledText>
              <StyledTextInput
                placeholder="Email Address"
                placeholderTextColor={dark ? '#999DA1' : '#838584'}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!mfaChallenge && !isClerkMfaPending}
                value={form.email}
                backgroundColor={dark ? '#202328' : '#F2F3F3'}
                inputWrapperStyle={styles.inputWrapper}
                onChangeText={(v) => setForm((prev) => ({ ...prev, email: v.trim() }))}
              />
            </View>
          ) : null}

          {!mfaChallenge && !isClerkMfaPending ? (
            <View style={styles.inputSpacer}>
              <StyledText style={styles.inputLabel}>Password</StyledText>
              <StyledTextInput
                placeholder="Password"
                placeholderTextColor={dark ? '#999DA1' : '#838584'}
                secureTextEntry={hidePass}
                value={form.password}
                backgroundColor={dark ? '#202328' : '#F2F3F3'}
                inputWrapperStyle={styles.inputWrapper}
                onChangeText={(v) => setForm((prev) => ({ ...prev, password: v }))}
                rightIcon={
                  <Ionicons
                    name={hidePass ? 'eye-outline' : 'eye-off-outline'}
                    size={22}
                    color="#41dbe1"
                    onPress={() => setHidePass(!hidePass)}
                    style={{ alignSelf: 'center' }}
                  />
                }
              />
            </View>
          ) : null}

          {isClerkMfaPending ? (
            <View style={{ marginTop: 8, rowGap: 10 }}>
              <StyledText style={{ color: dark ? '#cdd0d4' : '#4b5563' }}>
                We sent a verification code to {clerkMfaEmail}.
              </StyledText>
              <View style={styles.inputSpacer}>
                <StyledText style={styles.inputLabel}>Verification code</StyledText>
                <StyledTextInput
                  placeholder="Enter code"
                  placeholderTextColor={dark ? '#999DA1' : '#838584'}
                  autoCapitalize="characters"
                  keyboardType="number-pad"
                  value={form.code}
                  backgroundColor={dark ? '#202328' : '#F2F3F3'}
                  inputWrapperStyle={styles.inputWrapper}
                  onChangeText={(v) => setForm((prev) => ({ ...prev, code: v }))}
                />
              </View>
              <Pressable disabled={isSubmitting} onPress={handleBackFromClerkMfa}>
                <StyledText style={{ color: dark ? '#9aa4af' : '#6b7280', fontSize: 12 }}>
                  Back to sign in
                </StyledText>
              </Pressable>
            </View>
          ) : null}

          {mfaChallenge && !isClerkMfaPending && isLoginMfa ? (
            <View style={{ marginTop: 8, rowGap: 12 }}>
              {isLoginEmailScreen ? (
                <StyledText style={{ color: dark ? '#cdd0d4' : '#4b5563' }}>
                  We sent a verification code to {mfaChallenge.emailMasked}.
                </StyledText>
              ) : null}

              {isLoginTotpScreen ? (
                <StyledText style={{ color: dark ? '#cdd0d4' : '#4b5563' }}>
                  Open your authenticator app and enter the 6-digit code.
                </StyledText>
              ) : null}

              {showCodeInput ? (
                <View style={styles.inputSpacer}>
                  <StyledText style={styles.inputLabel}>Verification code</StyledText>
                  <StyledTextInput
                    placeholder="Enter code"
                    placeholderTextColor={dark ? '#999DA1' : '#838584'}
                    autoCapitalize="characters"
                    keyboardType="number-pad"
                    value={form.code}
                    backgroundColor={dark ? '#202328' : '#F2F3F3'}
                    inputWrapperStyle={styles.inputWrapper}
                    onChangeText={(v) => setForm((prev) => ({ ...prev, code: v }))}
                  />
                </View>
              ) : null}

              {isLoginTotpScreen && canUseEmailFallback ? (
                <Pressable disabled={isSubmitting} onPress={handleLoginEmailFallback}>
                  <StyledText
                    style={{
                      color: dark ? '#9aa4af' : '#6b7280',
                      fontSize: 13,
                      fontFamily: 'Lato',
                      fontWeight: '700',
                    }}
                  >
                    {getLoginMfaFallbackCopy(selectedMfaMethod)}
                  </StyledText>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {mfaChallenge && !isClerkMfaPending && !isLoginMfa ? (
            <View style={{ marginTop: 8, rowGap: 10 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {mfaChallenge.enrollmentRequired ? (
                  <>
                    {mfaChallenge.availableMethods.includes('passkey')
                      ? methodButton('passkey', 'Passkey')
                      : null}
                    {mfaChallenge.availableMethods.includes('totp')
                      ? methodButton('totp', 'Authenticator')
                      : null}
                    {mfaChallenge.availableMethods.includes('email')
                      ? methodButton('email', 'Email')
                      : null}
                  </>
                ) : (
                  <>
                    {mfaChallenge.availableMethods.includes('passkey')
                      ? methodButton('passkey', 'Passkey')
                      : null}
                    {mfaChallenge.availableMethods.includes('totp')
                      ? methodButton('totp', 'Authenticator')
                      : null}
                    {mfaChallenge.availableMethods.includes('email')
                      ? methodButton('email', 'Email')
                      : null}
                    {mfaChallenge.availableMethods.includes('backup')
                      ? methodButton('backup', 'Backup Code')
                      : null}
                  </>
                )}
              </View>

              {selectedMfaMethod === 'passkey' ? (
                <StyledText style={{ color: dark ? '#cdd0d4' : '#4b5563' }}>
                  Use Face ID, Touch ID, or device biometrics to verify.
                </StyledText>
              ) : null}

              {selectedMfaMethod === 'totp' && mfaChallenge.enrollmentRequired ? (
                <StyledText style={{ color: dark ? '#cdd0d4' : '#4b5563' }}>
                  Add this key in your authenticator app: {totpOtpauth || 'Tap Verify to generate'}
                </StyledText>
              ) : null}

              {mfaChallenge.enrollmentRequired && mfaChallenge.availableMethods.includes('totp') ? (
                <Pressable
                  disabled={isSubmitting}
                  onPress={() => selectMethod(selectedMfaMethod === 'totp' ? 'passkey' : 'totp')}
                >
                  <StyledText style={{ color: dark ? '#9aa4af' : '#6b7280', fontSize: 12 }}>
                    {selectedMfaMethod === 'totp'
                      ? 'Use passkey instead (recommended).'
                      : 'Prefer an authenticator app? Use TOTP instead.'}
                  </StyledText>
                </Pressable>
              ) : null}

              {mfaChallenge.enrollmentRequired ? (
                <StyledText style={{ color: dark ? '#818a94' : '#9ca3af', fontSize: 12 }}>
                  Email verification remains available, but passkey is more secure.
                </StyledText>
              ) : null}

              {showCodeInput ? (
                <View style={styles.inputSpacer}>
                  <StyledText style={styles.inputLabel}>
                    {selectedMfaMethod === 'backup' ? 'Backup code' : 'Verification code'}
                  </StyledText>
                  <StyledTextInput
                    placeholder={
                      selectedMfaMethod === 'backup' ? 'Enter backup code' : 'Enter code'
                    }
                    placeholderTextColor={dark ? '#999DA1' : '#838584'}
                    autoCapitalize="characters"
                    keyboardType={selectedMfaMethod === 'backup' ? 'default' : 'number-pad'}
                    value={form.code}
                    backgroundColor={dark ? '#202328' : '#F2F3F3'}
                    inputWrapperStyle={styles.inputWrapper}
                    onChangeText={(v) => setForm((prev) => ({ ...prev, code: v }))}
                  />
                </View>
              ) : null}
            </View>
          ) : null}

          {!!successText && <StyledText style={styles.successAlertText}>{successText}</StyledText>}
          {!!error && <StyledText style={styles.fieldError}>{error}</StyledText>}

          {backupCodes.length > 0 ? (
            <View style={{ marginTop: 8, marginBottom: 8, rowGap: 6 }}>
              {backupCodes.map((code) => (
                <StyledText
                  key={code}
                  style={{ color: dark ? '#fff' : '#111827', fontWeight: '700' }}
                >
                  {code}
                </StyledText>
              ))}
            </View>
          ) : null}

          <Button
            text={primaryButtonText}
            btnStyle={styles.primaryBtn}
            btnTextStyle={styles.primaryBtnText}
            onPress={signInUser}
            disabled={isSubmitting}
          />

          {!mfaChallenge && !isClerkMfaPending ? (
            <View style={styles.socialSection}>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <StyledText style={styles.orText}>Or</StyledText>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialIconsRow}>
                <Pressable
                  style={styles.socialBtn}
                  disabled={socialLoading}
                  onPress={() => handleSocialLogin('google')}
                  accessibilityLabel="Continue with Google"
                >
                  <Image source={googleIcon} style={styles.socialIcon} />
                </Pressable>

                {Platform.OS === 'ios' ? (
                  <Pressable
                    style={styles.socialBtn}
                    disabled={socialLoading}
                    onPress={() => handleSocialLogin('apple')}
                    accessibilityLabel="Continue with Apple"
                  >
                    <Ionicons name="logo-apple" size={30} color={dark ? '#FFFFFF' : '#212121'} />
                  </Pressable>
                ) : null}
              </View>

              <Pressable
                onPress={() => {
                  navigation.navigate('ForgotPassword' as any, { email: form.email } as any);
                }}
              >
                <StyledText style={styles.forgotPasswordText}>Forgot Password?</StyledText>
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

export default LoginComponent;
