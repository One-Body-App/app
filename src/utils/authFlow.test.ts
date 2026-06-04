import {
  getDrawerNavMode,
  isExplicitLogoutActive,
  isMfaEnrollmentScreenActive,
  isOnboardingRoute,
  isPublicAuthRoute,
  shouldAcceptProfileResult,
  shouldBeginMandatoryMfaOnboarding,
  shouldImmediatelyBeginMandatoryMfaOnboarding,
  shouldLogoutAuthenticatedIntroRoute,
  shouldWaitForProfileBeforeAuthNavigation,
} from './authFlow';

describe('authFlow', () => {
  it('treats pending or completed logout as explicit logout state', () => {
    expect(isExplicitLogoutActive({ logoutPending: true })).toBe(true);
    expect(isExplicitLogoutActive({ logoutCompletedAt: 123 })).toBe(true);
    expect(isExplicitLogoutActive({ logoutPending: false })).toBe(false);
  });

  it('uses a placeholder drawer mode when no authenticated session exists', () => {
    expect(
      getDrawerNavMode({
        userToken: '',
        getProfileData: null,
      })
    ).toBe('placeholder');
  });

  it('treats auth entry screens as public auth routes', () => {
    expect(isPublicAuthRoute('AccountType')).toBe(true);
    expect(isPublicAuthRoute('ResetPassword')).toBe(true);
    expect(isPublicAuthRoute('MainRoot')).toBe(false);
  });

  it('identifies onboarding stack routes', () => {
    expect(isOnboardingRoute('OnboardingInfluencers')).toBe(true);
    expect(isOnboardingRoute('Login')).toBe(false);
  });

  it('uses a placeholder drawer mode during explicit logout even with stale profile data', () => {
    expect(
      getDrawerNavMode({
        userToken: 'token',
        logoutCompletedAt: 123,
        getProfileData: { isProfileCompleted: false },
      })
    ).toBe('placeholder');
  });

  it('uses onboarding mode only for authenticated users with loaded incomplete profiles', () => {
    expect(
      getDrawerNavMode({
        userToken: 'token',
        getProfileData: { isProfileCompleted: false },
      })
    ).toBe('onboarding');
  });

  it('uses main mode for authenticated users with completed profiles', () => {
    expect(
      getDrawerNavMode({
        userToken: 'token',
        getProfileData: { isProfileCompleted: true },
      })
    ).toBe('main');
  });

  it('rejects stale profile writes during logout or token mismatch', () => {
    expect(
      shouldAcceptProfileResult({
        currentToken: 'current-token',
        requestToken: 'request-token',
      })
    ).toBe(false);

    expect(
      shouldAcceptProfileResult({
        currentToken: 'current-token',
        requestToken: 'current-token',
        logoutPending: true,
      })
    ).toBe(false);

    expect(
      shouldAcceptProfileResult({
        currentToken: 'current-token',
        requestToken: 'current-token',
      })
    ).toBe(true);
  });

  it('continues auth navigation on public routes when profile data is already available', () => {
    expect(
      shouldWaitForProfileBeforeAuthNavigation({
        userToken: 'token',
        isProfileLoading: true,
        currentRouteName: 'SignUp',
        hasProfileData: true,
      })
    ).toBe(false);
  });

  it('waits for profile loading when authenticated profile data is not available', () => {
    expect(
      shouldWaitForProfileBeforeAuthNavigation({
        userToken: 'token',
        isProfileLoading: true,
        currentRouteName: 'SignUp',
        hasProfileData: false,
      })
    ).toBe(true);
  });

  it('keeps private route auth navigation deferred during profile refresh', () => {
    expect(
      shouldWaitForProfileBeforeAuthNavigation({
        userToken: 'token',
        isProfileLoading: true,
        currentRouteName: 'Home',
        hasProfileData: true,
      })
    ).toBe(true);
  });

  it('logs out authenticated users that reach Intro outside explicit logout', () => {
    expect(
      shouldLogoutAuthenticatedIntroRoute({
        userToken: 'token',
        currentRouteName: 'Intro',
      })
    ).toBe(true);

    expect(
      shouldLogoutAuthenticatedIntroRoute({
        userToken: 'token',
        currentRouteName: 'Intro',
        logoutPending: true,
      })
    ).toBe(false);
  });

  it('identifies the dedicated MFA onboarding login screen', () => {
    expect(
      isMfaEnrollmentScreenActive({
        currentRouteName: 'Login',
        currentRouteParams: {
          mfaOnboardingFlow: true,
          initialMfaChallenge: { enrollmentRequired: true },
        },
        getProfileData: {
          authSecurity: { requiresMfaEnrollment: true },
        },
      })
    ).toBe(true);
  });

  it('begins mandatory MFA onboarding immediately after onboarding completion', () => {
    expect(
      shouldBeginMandatoryMfaOnboarding({
        navigationReady: true,
        userToken: 'token',
        isProfileLoading: false,
        currentRouteName: 'OnboardingInfluencers',
        getProfileData: {
          emailVerified: true,
          isProfileCompleted: true,
          authSecurity: { requiresMfaEnrollment: true },
        },
      })
    ).toBe(true);
  });

  it('immediately begins mandatory MFA onboarding when onboarding just completed', () => {
    expect(
      shouldImmediatelyBeginMandatoryMfaOnboarding({
        navigationReady: true,
        userToken: 'token',
        isProfileLoading: false,
        currentRouteName: 'OnboardingInfluencers',
        previousProfileCompleted: false,
        getProfileData: {
          emailVerified: true,
          isProfileCompleted: true,
          authSecurity: { requiresMfaEnrollment: true },
        },
      })
    ).toBe(true);
  });

  it('does not immediately begin mandatory MFA onboarding when completion was already handled', () => {
    expect(
      shouldImmediatelyBeginMandatoryMfaOnboarding({
        navigationReady: true,
        userToken: 'token',
        isProfileLoading: false,
        currentRouteName: 'OnboardingInfluencers',
        previousProfileCompleted: true,
        getProfileData: {
          emailVerified: true,
          isProfileCompleted: true,
          authSecurity: { requiresMfaEnrollment: true },
        },
      })
    ).toBe(false);
  });

  it('does not begin mandatory MFA onboarding when Clerk does not require enrollment', () => {
    expect(
      shouldBeginMandatoryMfaOnboarding({
        navigationReady: true,
        userToken: 'token',
        isProfileLoading: false,
        currentRouteName: 'OnboardingInfluencers',
        getProfileData: {
          emailVerified: true,
          isProfileCompleted: true,
          authSecurity: { requiresMfaEnrollment: false },
        },
      })
    ).toBe(false);
  });

  it('begins mandatory MFA onboarding after email verification before onboarding completes', () => {
    expect(
      shouldBeginMandatoryMfaOnboarding({
        navigationReady: true,
        userToken: 'token',
        isProfileLoading: false,
        currentRouteName: 'OnboardingInfluencers',
        getProfileData: {
          emailVerified: true,
          isProfileCompleted: false,
          authSecurity: { requiresMfaEnrollment: true },
        },
      })
    ).toBe(true);
  });

  it('does not begin mandatory MFA onboarding before email verification', () => {
    expect(
      shouldBeginMandatoryMfaOnboarding({
        navigationReady: true,
        userToken: 'token',
        isProfileLoading: false,
        currentRouteName: 'OnboardingInfluencers',
        getProfileData: {
          emailVerified: false,
          isProfileCompleted: true,
          authSecurity: { requiresMfaEnrollment: true },
        },
      })
    ).toBe(false);
  });

  it('does not begin mandatory MFA onboarding during explicit logout', () => {
    expect(
      shouldBeginMandatoryMfaOnboarding({
        navigationReady: true,
        userToken: 'token',
        isProfileLoading: false,
        logoutPending: true,
        currentRouteName: 'OnboardingInfluencers',
        getProfileData: {
          emailVerified: true,
          isProfileCompleted: true,
          authSecurity: { requiresMfaEnrollment: true },
        },
      })
    ).toBe(false);
  });

  it('does not begin mandatory MFA onboarding for social-authenticated sessions', () => {
    expect(
      shouldBeginMandatoryMfaOnboarding({
        navigationReady: true,
        userToken: 'token',
        isProfileLoading: false,
        bypassMandatoryMfaOnboarding: true,
        currentRouteName: 'Home',
        getProfileData: {
          emailVerified: true,
          isProfileCompleted: true,
          authSecurity: { requiresMfaEnrollment: true },
        },
      })
    ).toBe(false);
  });

  it('does not begin mandatory MFA onboarding when already on the MFA enrollment screen', () => {
    expect(
      shouldBeginMandatoryMfaOnboarding({
        navigationReady: true,
        userToken: 'token',
        isProfileLoading: false,
        currentRouteName: 'Login',
        currentRouteParams: {
          mfaOnboardingFlow: true,
          initialMfaChallenge: { enrollmentRequired: true },
        },
        getProfileData: {
          emailVerified: true,
          isProfileCompleted: true,
          authSecurity: { requiresMfaEnrollment: true },
        },
      })
    ).toBe(false);
  });
});
