import { getResetPasswordErrorMessage, getResetPasswordStrength } from './resetPasswordUtils';

describe('ResetPassword helpers', () => {
  it('keeps short passwords weak even when they include multiple character types', () => {
    expect(getResetPasswordStrength('Aa1!').label).toBe('Strength: Weak');
  });

  it('marks longer mixed passwords as strong', () => {
    expect(getResetPasswordStrength('SecurePass1!').label).toBe('Strength: Strong');
  });

  it('maps invalid and expired token errors to reset-link messages', () => {
    expect(getResetPasswordErrorMessage({ message: 'Token invalid' })).toBe(
      'This reset link is invalid or expired. Please request a new one.'
    );
    expect(getResetPasswordErrorMessage({ message: 'Token expired' })).toBe(
      'This reset link has expired. Please request a new one.'
    );
  });

  it('maps password policy errors to stronger password guidance', () => {
    expect(
      getResetPasswordErrorMessage({ response: { message: 'Password does not meet requirements' } })
    ).toBe('Password does not meet requirements. Please try a stronger password.');
    expect(getResetPasswordErrorMessage({ message: 'Password is too weak' })).toBe(
      'Password does not meet requirements. Please try a stronger password.'
    );
  });

  it('maps account migration errors to support guidance', () => {
    expect(
      getResetPasswordErrorMessage({ response: { message: 'Unable to update account password' } })
    ).toBe('Unable to reset password for this account. Please contact support.');
  });
});
