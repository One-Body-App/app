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

type ProfileResultGuard = LogoutGuardState & {
  currentToken?: string | null;
  requestToken?: string | null;
};

const PUBLIC_AUTH_ROUTES = new Set([
  'Intro',
  'AccountType',
  'Login',
  'SignUp',
  'ForgotPassword',
  'ConfirmLogin',
]);

export function isExplicitLogoutActive(state: LogoutGuardState): boolean {
  return state.logoutPending === true || typeof state.logoutCompletedAt === 'number';
}

export function isPublicAuthRoute(routeName?: string | null): boolean {
  return typeof routeName === 'string' && PUBLIC_AUTH_ROUTES.has(routeName);
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

  if (state.getProfileData.isProfileCompleted !== true) {
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

export function shouldAcceptProfileResult(state: ProfileResultGuard): boolean {
  if (isExplicitLogoutActive(state)) {
    return false;
  }

  if (!state.requestToken || !state.currentToken) {
    return false;
  }

  return state.requestToken === state.currentToken;
}
