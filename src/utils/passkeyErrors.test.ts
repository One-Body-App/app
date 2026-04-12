import {
  getPasskeyErrorSignature,
  isPasskeyAssociationError,
  isPasskeyCancellationError,
  PASSKEY_ASSOCIATION_FALLBACK_MESSAGE,
} from './passkeyErrors';

describe('passkeyErrors', () => {
  it('detects iOS webcredentials association failures', () => {
    const error = new Error(
      "RequestFailed: The operation couldn't be completed. Unable to verify webcredentials association of 9N63S64RJ2.com.onebodyapp with domain app.onebodyapp.com. Please try again in a few seconds. (code: 1004, domain: com.apple.AuthenticationServices.AuthorizationError)"
    );

    expect(isPasskeyAssociationError(error)).toBe(true);
    expect(getPasskeyErrorSignature(error)).toContain('webcredentials');
  });

  it('does not misclassify generic passkey failures as association failures', () => {
    expect(isPasskeyAssociationError(new Error('No passkey challenge in progress'))).toBe(false);
  });

  it('detects passkey cancellation signatures', () => {
    expect(isPasskeyCancellationError(new Error('NotAllowedError: User canceled'))).toBe(true);
  });

  it('exports the user-facing association fallback message', () => {
    expect(PASSKEY_ASSOCIATION_FALLBACK_MESSAGE).toContain('temporarily unavailable');
  });
});
