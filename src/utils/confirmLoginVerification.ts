type ConfirmLoginRouteParams = {
  token?: string | null;
  prefillEmail?: string | null;
};

type ConfirmLoginVerificationDecisionParams = {
  currentRouteName?: string | null;
  currentRouteParams?: ConfirmLoginRouteParams | null;
  handledToken: string | null;
  hasAuthToken: boolean;
  hasVerifiedEmail: boolean;
  hasTransientVerificationState: boolean;
};

type ConfirmLoginVerificationRequest = {
  verificationToken: string;
  prefillEmail?: string;
};

type ConfirmLoginVerificationDecision = {
  nextHandledToken: string | null;
  shouldReset: boolean;
  request?: ConfirmLoginVerificationRequest;
};

export default function getConfirmLoginVerificationDecision(
  params: ConfirmLoginVerificationDecisionParams
): ConfirmLoginVerificationDecision {
  const hasHandledToken = !!params.handledToken;
  const shouldClearTransientState =
    hasHandledToken || params.hasTransientVerificationState === true;

  if (params.currentRouteName !== 'ConfirmLogin') {
    return {
      nextHandledToken: null,
      shouldReset: shouldClearTransientState,
    };
  }

  const verificationToken = params.currentRouteParams?.token?.trim() ?? '';
  if (!verificationToken) {
    return {
      nextHandledToken: null,
      shouldReset: shouldClearTransientState,
    };
  }

  if (!params.hasAuthToken || params.hasVerifiedEmail) {
    return {
      nextHandledToken: null,
      shouldReset: shouldClearTransientState,
    };
  }

  if (params.handledToken === verificationToken) {
    return {
      nextHandledToken: params.handledToken,
      shouldReset: false,
    };
  }

  return {
    nextHandledToken: verificationToken,
    shouldReset: false,
    request: {
      verificationToken,
      prefillEmail: params.currentRouteParams?.prefillEmail?.trim() || undefined,
    },
  };
}
