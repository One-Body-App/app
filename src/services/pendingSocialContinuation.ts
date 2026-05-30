import type { SocialAuthIntent, SocialProfileDetails, SocialProvider } from './socialAuth';

export type PendingSocialContinuation = {
  intent: SocialAuthIntent;
  provider: SocialProvider;
  idToken: string;
  nonce?: string;
  details?: SocialProfileDetails;
  createdAt: number;
};

const PENDING_SOCIAL_CONTINUATION_TTL_MS = 10 * 60 * 1000;

let pendingSocialContinuation: PendingSocialContinuation | null = null;

const isExpired = (createdAt: number, now = Date.now()) =>
  now - createdAt > PENDING_SOCIAL_CONTINUATION_TTL_MS;

export const savePendingSocialContinuation = (
  value: Omit<PendingSocialContinuation, 'createdAt'>
) => {
  pendingSocialContinuation = {
    ...value,
    createdAt: Date.now(),
  };
};

export const loadPendingSocialContinuation = (
  now = Date.now()
): PendingSocialContinuation | null => {
  if (!pendingSocialContinuation) {
    return null;
  }

  if (isExpired(pendingSocialContinuation.createdAt, now)) {
    pendingSocialContinuation = null;
    return null;
  }

  return pendingSocialContinuation;
};

export const clearPendingSocialContinuation = () => {
  pendingSocialContinuation = null;
};
