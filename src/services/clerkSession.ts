type TokenGetter = () => Promise<string | null>;
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

export const getClerkSessionToken = async () => {
  if (!tokenGetter) {
    return null;
  }

  return tokenGetter();
};

export const signOutClerkSession = async () => {
  if (!signOutFn) {
    return;
  }

  await signOutFn();
};
