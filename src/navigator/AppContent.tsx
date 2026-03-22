// src/AppContent.tsx
import {
  DarkTheme,
  DefaultTheme,
  LinkingOptions,
  NavigationContainer,
  getStateFromPath as getStateFromPathDefault,
  useNavigationContainerRef,
  CommonActions,
} from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  BackHandler,
  Linking,
  useColorScheme,
  Animated,
  Easing,
  Dimensions,
  Platform,
  Pressable,
  type ViewStyle,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useToast } from 'react-native-toast-notifications';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  getMessaging,
  getInitialNotification,
  onNotificationOpenedApp,
} from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';
import { ReactionProvider } from 'react-native-reactions';
import { GiphySDK } from '@giphy/react-native-sdk';
import LottieSplashScreen from 'react-native-lottie-splash-screen';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { RootState } from '../redux/reducers/rootReducer'; // Adjust path relative to AppContent.tsx
import { setLoginData, getProfile, logout } from '../redux/actions/AuthActions'; // Adjust path
import { clearAuthTokens, getValidAccessToken } from '../services/authTokens';
import { beginAuthenticatedMfaOnboarding } from '../services/login';

import ForgotPassword from '../screens/forgotPassword'; // Adjust path
import Login from '../screens/login'; // Adjust path
import Signup from '../screens/signup'; // Adjust path

import { MainStackParamList } from './types'; // Adjust path

import Intro from '../screens/intro'; // Adjust path

import { Colors } from '../styles'; // Adjust path
import AccountType from '../screens/accountType'; // Adjust path
import ConfirmLogin from '../screens/login/ConfirmLogin'; // Adjust path

import DrawerNav from './DrawerStack';
import NewPost from '../screens/post/NewPost'; // Adjust path
import UploadImage from '../screens/post/UploadImage'; // Adjust path
import SinglePost from '../screens/post/Single'; // Adjust path
import RssPost from '../screens/post/RssPost'; // Adjust path
import ReportPost from '../screens/post/ReportPost'; // Adjust path
import ReportStatus from '../screens/post/ReportStatus'; // Adjust path
import Watch from '../screens/home/watch';
import { headerOptions } from './global'; // Adjust path
import { PostType } from '@/utils/types';
import {
  clearCachedPushToken,
  displayAndroidLocalNotificationIfNeeded,
  disablePushNotifications,
  enablePushNotifications,
  subscribeToForegroundPushMessages,
  subscribeToPushTokenRefresh,
} from '@/src/services/notification/pushNotificationService';
import { queueRemoteNotificationPayload } from '@/src/services/notification/pushNotificationStorage';
import { ensureChatReady } from '@/src/services/chat/chatClient';
import { disconnectChatSocket } from '@/src/services/chat/socketClient';
import { resumePendingVideoUploads } from '@/src/services/videoProcessing/videoUploadQueue';
import useMountEffect from '@/src/hooks/useMountEffect';

// Lazy load VideoPost to prevent rn-fetch-blob from being imported at app startup
// This fixes Android crash: "Cannot read property 'DocumentDir' of null"
const LazyVideoPost = React.lazy(() => import('../screens/post/VideoPost'));
function VideoPost({ navigation, route }: { navigation: any; route: any }) {
  return (
    <React.Suspense fallback={<ActivityIndicator size="large" />}>
      <LazyVideoPost navigation={navigation} route={route} />
    </React.Suspense>
  );
}

GiphySDK.configure({ apiKey: 'dZgwmqczMQ90a2MtLZ87SchEGITNJlPw' });
const MainStack = createNativeStackNavigator<MainStackParamList>();
const PUBLIC_ROUTES = new Set(['Intro', 'Login', 'SignUp', 'ForgotPassword', 'ConfirmLogin']);

// This component now contains all the logic that was in your original Main.tsx
function AppContent() {
  // Renamed from 'Main' to 'AppContent'
  const toast = useToast();
  const loader = useSelector((state: RootState) => state.general.loader);
  const authState = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  const [initializing, setInitializing] = useState<boolean>(true);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [navigationReady, setNavigationReady] = useState<boolean>(false);
  const screenHeight = useRef(Dimensions.get('window').height).current;
  const firebaseMessaging = getMessaging();
  const navigationRef = useNavigationContainerRef<MainStackParamList>();
  const routeNameRef = useRef<string | undefined>(undefined);
  const lastNavigationRef = useRef<{ route: string; timestamp: number } | null>(null);
  const ignoreAuthLinksRef = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const overlayTranslate = useRef(new Animated.Value(0)).current;
  const appStateRef = useRef(AppState.currentState);
  const token = authState.userToken;
  const hasFetchedProfileRef = useRef(false);
  const mfaOnboardingRequestedUserRef = useRef<string | null>(null);
  const mfaOnboardingInFlightRef = useRef(false);
  const scheme = useColorScheme();
  const handleConfirmBackPress = useCallback(async () => {
    await clearAuthTokens();
    dispatch(logout());
    navigationRef.navigate('Intro');
  }, [dispatch, navigationRef]);
  const confirmBackStyle = useMemo<ViewStyle>(
    () => ({
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: scheme === 'dark' ? '#1B1B1B' : '#FFFFFF',
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
    }),
    [scheme]
  );
  const renderConfirmBackButton = useCallback(
    () => (
      <Pressable
        onPress={handleConfirmBackPress}
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={8}
        style={confirmBackStyle}
      >
        <MaterialCommunityIcons
          name="chevron-left"
          size={30}
          color={Colors.primary.brand}
          style={{ marginLeft: 2 }}
        />
      </Pressable>
    ),
    [confirmBackStyle, handleConfirmBackPress]
  );
  const beginMandatoryMfaGate = useCallback(
    async (profileData: any) => {
      if (!token) {
        return;
      }

      const userId = profileData?._id || profileData?.id;
      if (!userId) {
        return;
      }

      if (mfaOnboardingInFlightRef.current || mfaOnboardingRequestedUserRef.current === userId) {
        return;
      }

      mfaOnboardingInFlightRef.current = true;
      try {
        const res = await beginAuthenticatedMfaOnboarding(token);
        if (res.status === 200 && (res.response as any)?.mfaRequired) {
          mfaOnboardingRequestedUserRef.current = userId;
          navigationRef.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                {
                  name: 'Login',
                  params: {
                    initialMfaChallenge: res.response as any,
                    prefillEmail: profileData?.email,
                    mfaOnboardingFlow: true,
                  },
                } as any,
              ],
            })
          );
          return;
        }

        if (res.status === 200) {
          mfaOnboardingRequestedUserRef.current = userId;
        }
      } catch (error) {
        if (__DEV__) {
          console.log('[AppContent MFA Onboarding] Failed to begin onboarding', error);
        }
      } finally {
        mfaOnboardingInFlightRef.current = false;
      }
    },
    [navigationRef, token]
  );

  useEffect(() => {
    toast.hideAll();

    if (loader) {
      toast.show(<ActivityIndicator color="#12D2D9" />, {
        placement: 'top',
      });
    } else {
      toast.hideAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loader]);

  useMountEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const accessToken = await getValidAccessToken();
        if (cancelled) return;

        if (accessToken) {
          dispatch(setLoginData({ token: accessToken }));
        } else {
          await clearAuthTokens();
          dispatch(logout());
        }
      } finally {
        if (!cancelled) {
          setAuthChecked(true);
          setInitializing(false);
          setTimeout(() => {
            LottieSplashScreen.hide();
          }, 375);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  });

  const refreshTokenOnResume = useCallback(async () => {
    try {
      const accessToken = await getValidAccessToken();
      if (accessToken && accessToken !== token) {
        dispatch(setLoginData({ token: accessToken }));
      } else if (!accessToken && token) {
        await clearAuthTokens();
        dispatch(logout());
      }
    } catch (error) {
      if (__DEV__) {
        console.log('[AppContent Token Refresh] Failed to refresh token on resume', error);
      }
    }
  }, [dispatch, token]);
  const refreshTokenOnResumeRef = useRef(refreshTokenOnResume);
  refreshTokenOnResumeRef.current = refreshTokenOnResume;

  useMountEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const wasBackground = appStateRef.current.match(/inactive|background/);
      appStateRef.current = nextAppState;
      if (wasBackground && nextAppState === 'active') {
        refreshTokenOnResumeRef.current().catch(() => undefined);
        resumePendingVideoUploads().catch(() => undefined);
      }
    });

    return () => {
      subscription.remove();
    };
  });

  useMountEffect(() => {
    resumePendingVideoUploads().catch(() => undefined);
  });

  ignoreAuthLinksRef.current = !!authState.getProfileData?.emailVerified;

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return () => undefined;
    }
    const onBackPress = () => {
      if (!navigationRef.isReady()) {
        return true;
      }
      const currentRouteName = navigationRef.getCurrentRoute()?.name;
      const rootState = navigationRef.getRootState();
      const rootIndex =
        typeof rootState?.index === 'number'
          ? rootState.index
          : (rootState?.routes?.length ?? 1) - 1;
      const previousRouteName =
        rootIndex > 0 && Array.isArray(rootState?.routes)
          ? rootState.routes[rootIndex - 1]?.name
          : undefined;

      if (token && currentRouteName && PUBLIC_ROUTES.has(currentRouteName)) {
        navigationRef.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'MainRoot' }],
          })
        );
        return true;
      }

      if (token && previousRouteName && PUBLIC_ROUTES.has(previousRouteName)) {
        return true;
      }

      if (navigationRef.canGoBack()) {
        navigationRef.goBack();
      }
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [navigationRef, token]);

  useEffect(() => {
    if (!token) {
      hasFetchedProfileRef.current = false;
      mfaOnboardingRequestedUserRef.current = null;
      mfaOnboardingInFlightRef.current = false;
      return;
    }

    if (hasFetchedProfileRef.current) {
      return;
    }

    hasFetchedProfileRef.current = true;
    dispatch(getProfile.Request({ token }));
  }, [dispatch, token]);

  useEffect(() => {
    if (authChecked) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(overlayTranslate, {
          toValue: -screenHeight,
          duration: 1000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [authChecked, fadeAnim, overlayTranslate, screenHeight]);

  useEffect(() => {
    if (!navigationReady) {
      if (__DEV__) {
        console.log('[AppContent Navigation] Skipping - navigation not ready');
      }
      return;
    }
    const currentRoute = navigationRef.getCurrentRoute();
    const currentRouteName = currentRoute?.name;
    const currentRouteParams = (currentRoute?.params ?? {}) as any;
    const rootState = navigationRef.getRootState();
    const rootRouteName = rootState?.routes?.[rootState.index ?? 0]?.name;
    const hasValidToken = token !== '';
    const profileData = authState.getProfileData;
    const hasProfileData = profileData != null;
    const isProfileCompleted = profileData?.isProfileCompleted === true;
    const isProfileLoading = authState.isLoading;
    const hasProfileError = authState.getProfileError;
    const isEmailVerified = !!profileData?.emailVerified;
    const hasVerifiedEmail = isEmailVerified || isProfileCompleted;
    const hasActiveMfa = profileData?.mfaConfig?.isMfaActive === true;
    const isMfaEnrollmentScreenActive =
      currentRouteName === 'Login' &&
      !!currentRouteParams?.mfaOnboardingFlow &&
      !!currentRouteParams?.initialMfaChallenge?.enrollmentRequired &&
      !hasActiveMfa;

    if (__DEV__) {
      console.log('[AppContent Navigation] Effect triggered:', {
        currentRoute: currentRouteName,
        hasValidToken,
        emailVerified: isEmailVerified,
        isProfileLoading,
        hasProfileData,
        isProfileCompleted,
        hasProfileError: !!hasProfileError,
        hasActiveMfa,
        isMfaEnrollmentScreenActive,
        platform: Platform.OS,
      });
    }

    if (!hasValidToken) {
      if (currentRouteName && !PUBLIC_ROUTES.has(currentRouteName)) {
        if (__DEV__) {
          console.log(
            '[AppContent Navigation] Invalid token, resetting to Login',
            currentRouteName
          );
        }
        clearAuthTokens().catch(() => undefined);
        dispatch(logout());
        navigationRef.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          })
        );
      }
      return;
    }

    // On iOS, avoid navigation races while email is still unverified on ConfirmLogin.
    if (Platform.OS === 'ios' && currentRouteName === 'ConfirmLogin' && !hasVerifiedEmail) {
      if (__DEV__) {
        console.log(
          '[AppContent Navigation] iOS - on ConfirmLogin (unverified), letting LoginComponent handle navigation'
        );
      }
      return;
    }

    // Don't navigate while profile is loading to avoid race conditions
    // This ensures we have complete profile data before making navigation decisions
    if (hasValidToken && isProfileLoading) {
      if (__DEV__) {
        console.log('[AppContent Navigation] Waiting - profile is loading');
      }
      return;
    }

    // Avoid navigating to email verification until we have profile data (or a known error).
    if (hasValidToken && !hasProfileData && !hasProfileError) {
      if (__DEV__) {
        console.log('[AppContent Navigation] Waiting - profile not loaded yet');
      }
      return;
    }

    // If profile fetch failed but user is authenticated, still allow navigation
    // DrawerNav will show onboarding since getProfileData will be null/undefined
    const shouldNavigate = hasValidToken && (hasProfileData || hasProfileError);

    if (__DEV__) {
      console.log('[AppContent Navigation] shouldNavigate:', shouldNavigate);
    }

    // Navigate to MainRoot if user has verified email
    // DrawerNav (MainRoot) will handle showing either the main app or the onboarding stack
    if (hasValidToken && hasVerifiedEmail && (shouldNavigate || !isProfileLoading)) {
      if (isMfaEnrollmentScreenActive) {
        if (__DEV__) {
          console.log(
            '[AppContent Navigation] Holding on Login for MFA onboarding flow before MainRoot'
          );
        }
        return;
      }
      ignoreAuthLinksRef.current = true;
      const now = Date.now();
      const recentNavigation = lastNavigationRef.current;
      const wasRecentlyNavigatedToMainRoot =
        recentNavigation?.route === 'MainRoot' && now - recentNavigation.timestamp < 2000;
      if (currentRouteName === 'ConfirmLogin') {
        if (__DEV__) {
          console.log(
            '[AppContent Navigation] Email verified on ConfirmLogin, resetting to MainRoot'
          );
        }
        lastNavigationRef.current = { route: 'MainRoot', timestamp: now };
        // Use reset to clear the navigation stack and go directly to MainRoot
        // This avoids issues with goBack() potentially undoing the navigation
        navigationRef.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'MainRoot' }],
          })
        );
        return;
      }
      if (rootRouteName !== 'MainRoot') {
        if (wasRecentlyNavigatedToMainRoot) {
          if (__DEV__) {
            console.log('[AppContent Navigation] Skipping - recently navigated to MainRoot');
          }
          return;
        }
        if (__DEV__) {
          console.log('[AppContent Navigation] Navigating to MainRoot (email verified)');
        }
        lastNavigationRef.current = { route: 'MainRoot', timestamp: now };
        navigationRef.dispatch(CommonActions.navigate('MainRoot'));
      } else if (__DEV__) {
        console.log('[AppContent Navigation] Already on MainRoot');
      }
    } else if (hasValidToken && !hasVerifiedEmail) {
      // Check if we recently navigated to ConfirmLogin (within last 2 seconds)
      // This prevents duplicate navigation when SignUp screen and AppContent both try to navigate
      const now = Date.now();
      const recentNavigation = lastNavigationRef.current;
      const wasRecentlyNavigated =
        recentNavigation?.route === 'ConfirmLogin' && now - recentNavigation.timestamp < 2000;

      if (currentRouteName !== 'ConfirmLogin' && !wasRecentlyNavigated) {
        if (__DEV__) {
          console.log('[AppContent Navigation] Navigating to ConfirmLogin (email not verified)');
        }
        lastNavigationRef.current = { route: 'ConfirmLogin', timestamp: now };
        navigationRef.dispatch(CommonActions.navigate('ConfirmLogin'));
      } else if (__DEV__) {
        console.log(
          wasRecentlyNavigated
            ? '[AppContent Navigation] Skipping - recently navigated to ConfirmLogin'
            : '[AppContent Navigation] Already on ConfirmLogin'
        );
      }
    } else if (__DEV__) {
      console.log('[AppContent Navigation] No navigation action taken');
    }
  }, [
    navigationReady,
    navigationRef,
    token,
    authState.getProfileData,
    authState.isLoading,
    authState.getProfileError,
    dispatch,
    beginMandatoryMfaGate,
  ]);

  useEffect(() => {
    if (!navigationReady || !token || authState.isLoading) {
      return;
    }

    const profileData = authState.getProfileData;
    if (!profileData?.emailVerified) {
      return;
    }
    if (profileData?.isProfileCompleted !== true) {
      return;
    }

    if (profileData?.mfaConfig?.isMfaActive) {
      return;
    }

    const currentRouteName = navigationRef.getCurrentRoute()?.name;
    const feedLandingRoutes = new Set(['Home', 'HomeTab', 'Main', 'MainRoot']);
    if (!currentRouteName || !feedLandingRoutes.has(currentRouteName)) {
      return;
    }

    beginMandatoryMfaGate(profileData).catch(() => undefined);
  }, [
    navigationReady,
    token,
    authState.isLoading,
    authState.getProfileData,
    navigationRef,
    beginMandatoryMfaGate,
  ]);

  const linkingConfig: LinkingOptions<MainStackParamList>['config'] = {
    screens: {
      ConfirmLogin: {
        path: '/auth/:action',
        parse: {
          action: (action: string) => action,
          mode: (mode: string) => mode,
          oobCode: (oobCode: string) => oobCode,
          token: (tokenParam: string) => tokenParam,
          apiKey: (apiKey: string) => apiKey,
          lang: (lang: string) => lang,
        },
      },
      SignUp: { path: '/signup/:action' },
      Login: { path: '/login/:action' },
      SinglePost: {
        path: '/post/social/:postId',
      },
      SingleRss: {
        path: '/post/:type/:postId',
        parse: {
          type: (type: string) => type,
          postId: (postId: string) => postId,
        },
      },
      MainRoot: {
        screens: {
          Main: {
            screens: {
              ExploreTab: {
                screens: {
                  UserProfile: {
                    path: '/profile/:id',
                  },
                },
              },
            },
          },
          Settings: {
            screens: {
              InfluencerStepTwo: { path: '/influencer/login/:action' },
              InfluencerSettings: { path: '/influencer-settings/:action/:service' },
            },
          },
        },
      },
    },
  };

  const sanitizeUrl = (rawUrl?: string | null) => {
    if (!rawUrl) {
      return rawUrl ?? null;
    }
    try {
      const url = new URL(rawUrl);
      ['apiKey', 'oobCode', 'token', 'access_token'].forEach((key) => {
        url.searchParams.delete(key);
      });
      return url.toString();
    } catch {
      return rawUrl;
    }
  };

  const normalizeLink = useCallback((rawUrl?: string | null) => {
    if (!rawUrl) {
      return rawUrl ?? null;
    }
    if (__DEV__) {
      console.log('[Deep Link normalizeLink] RAW URL:', rawUrl);
    }
    try {
      const parsed = new URL(rawUrl);

      // Firebase Dynamic Links use a 'link' parameter that contains the actual deep link.
      // Example: https://app.onebodyapp.com/?link=https://app.onebodyapp.com/verify/action?...
      const nestedLink = parsed.searchParams.get('link');
      if (nestedLink) {
        const decoded = decodeURIComponent(nestedLink);
        if (__DEV__) {
          console.log('[Deep Link normalizeLink] Extracted Firebase Dynamic Link:', decoded);
        }
        return decoded;
      }

      // Also check for 'ifl' parameter (iOS fallback link in Firebase Dynamic Links)
      const iosFallbackLink = parsed.searchParams.get('ifl');
      if (iosFallbackLink) {
        const decoded = decodeURIComponent(iosFallbackLink);
        if (__DEV__) {
          console.log('[Deep Link normalizeLink] Extracted iOS fallback link:', decoded);
        }
        return decoded;
      }

      if (__DEV__) {
        console.log('[Deep Link normalizeLink] No nested link found, returning raw URL');
      }
      return rawUrl;
    } catch (error) {
      if (__DEV__) {
        console.log('[Deep Link normalizeLink] URL parse failed:', error, 'returning raw');
      }
      return rawUrl;
    }
  }, []);

  // Deep link deduplication to prevent iOS from processing the same link twice
  const lastProcessedUrl = useRef<{ url: string; timestamp: number } | null>(null);
  const DEDUP_WINDOW_MS = 2000; // 2 second window for deduplication

  const shouldProcessUrl = (url: string | null): boolean => {
    if (!url) return false;

    const now = Date.now();
    const last = lastProcessedUrl.current;

    // Check if this is the same URL within the deduplication window
    if (last && last.url === url && now - last.timestamp < DEDUP_WINDOW_MS) {
      if (__DEV__) {
        console.log('[Deep Link] SKIPPING duplicate URL within', DEDUP_WINDOW_MS, 'ms:', url);
      }
      return false;
    }

    // Update the last processed URL
    lastProcessedUrl.current = { url, timestamp: now };
    return true;
  };

  const shouldIgnoreAuthLink = useCallback((url?: string | null) => {
    if (!url) return false;
    if (!ignoreAuthLinksRef.current) return false;
    return (
      url.includes('/auth/action') ||
      url.includes('/__/auth/action') ||
      url.includes('/verify/') ||
      url.includes('/verify-email')
    );
  }, []);

  const openNotificationsCenter = useCallback(() => {
    navigationRef.dispatch(
      CommonActions.navigate({
        name: 'MainRoot',
        params: {
          screen: 'Main',
          params: {
            screen: 'HomeTab',
            params: {
              screen: 'Notifications',
            },
          },
        },
      } as any)
    );
  }, [navigationRef]);

  const handleLocalNotificationOpen = useCallback(
    (data?: Record<string, string> | null) => {
      const url = normalizeLink(data?.url || data?.deepLink || data?.link || null);
      if (shouldIgnoreAuthLink(url)) {
        return;
      }

      if (url) {
        Linking.openURL(url).catch(() => {
          openNotificationsCenter();
        });
        return;
      }

      openNotificationsCenter();
    },
    [normalizeLink, openNotificationsCenter, shouldIgnoreAuthLink]
  );
  const handleLocalNotificationOpenRef = useRef(handleLocalNotificationOpen);
  handleLocalNotificationOpenRef.current = handleLocalNotificationOpen;

  useEffect(() => {
    if (!token) {
      disconnectChatSocket();
      clearCachedPushToken().catch(() => undefined);
      return undefined;
    }

    const profileData = authState.getProfileData;
    if (!profileData) {
      return undefined;
    }

    const pushEnabled = profileData.pushNotificationsEnabled !== false;
    const shouldKeepSyncing = () => authState.getProfileData?.pushNotificationsEnabled !== false;
    let isMounted = true;

    const bootstrapPush = async () => {
      if (pushEnabled) {
        await enablePushNotifications(token);
      } else {
        await disablePushNotifications(token);
      }

      await ensureChatReady(token).catch(() => undefined);
    };

    bootstrapPush().catch(() => undefined);

    const unsubscribeTokenRefresh = subscribeToPushTokenRefresh(() => token, shouldKeepSyncing);
    const unsubscribeForeground = subscribeToForegroundPushMessages(
      async (payload, remoteMessage) => {
        if (!isMounted) {
          return;
        }

        if (Platform.OS === 'android') {
          await displayAndroidLocalNotificationIfNeeded(remoteMessage, {
            isForeground: true,
            payload,
          });
          return;
        }

        const toastMessage = payload.body ? `${payload.title}\n${payload.body}` : payload.title;
        toast.show(toastMessage, {
          placement: 'top',
          type: 'normal',
        });
      }
    );

    return () => {
      isMounted = false;
      unsubscribeTokenRefresh();
      unsubscribeForeground();
    };
  }, [authState.getProfileData, authState.getProfileData?.pushNotificationsEnabled, token, toast]);

  useMountEffect(() => {
    const unsubscribeForegroundNotificationEvent = notifee.onForegroundEvent(
      async ({ type, detail }) => {
        if (type !== EventType.PRESS) {
          return;
        }

        handleLocalNotificationOpenRef.current(
          detail.notification?.data as Record<string, string> | undefined
        );
      }
    );

    notifee
      .getInitialNotification()
      .then((initialNotification) => {
        if (!initialNotification?.notification?.data) {
          return;
        }

        handleLocalNotificationOpenRef.current(
          initialNotification.notification.data as Record<string, string> | undefined
        );
      })
      .catch(() => undefined);

    return () => {
      unsubscribeForegroundNotificationEvent();
    };
  });

  const resolvePostLinkState = (path: string) => {
    const [pathWithoutQuery, rawQuery] = path.split('?');
    const match = pathWithoutQuery.match(/^\/post\/([^/]+)\/([^/?#]+)$/i);

    if (!match) {
      return null;
    }

    const rawType = decodeURIComponent(match[1] ?? '').toLowerCase();
    const postId = decodeURIComponent(match[2] ?? '');
    if (!postId) {
      return null;
    }

    const queryParams = new URLSearchParams(rawQuery ?? '');
    const commentId = queryParams.get('commentId') ?? undefined;

    if (rawType === PostType.social) {
      return {
        routes: [
          {
            name: 'SinglePost',
            params: {
              postId,
              ...(commentId ? { threadRootCommentId: commentId } : undefined),
            },
          },
        ],
      };
    }

    if (rawType === PostType.prayer) {
      return {
        routes: [
          {
            name: 'MainRoot',
            state: {
              routes: [
                {
                  name: 'PrayerWall',
                  state: {
                    routes: [
                      {
                        name: 'Single',
                        params: {
                          postId,
                          ...(commentId ? { threadRootCommentId: commentId } : undefined),
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      };
    }

    if (rawType === PostType.rss || rawType === PostType.watch) {
      return {
        routes: [
          {
            name: 'SingleRss',
            params: {
              postId,
              postType: rawType === PostType.watch ? PostType.watch : PostType.rss,
              ...(commentId ? { threadRootCommentId: commentId } : undefined),
            },
          },
        ],
      };
    }

    return null;
  };

  const resolveChatLinkState = (path: string) => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const [pathWithoutQuery, rawQuery] = normalizedPath.split('?');
    const directMatch = pathWithoutQuery.match(/^\/chat\/direct\/([^/?#]+)$/i);
    const groupMatch = pathWithoutQuery.match(/^\/chat\/group\/([^/?#]+)$/i);
    const query = new URLSearchParams(rawQuery || '');

    if (directMatch) {
      const peerUserId = decodeURIComponent(directMatch[1] ?? '');
      if (!peerUserId) {
        return null;
      }

      return {
        routes: [
          {
            name: 'MainRoot',
            state: {
              routes: [
                {
                  name: 'Main',
                  state: {
                    routes: [
                      {
                        name: 'Messages',
                        state: {
                          routes: [
                            {
                              name: 'ChatDetail',
                              params: {
                                conversationType: 'direct',
                                peerUserId,
                                peerName: query.get('peerName') || 'Secure Chat',
                                peerUsername: query.get('peerUsername') || undefined,
                                peerAvatarUri: query.get('peerAvatarUri') || undefined,
                                messageId: query.get('messageId') || undefined,
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      };
    }

    if (groupMatch) {
      const groupId = decodeURIComponent(groupMatch[1] ?? '');
      if (!groupId) {
        return null;
      }

      return {
        routes: [
          {
            name: 'MainRoot',
            state: {
              routes: [
                {
                  name: 'Main',
                  state: {
                    routes: [
                      {
                        name: 'Messages',
                        state: {
                          routes: [
                            {
                              name: 'ChatDetail',
                              params: {
                                conversationType: 'group',
                                groupId,
                                groupName: query.get('groupName') || 'Group Chat',
                                messageId: query.get('messageId') || undefined,
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      };
    }

    return null;
  };

  const linking: LinkingOptions<MainStackParamList> = {
    prefixes: ['https://app.onebodyapp.com', 'https://auth.onebodyapp.com', 'onebodyapp://'],
    config: linkingConfig,
    getStateFromPath(path, options) {
      if (__DEV__) {
        console.log('[Deep Link getStateFromPath] Input path:', path);
      }
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      // Handle both old and new Firebase Auth verification URL patterns
      let adjustedPath = normalizedPath;

      // Firebase uses __/auth/action for email verification (new Firebase hosting pattern)
      if (normalizedPath.startsWith('/__/auth/action')) {
        adjustedPath = normalizedPath.replace('/__/auth/action', '/auth/action');
        if (__DEV__) {
          console.log('[Deep Link getStateFromPath] Adjusted __/auth/action to:', adjustedPath);
        }
      }
      // Legacy /verify-email pattern (fallback)
      else if (normalizedPath.startsWith('/verify-email')) {
        adjustedPath = normalizedPath.replace('/verify-email', '/auth/action');
        if (__DEV__) {
          console.log('[Deep Link getStateFromPath] Adjusted /verify-email to:', adjustedPath);
        }
      }
      // New universal link pattern (JWT auth): /verify/<type>?token=...
      else if (normalizedPath.startsWith('/verify/')) {
        adjustedPath = normalizedPath.replace('/verify/', '/auth/');
        if (__DEV__) {
          console.log('[Deep Link getStateFromPath] Adjusted /verify/* to:', adjustedPath);
        }
      }
      // Legacy /auth/verify pattern - DEPRECATED, but kept for backwards compatibility.
      // New verification links should use /verify/action from the API.
      else if (normalizedPath.startsWith('/auth/verify')) {
        adjustedPath = normalizedPath.replace('/auth/verify', '/auth/action');
        if (__DEV__) {
          console.log('[Deep Link getStateFromPath] Adjusted /auth/verify to:', adjustedPath);
        }
      }

      const postState = resolvePostLinkState(adjustedPath);
      if (postState) {
        if (__DEV__) {
          console.log('[Deep Link getStateFromPath] Resolved post link:', adjustedPath, postState);
        }
        return postState as any;
      }

      const chatState = resolveChatLinkState(adjustedPath);
      if (chatState) {
        if (__DEV__) {
          console.log('[Deep Link getStateFromPath] Resolved chat link:', adjustedPath, chatState);
        }
        return chatState as any;
      }

      const state = getStateFromPathDefault(adjustedPath, (options ?? linkingConfig) as any);
      if (__DEV__) {
        console.log(
          '[Deep Link getStateFromPath] Match result:',
          state?.routes?.[0]?.name,
          state?.routes?.[0]?.params
        );
      }
      return state;
    },
    async getInitialURL() {
      const rawUrl = await Linking.getInitialURL();
      if (__DEV__) {
        console.log('[Deep Link] getInitialURL RAW (before normalize):', rawUrl);
      }
      const url = normalizeLink(rawUrl);
      if (shouldIgnoreAuthLink(url)) {
        if (__DEV__) {
          console.log('[Deep Link] getInitialURL: Ignoring auth link after verification');
        }
        return null;
      }
      if (__DEV__) {
        console.log('[Deep Link] getInitialURL NORMALIZED:', sanitizeUrl(url));
      }
      if (url && shouldProcessUrl(url)) {
        return url;
      }
      if (url) {
        // URL was filtered out as duplicate
        if (__DEV__) {
          console.log('[Deep Link] getInitialURL: URL filtered as duplicate');
        }
        return null;
      }
      const message = await getInitialNotification(firebaseMessaging);
      queueRemoteNotificationPayload(message).catch(() => undefined);
      const notificationUrl = normalizeLink(message?.data?.url as string);
      if (shouldIgnoreAuthLink(notificationUrl)) {
        if (__DEV__) {
          console.log('[Deep Link] Notification URL ignored after verification');
        }
        return null;
      }
      if (__DEV__) {
        console.log('[Deep Link] Notification URL:', sanitizeUrl(notificationUrl));
      }
      if (notificationUrl && shouldProcessUrl(notificationUrl)) {
        return notificationUrl;
      }
      if (message?.data && !notificationUrl) {
        openNotificationsCenter();
      }
      return null;
    },
    subscribe(listener) {
      const onReceiveURL = ({ url }: { url: string }) => {
        if (__DEV__) {
          console.log('[Deep Link] subscribe onReceiveURL RAW:', url);
        }
        const normalized = normalizeLink(url);
        if (shouldIgnoreAuthLink(normalized)) {
          if (__DEV__) {
            console.log('[Deep Link] subscribe: Ignoring auth link after verification');
          }
          return;
        }
        if (__DEV__) {
          console.log('[Deep Link] subscribe onReceiveURL NORMALIZED:', sanitizeUrl(normalized));
        }
        if (normalized && shouldProcessUrl(normalized)) {
          listener(normalized);
        } else if (normalized) {
          if (__DEV__) {
            console.log('[Deep Link] subscribe: URL filtered as duplicate');
          }
        }
      };
      const subscription = Linking.addEventListener('url', onReceiveURL);
      const unsubscribeNotification = onNotificationOpenedApp(firebaseMessaging, (message) => {
        queueRemoteNotificationPayload(message).catch(() => undefined);
        const url = normalizeLink(message.data?.url as string);
        if (shouldIgnoreAuthLink(url)) {
          if (__DEV__) {
            console.log('[Deep Link] Notification ignored after verification');
          }
          return;
        }
        if (__DEV__) {
          console.log('[Deep Link] Notification opened with URL:', sanitizeUrl(url));
        }
        if (url && shouldProcessUrl(url)) {
          listener(url);
        } else if (url) {
          if (__DEV__) {
            console.log('[Deep Link] Notification: URL filtered as duplicate');
          }
        } else {
          openNotificationsCenter();
        }
      });
      return () => {
        subscription.remove();
        unsubscribeNotification();
      };
    },
  };

  const theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: Colors.main.white,
      card: Colors.neutral[800],
      text: Colors.neutral.brand,
      primary: Colors.primarySapphire.brand,
      border: Colors.neutral[900],
    },
  };

  const darkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: '#0D0D0D',
      card: '#121212',
      text: '#F6F7F8',
      primary: Colors.primarySapphire.brand,
      border: '#1B1B1B',
    },
  };
  // Early return after all hooks have been called
  if (!authChecked && initializing) {
    return null;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      theme={scheme === 'dark' ? darkTheme : theme}
      onReady={() => {
        routeNameRef.current = navigationRef.getCurrentRoute()?.name;
        setNavigationReady(true);
      }}
      onStateChange={() => {
        routeNameRef.current = navigationRef.getCurrentRoute()?.name;
      }}
    >
      <ReactionProvider>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <MainStack.Navigator
            initialRouteName="Intro"
            screenOptions={{
              gestureEnabled: false,
              fullScreenGestureEnabled: false,
            }}
          >
            <MainStack.Screen
              name="MainRoot"
              component={DrawerNav}
              options={{ headerShown: false }}
            />
            <MainStack.Screen
              name="SinglePost"
              component={SinglePost}
              options={{
                headerShown: Platform.OS !== 'android',
                headerBackTitleVisible: false,
                title: 'Comment',
                headerTitleStyle: {
                  fontSize: 24,
                  fontWeight: '700',
                  letterSpacing: 0.3,
                },
                animation: 'slide_from_right',
              }}
            />
            <MainStack.Screen
              name="SingleRss"
              component={RssPost}
              options={{
                headerShown: Platform.OS !== 'android',
                headerBackTitleVisible: false,
                title: 'Comment',
                animation: 'slide_from_right',
              }}
            />
            <MainStack.Screen
              name="WatchPortal"
              component={Watch}
              options={{
                headerShown: false,
                animation: 'fade_from_bottom',
                statusBarStyle: 'light',
                statusBarColor: '#000000',
                statusBarTranslucent: true,
              }}
            />
            <MainStack.Screen
              name="Post"
              component={NewPost}
              options={({ route }) => ({
                headerShown: false,
                title: route.params?.postId ? 'Edit Post' : 'Create Post',
                headerBackTitleVisible: false,
                ...(Platform.OS === 'android'
                  ? {
                      statusBarStyle: scheme === 'dark' ? 'light' : 'dark',
                      statusBarColor:
                        scheme === 'dark' ? darkTheme.colors.background : theme.colors.background,
                    }
                  : {}),
              })}
            />
            <MainStack.Screen
              name="UploadImage"
              component={UploadImage}
              options={{
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
            <MainStack.Screen
              name="ReportPost"
              component={ReportPost}
              options={{
                headerShown: false,
                animation: 'slide_from_left',
                ...(Platform.OS === 'android'
                  ? {
                      statusBarStyle: scheme === 'dark' ? 'light' : 'dark',
                      statusBarColor:
                        scheme === 'dark' ? darkTheme.colors.background : theme.colors.background,
                      statusBarTranslucent: false,
                    }
                  : {}),
              }}
            />
            <MainStack.Screen
              name="ReportStatus"
              component={ReportStatus}
              options={{
                headerShown: false,
                animation: 'slide_from_right',
                ...(Platform.OS === 'android'
                  ? {
                      statusBarStyle: scheme === 'dark' ? 'light' : 'dark',
                      statusBarColor:
                        scheme === 'dark' ? darkTheme.colors.background : theme.colors.background,
                      statusBarTranslucent: false,
                    }
                  : {}),
              }}
            />

            <MainStack.Screen
              name="Intro"
              component={Intro}
              options={{
                headerShown: false,
                ...(Platform.OS === 'android' && { animation: 'slide_from_right' }),
              }}
            />
            <MainStack.Screen
              name="AccountType"
              component={AccountType}
              options={{
                ...(Platform.OS === 'ios'
                  ? { ...headerOptions, animation: 'slide_from_right' }
                  : {}),
                ...(Platform.OS === 'android' && {
                  headerShown: false,
                  animation: 'slide_from_right',
                }),
              }}
            />
            <MainStack.Screen
              name="Login"
              component={Login}
              options={{
                ...(Platform.OS === 'ios'
                  ? {
                      ...headerOptions,
                      headerStyle: {
                        backgroundColor:
                          scheme === 'dark' ? darkTheme.colors.background : theme.colors.background,
                      },
                      headerTransparent: false,
                    }
                  : {
                      headerShown: false,
                      statusBarStyle: scheme === 'dark' ? 'light' : 'dark',
                      statusBarColor:
                        scheme === 'dark' ? darkTheme.colors.background : theme.colors.background,
                      statusBarTranslucent: false,
                    }),
              }}
            />
            <MainStack.Screen
              name="SignUp"
              component={Signup}
              options={{
                ...(Platform.OS === 'ios'
                  ? {
                      ...headerOptions,
                      animation: 'slide_from_right',
                      headerTransparent: false,
                      headerStyle: {
                        backgroundColor:
                          scheme === 'dark' ? darkTheme.colors.background : theme.colors.background,
                      },
                    }
                  : {
                      headerShown: false,
                    }),
              }}
            />
            <MainStack.Screen
              name="ForgotPassword"
              component={ForgotPassword}
              options={{
                ...(Platform.OS === 'ios'
                  ? {
                      ...headerOptions,
                      headerTransparent: false,
                      headerStyle: {
                        backgroundColor:
                          scheme === 'dark' ? darkTheme.colors.background : theme.colors.background,
                      },
                    }
                  : {
                      headerShown: false,
                    }),
              }}
            />
            <MainStack.Screen
              name="ConfirmLogin"
              component={ConfirmLogin}
              options={() => ({
                presentation: 'modal',
                ...(Platform.OS === 'ios'
                  ? {
                      ...headerOptions,
                      headerTintColor: Colors.primary.brand,
                      headerBackTitle: '',
                      headerBackTitleVisible: false,
                      headerLeft: renderConfirmBackButton,
                    }
                  : {
                      headerShown: false,
                    }),
              })}
            />
            <MainStack.Screen
              name="VideoPost"
              component={VideoPost}
              options={{
                headerShown: false,
              }}
            />
          </MainStack.Navigator>
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: Colors.main.white,
              transform: [{ translateY: overlayTranslate }],
            }}
          />
        </Animated.View>
      </ReactionProvider>
    </NavigationContainer>
  );
}

export default AppContent; // Export the new component
