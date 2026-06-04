import { resolveResetPasswordLinkState } from './resetPasswordLinking';

describe('resolveResetPasswordLinkState', () => {
  it('routes mobile API reset links to the Clerk reset-code screen', () => {
    expect(resolveResetPasswordLinkState('/reset-password?token=reset-token')).toEqual({
      routes: [
        {
          name: 'ForgotPassword',
        },
      ],
    });
  });

  it('routes full universal reset links to the Clerk reset-code screen', () => {
    expect(
      resolveResetPasswordLinkState('https://app.onebodyapp.com/reset-password?token=reset-token')
    ).toEqual({
      routes: [
        {
          name: 'ForgotPassword',
        },
      ],
    });
  });

  it('routes custom scheme reset links to the Clerk reset-code screen', () => {
    expect(resolveResetPasswordLinkState('onebodyapp:///reset-password?token=reset-token')).toEqual({
      routes: [
        {
          name: 'ForgotPassword',
        },
      ],
    });
  });

  it('routes host-style custom scheme reset links to the Clerk reset-code screen', () => {
    expect(resolveResetPasswordLinkState('onebodyapp://reset-password?token=reset-token')).toEqual({
      routes: [
        {
          name: 'ForgotPassword',
        },
      ],
    });
  });

  it('routes reset links without tokens to the Clerk reset-code screen', () => {
    expect(resolveResetPasswordLinkState('https://app.onebodyapp.com/reset-password')).toEqual({
      routes: [
        {
          name: 'ForgotPassword',
        },
      ],
    });
  });

  it('routes login reset task links with tokens back to Login', () => {
    expect(resolveResetPasswordLinkState('/login/reset-password?token=reset-token')).toEqual({
      routes: [
        {
          name: 'Login',
          params: { resetPassword: true },
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
