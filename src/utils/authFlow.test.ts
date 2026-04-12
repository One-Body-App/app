import {
  getDrawerNavMode,
  isExplicitLogoutActive,
  isMfaEnrollmentScreenActive,
  isPublicAuthRoute,
  shouldAcceptProfileResult,
  shouldBeginMandatoryMfaOnboarding,
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

  it('treats AccountType as a public auth route', () => {
    expect(isPublicAuthRoute('AccountType')).toBe(true);
    expect(isPublicAuthRoute('MainRoot')).toBe(false);
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

  it('identifies the dedicated MFA onboarding login screen', () => {
    expect(
      isMfaEnrollmentScreenActive({
        currentRouteName: 'Login',
        currentRouteParams: {
          mfaOnboardingFlow: true,
          initialMfaChallenge: { enrollmentRequired: true },
        },
        getProfileData: {
          mfaConfig: { isMfaActive: false },
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
          mfaConfig: { isMfaActive: false },
        },
      })
    ).toBe(true);
  });

  it('does not begin mandatory MFA onboarding when MFA is already active', () => {
    expect(
      shouldBeginMandatoryMfaOnboarding({
        navigationReady: true,
        userToken: 'token',
        isProfileLoading: false,
        currentRouteName: 'OnboardingInfluencers',
        getProfileData: {
          emailVerified: true,
          isProfileCompleted: true,
          mfaConfig: { isMfaActive: true },
        },
      })
    ).toBe(false);
  });

  it('does not begin mandatory MFA onboarding before onboarding completes', () => {
    expect(
      shouldBeginMandatoryMfaOnboarding({
        navigationReady: true,
        userToken: 'token',
        isProfileLoading: false,
        currentRouteName: 'OnboardingInfluencers',
        getProfileData: {
          emailVerified: true,
          isProfileCompleted: false,
          mfaConfig: { isMfaActive: false },
        },
      })
    ).toBe(false);
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
          mfaConfig: { isMfaActive: false },
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
          mfaConfig: { isMfaActive: false },
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
          mfaConfig: { isMfaActive: false },
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
          mfaConfig: { isMfaActive: false },
        },
      })
    ).toBe(false);
  });
});
