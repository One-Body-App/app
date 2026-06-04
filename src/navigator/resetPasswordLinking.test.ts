import { resolveResetPasswordLinkState } from './resetPasswordLinking';

describe('resolveResetPasswordLinkState', () => {
  it('routes mobile API reset links to ResetPassword with the token', () => {
    expect(resolveResetPasswordLinkState('/reset-password?token=reset-token')).toEqual({
      routes: [
        {
          name: 'ResetPassword',
          params: { token: 'reset-token' },
        },
      ],
    });
  });

  it('routes full universal reset links to ResetPassword with the token', () => {
    expect(
      resolveResetPasswordLinkState('https://app.onebodyapp.com/reset-password?token=reset-token')
    ).toEqual({
      routes: [
        {
          name: 'ResetPassword',
          params: { token: 'reset-token' },
        },
      ],
    });
  });

  it('routes custom scheme reset links to ResetPassword with the token', () => {
    expect(resolveResetPasswordLinkState('onebodyapp:///reset-password?token=reset-token')).toEqual({
      routes: [
        {
          name: 'ResetPassword',
          params: { token: 'reset-token' },
        },
      ],
    });
  });

  it('routes host-style custom scheme reset links to ResetPassword with the token', () => {
    expect(resolveResetPasswordLinkState('onebodyapp://reset-password?token=reset-token')).toEqual({
      routes: [
        {
          name: 'ResetPassword',
          params: { token: 'reset-token' },
        },
      ],
    });
  });

  it('routes reset links without tokens to ResetPassword so the screen can show recovery copy', () => {
    expect(resolveResetPasswordLinkState('https://app.onebodyapp.com/reset-password')).toEqual({
      routes: [
        {
          name: 'ResetPassword',
        },
      ],
    });
  });

  it('routes login reset task links with tokens to ResetPassword', () => {
    expect(resolveResetPasswordLinkState('/login/reset-password?token=reset-token')).toEqual({
      routes: [
        {
          name: 'ResetPassword',
          params: { token: 'reset-token' },
        },
      ],
    });
  });

  it('routes Clerk reset task links without API tokens back to Login', () => {
    expect(resolveResetPasswordLinkState('/login/reset-password')).toEqual({
      routes: [
        {
          name: 'Login',
          params: { resetPassword: true },
        },
      ],
    });
  });

  it('ignores unrelated paths', () => {
    expect(resolveResetPasswordLinkState('/post/social/post-1')).toBeNull();
  });
});
