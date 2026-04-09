import authReducer from './AuthReducers';
import { completeLogout, logout, setLoginData, getProfile } from '../actions/AuthActions';

describe('AuthReducer logout flow', () => {
  it('marks logout pending and clears auth state on logout completion', () => {
    const loggedInState = authReducer(
      authReducer(undefined, setLoginData({ token: 'access-token' })),
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
  });
});
