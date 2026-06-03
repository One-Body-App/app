type TokenGetterOptions = {
  skipCache?: boolean;
};
type TokenGetter = (options?: TokenGetterOptions) => Promise<string | null>;
type SignOutFn = () => Promise<void>;

let tokenGetter: TokenGetter | null = null;
let signOutFn: SignOutFn | null = null;

export const setClerkSessionAccessors = (accessors: {
  getToken: TokenGetter;
  signOut: SignOutFn;
}) => {
  tokenGetter = accessors.getToken;
  signOutFn = accessors.signOut;
};

export const clearClerkSessionAccessors = () => {
  tokenGetter = null;
  signOutFn = null;
};

export const getClerkSessionToken = async (options?: { forceRefresh?: boolean }) => {
  if (!tokenGetter) {
    return null;
  }

  return tokenGetter(options?.forceRefresh ? { skipCache: true } : undefined);
};

export const signOutClerkSession = async () => {
  if (!signOutFn) {
    return;
  }

  await signOutFn();
};
