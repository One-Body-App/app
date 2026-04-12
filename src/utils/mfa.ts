import type { MfaChallengeResponse, MfaMethod } from '@/services/login';

export default function resolveInitialMfaMethod(challenge: MfaChallengeResponse): MfaMethod {
  if (challenge.enrollmentRequired && challenge.availableMethods.includes('passkey')) {
    return 'passkey';
  }

  if (challenge.availableMethods.includes(challenge.preferredMethod)) {
    return challenge.preferredMethod;
  }

  if (challenge.availableMethods.includes('email')) {
    return 'email';
  }

  return challenge.availableMethods[0] ?? challenge.preferredMethod;
}
