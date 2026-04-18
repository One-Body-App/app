import authReducer from './AuthReducers';
import {
  completeLogout,
  logout,
  setLoginData,
  getProfile,
  verifyEmailToken,
} from '../actions/AuthActions';

describe('AuthReducer logout flow', () => {
  it('marks logout pending and clears auth state on logout completion', () => {
    const loggedInState = authReducer(
      authReducer(
        undefined,
        setLoginData({
          token: 'access-token',
          authMethod: 'social',
          bypassMandatoryMfaOnboarding: true,
        })
      ),
      getProfile.Success({
        _id: 'user-1',
        emailVerified: true,
        isProfileCompleted: true,
        name: 'Test User',
      })
    );

    const pendingState = authReducer(loggedInState, logout({ destination: 'Intro' }));

    expect(pendingState.userToken).toBe('access-token');
    expect(pendingState.getProfileData?._id).toBe('user-1');
    expect(pendingState.logoutPending).toBe(true);
    expect(pendingState.logoutDestination).toBe('Intro');

    const completedState = authReducer(
      pendingState,
      completeLogout({ completedAt: 123, destination: 'Intro' })
    );

    expect(completedState.userToken).toBe('');
    expect(completedState.userProfile).toBeNull();
    expect(completedState.userData).toBeNull();
    expect(completedState.getProfileData).toBeNull();
    expect(completedState.getProfileError).toBeNull();
    expect(completedState.loginErrors).toEqual([]);
    expect(completedState.logoutPending).toBe(false);
    expect(completedState.logoutCompletedAt).toBe(123);
    expect(completedState.logoutDestination).toBe('Intro');
    expect(completedState.sessionAuthMethod).toBeNull();
    expect(completedState.bypassMandatoryMfaOnboarding).toBe(false);
  });

  it('stores social session context when login data includes a bypass flag', () => {
    const state = authReducer(
      undefined,
      setLoginData({
        token: 'access-token',
        authMethod: 'social',
        bypassMandatoryMfaOnboarding: true,
      })
    );

    expect(state.userToken).toBe('access-token');
    expect(state.sessionAuthMethod).toBe('social');
    expect(state.bypassMandatoryMfaOnboarding).toBe(true);

    const refreshedState = authReducer(state, setLoginData({ token: 'rotated-token' }));

    expect(refreshedState.userToken).toBe('rotated-token');
    expect(refreshedState.sessionAuthMethod).toBe('social');
    expect(refreshedState.bypassMandatoryMfaOnboarding).toBe(true);
  });

  it('clears stale profile state when a new session explicitly resets profile data', () => {
    const loggedInState = authReducer(
      authReducer(
        undefined,
        setLoginData({
          token: 'old-access-token',
          authMethod: 'social',
          bypassMandatoryMfaOnboarding: true,
        })
      ),
      getProfile.Success({
        _id: 'user-1',
        emailVerified: true,
        isProfileCompleted: true,
        name: 'Previous User',
      })
    );

    const nextState = authReducer(
      loggedInState,
      setLoginData({
        token: 'new-access-token',
        resetProfile: true,
      })
    );

    expect(nextState.userToken).toBe('new-access-token');
    expect(nextState.userProfile).toBeNull();
    expect(nextState.userData).toBeNull();
    expect(nextState.getProfileData).toBeNull();
    expect(nextState.getProfileError).toBeNull();
    expect(nextState.getProfileSuccess).toBeUndefined();
    expect(nextState.verifyEmailTokenPending).toBe(false);
    expect(nextState.verifyEmailTokenError).toBeNull();
    expect(nextState.verifyEmailTokenSuccess).toBeUndefined();
    expect(nextState.sessionAuthMethod).toBe('social');
    expect(nextState.bypassMandatoryMfaOnboarding).toBe(true);
  });
});

describe('AuthReducer verify email token flow', () => {
  it('sets pending state on request and clears prior error', () => {
    const state = authReducer(undefined, verifyEmailToken.Failed('Previous verification error'));

    const nextState = authReducer(
      state,
      verifyEmailToken.Request({ verificationToken: 'verify-token' })
    );

    expect(nextState.verifyEmailTokenPending).toBe(true);
    expect(nextState.verifyEmailTokenError).toBeNull();
    expect(nextState.verifyEmailTokenSuccess).toBeUndefined();
  });

  it('clears pending and error on success', () => {
    const state = authReducer(
      undefined,
      verifyEmailToken.Request({ verificationToken: 'verify-token' })
    );

    const nextState = authReducer(state, verifyEmailToken.Success(true));

    expect(nextState.verifyEmailTokenPending).toBe(false);
    expect(nextState.verifyEmailTokenError).toBeNull();
    expect(nextState.verifyEmailTokenSuccess).toBe(true);
  });

  it('stores the failure message on failure', () => {
    const state = authReducer(
      undefined,
      verifyEmailToken.Request({ verificationToken: 'verify-token' })
    );

    const nextState = authReducer(state, verifyEmailToken.Failed('Token expired'));

    expect(nextState.verifyEmailTokenPending).toBe(false);
    expect(nextState.verifyEmailTokenError).toBe('Token expired');
    expect(nextState.verifyEmailTokenSuccess).toBe(false);
  });

  it('clears transient verification state on reset', () => {
    const state = authReducer(undefined, verifyEmailToken.Failed('Token expired'));

    const nextState = authReducer(state, verifyEmailToken.Reset());

    expect(nextState.verifyEmailTokenPending).toBe(false);
    expect(nextState.verifyEmailTokenError).toBeNull();
    expect(nextState.verifyEmailTokenSuccess).toBeUndefined();
  });
});
