export const PASSKEY_ASSOCIATION_FALLBACK_MESSAGE =
  'Passkey verification is temporarily unavailable on this device. We sent a code to your email instead.';

export const getPasskeyErrorSignature = (error: unknown) => {
  if (!error) return '';
  if (typeof error === 'string') return error.toLowerCase();

  const raw = error as any;
  const parts = [
    raw?.name,
    raw?.code,
    raw?.message,
    raw?.domain,
    typeof raw?.cause === 'string' ? raw.cause : raw?.cause?.message,
    String(error),
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  return parts.join(' ');
};

export const isPasskeyCancellationError = (error: unknown) => {
  const signature = getPasskeyErrorSignature(error);
  if (!signature) return false;

  return (
    signature.includes('notallowederror') ||
    signature.includes('usercancel') ||
    signature.includes('user_cancel') ||
    signature.includes('cancelled') ||
    signature.includes('canceled') ||
    signature.includes('aborted')
  );
};

export const isPasskeyAssociationError = (error: unknown) => {
  const signature = getPasskeyErrorSignature(error);
  if (!signature) {
    return false;
  }

  const hasAssociationSignal =
    signature.includes('webcredentials') ||
    (signature.includes('verify') && signature.includes('association'));
  const hasAppleAuthSignal =
    signature.includes('authorizationerror') ||
    signature.includes('authenticationservices') ||
    signature.includes('1004');

  return hasAssociationSignal && hasAppleAuthSignal;
};
