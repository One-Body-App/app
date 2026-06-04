import type { DimensionValue } from 'react-native';
import { Colors } from '@/src/styles';

type ResetPasswordStrength = {
  score: number;
  label: string;
  color: string;
  width: DimensionValue;
};

export function getResetPasswordStrength(password: string): ResetPasswordStrength {
  const hasMinLength = password.length >= 8;
  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  let score = [hasMinLength, hasMixedCase, hasNumber, hasSymbol].filter(Boolean).length;

  if (password && !hasMinLength) {
    score = 1;
  }

  if (!password) {
    return {
      score: 0,
      label: 'Strength: Enter password',
      color: Colors.neutral[200],
      width: '0%',
    };
  }

  if (score >= 3) {
    return {
      score,
      label: 'Strength: Strong',
      color: Colors.successFeedback.text,
      width: `${Math.min(score, 4) * 25}%` as DimensionValue,
    };
  }

  if (score === 2) {
    return {
      score,
      label: 'Strength: Medium',
      color: Colors.primarySapphire[500],
      width: '50%',
    };
  }

  return {
    score,
    label: 'Strength: Weak',
    color: Colors.errorFeedback[200],
    width: '25%',
  };
}

export function getResetPasswordErrorMessage(error: any) {
  const message =
    error?.errors?.[0]?.longMessage ??
    error?.errors?.[0]?.message ??
    error?.response?.message ??
    error?.message ??
    '';
  const normalized = String(message).toLowerCase();

  if (normalized.includes('expired')) {
    return 'This reset link has expired. Please request a new one.';
  }

  if (normalized.includes('invalid') || normalized.includes('missing token')) {
    return 'This reset link is invalid or expired. Please request a new one.';
  }

  if (
    normalized.includes('password') &&
    (normalized.includes('policy') ||
      normalized.includes('requirement') ||
      normalized.includes('too weak') ||
      normalized.includes('too short') ||
      normalized.includes('minimum') ||
      normalized.includes('must contain'))
  ) {
    return 'Password does not meet requirements. Please try a stronger password.';
  }

  if (
    normalized.includes('account migration') ||
    normalized.includes('clerk is not configured') ||
    normalized.includes('unable to update account password')
  ) {
    return 'Unable to reset password for this account. Please contact support.';
  }

  return 'Unable to reset password. Please try again.';
}
