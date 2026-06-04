type LogoutGuardState = {
  logoutPending?: boolean;
  logoutCompletedAt?: number;
};

type DrawerAuthState = LogoutGuardState & {
  userToken?: string | null;
  getProfileData?: {
    isProfileCompleted?: boolean | null;
  } | null;
};

type MfaEnrollmentRouteParams = {
  mfaOnboardingFlow?: boolean | null;
  initialMfaChallenge?: {
    enrollmentRequired?: boolean | null;
  } | null;
};

type MandatoryMfaGateState = LogoutGuardState & {
  navigationReady?: boolean;
  userToken?: string | null;
  isProfileLoading?: boolean;
  bypassMandatoryMfaOnboarding?: boolean;
  currentRouteName?: string | null;
  currentRouteParams?: MfaEnrollmentRouteParams | null;
  getProfileData?: {
    emailVerified?: boolean | null;
    isProfileCompleted?: boolean | null;
    mfaConfig?: {
      isMfaActive?: boolean | null;
    } | null;
  } | null;
};

type ImmediateMandatoryMfaGateState = MandatoryMfaGateState & {
  previousProfileCompleted?: boolean | null;
};

type ProfileResultGuard = LogoutGuardState & {
  currentToken?: string | null;
  requestToken?: string | null;
};

type AuthNavigationProfileLoadState = {
  userToken?: string | null;
  isProfileLoading?: boolean;
  currentRouteName?: string | null;
  hasProfileData?: boolean;
};

type AuthenticatedIntroRouteState = LogoutGuardState & {
  userToken?: string | null;
  currentRouteName?: string | null;
};

const PUBLIC_AUTH_ROUTES = new Set([
  'Intro',
  'AccountType',
  'Login',
  'SignUp',
  'ForgotPassword',
  'ResetPassword',
  'ConfirmLogin',
]);

export function isExplicitLogoutActive(state: LogoutGuardState): boolean {
  return state.logoutPending === true || typeof state.logoutCompletedAt === 'number';
}

export function isPublicAuthRoute(routeName?: string | null): boolean {
  return typeof routeName === 'string' && PUBLIC_AUTH_ROUTES.has(routeName);
}

export function isOnboardingRoute(routeName?: string | null): boolean {
  return typeof routeName === 'string' && routeName.startsWith('Onboarding');
}

export function getDrawerNavMode(state: DrawerAuthState): 'main' | 'onboarding' | 'placeholder' {
  if (!state.userToken || isExplicitLogoutActive(state)) {
    return 'placeholder';
  }

  if (!state.getProfileData) {
    return 'placeholder';
  }

  return state.getProfileData.isProfileCompleted === true ? 'main' : 'onboarding';
}

export function isMfaEnrollmentScreenActive(
  state: Pick<MandatoryMfaGateState, 'currentRouteName' | 'currentRouteParams' | 'getProfileData'>
): boolean {
  const hasActiveMfa = state.getProfileData?.mfaConfig?.isMfaActive === true;

  return (
    state.currentRouteName === 'Login' &&
    state.currentRouteParams?.mfaOnboardingFlow === true &&
    state.currentRouteParams?.initialMfaChallenge?.enrollmentRequired === true &&
    !hasActiveMfa
  );
}

export function shouldBeginMandatoryMfaOnboarding(state: MandatoryMfaGateState): boolean {
  if (!state.navigationReady || !state.userToken || state.isProfileLoading) {
    return false;
  }

  if (isExplicitLogoutActive(state)) {
    return false;
  }

  if (state.bypassMandatoryMfaOnboarding === true) {
    return false;
  }

  if (!state.getProfileData) {
    return false;
  }

  if (state.getProfileData.emailVerified !== true) {
    return false;
  }

  if (state.getProfileData.mfaConfig?.isMfaActive === true) {
    return false;
  }

  if (isMfaEnrollmentScreenActive(state)) {
    return false;
  }

  return true;
}

export function shouldImmediatelyBeginMandatoryMfaOnboarding(
  state: ImmediateMandatoryMfaGateState
): boolean {
  if (state.previousProfileCompleted !== false) {
    return false;
  }

  return shouldBeginMandatoryMfaOnboarding(state);
}

export function shouldAcceptProfileResult(state: ProfileResultGuard): boolean {
  if (isExplicitLogoutActive(state)) {
    return false;
  }

  if (!state.requestToken || !state.currentToken) {
    return false;
  }

  return state.requestToken === state.currentToken;
}

export function shouldWaitForProfileBeforeAuthNavigation(
  state: AuthNavigationProfileLoadState
): boolean {
  if (!state.userToken || !state.isProfileLoading) {
    return false;
  }

  if (!state.hasProfileData) {
    return true;
  }

  return !isPublicAuthRoute(state.currentRouteName);
}

export function shouldLogoutAuthenticatedIntroRoute(state: AuthenticatedIntroRouteState): boolean {
  if (isExplicitLogoutActive(state)) {
    return false;
  }

  return Boolean(state.userToken) && state.currentRouteName === 'Intro';
}
