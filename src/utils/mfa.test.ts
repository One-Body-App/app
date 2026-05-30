import resolveInitialMfaMethod from './mfa';
import type { MfaChallengeResponse } from '@/services/login';

const baseChallenge: MfaChallengeResponse = {
  mfaRequired: true,
  enrollmentRequired: false,
  mfaToken: 'mfa-token',
  preferredMethod: 'email',
  availableMethods: ['passkey', 'email'],
  emailMasked: 'p***@example.com',
  reason: 'mandatory_mfa',
};

describe('resolveInitialMfaMethod', () => {
  it('honors the backend preferred method for normal MFA challenges', () => {
    expect(resolveInitialMfaMethod(baseChallenge)).toBe('email');
  });

  it('prefers passkey during MFA enrollment when passkey is available', () => {
    expect(
      resolveInitialMfaMethod({
        ...baseChallenge,
        enrollmentRequired: true,
      })
    ).toBe('passkey');
  });

  it('falls back to email when the preferred method is unavailable', () => {
    expect(
      resolveInitialMfaMethod({
        ...baseChallenge,
        preferredMethod: 'backup',
      })
    ).toBe('email');
  });
});
