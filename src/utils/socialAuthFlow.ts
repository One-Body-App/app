import type {
  SocialAuthIntent,
  SocialLoginResponse,
  SocialProfileDetails,
  SocialProvider,
} from '@/services/socialAuth';

export type SocialSignupRequiredResponse = {
  signupRequired: true;
  provider?: SocialProvider;
  details?: SocialProfileDetails;
  message?: string;
};

export const isSocialSignupRequiredResponse = (
  response?: SocialLoginResponse | null
): response is SocialLoginResponse & SocialSignupRequiredResponse =>
  response?.signupRequired === true;

export const getSocialAuthErrorMessage = (response: unknown, fallback: string) => {
  const message = (response as { message?: unknown } | null)?.message;
  return typeof message === 'string' ? message : fallback;
};

export const getSocialAuthActionLabel = (intent: SocialAuthIntent) =>
  intent === 'signup' ? 'create your account' : 'sign in';
