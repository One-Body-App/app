import getConfirmLoginVerificationDecision from './confirmLoginVerification';

describe('getConfirmLoginVerificationDecision', () => {
  it('requests verification once for a confirm-login token route', () => {
    const decision = getConfirmLoginVerificationDecision({
      currentRouteName: 'ConfirmLogin',
      currentRouteParams: {
        token: 'verify-token',
        prefillEmail: 'person@example.com',
      },
      handledToken: null,
      hasAuthToken: true,
      hasVerifiedEmail: false,
      hasTransientVerificationState: false,
    });

    expect(decision).toEqual({
      nextHandledToken: 'verify-token',
      shouldReset: false,
      request: {
        verificationToken: 'verify-token',
        prefillEmail: 'person@example.com',
      },
    });
  });

  it('does not request the same token twice in the same session', () => {
    const decision = getConfirmLoginVerificationDecision({
      currentRouteName: 'ConfirmLogin',
      currentRouteParams: {
        token: 'verify-token',
        prefillEmail: 'person@example.com',
      },
      handledToken: 'verify-token',
      hasAuthToken: true,
      hasVerifiedEmail: false,
      hasTransientVerificationState: true,
    });

    expect(decision).toEqual({
      nextHandledToken: 'verify-token',
      shouldReset: false,
    });
  });

  it('resets transient state when leaving ConfirmLogin', () => {
    const decision = getConfirmLoginVerificationDecision({
      currentRouteName: 'MainRoot',
      currentRouteParams: {},
      handledToken: 'verify-token',
      hasAuthToken: true,
      hasVerifiedEmail: false,
      hasTransientVerificationState: true,
    });

    expect(decision).toEqual({
      nextHandledToken: null,
      shouldReset: true,
    });
  });

  it('resets transient state when entering ConfirmLogin without a token', () => {
    const decision = getConfirmLoginVerificationDecision({
      currentRouteName: 'ConfirmLogin',
      currentRouteParams: {},
      handledToken: null,
      hasAuthToken: true,
      hasVerifiedEmail: false,
      hasTransientVerificationState: true,
    });

    expect(decision).toEqual({
      nextHandledToken: null,
      shouldReset: true,
    });
  });
});
