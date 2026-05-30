import { ApiCall } from './api';

export const syncClerkUserProfile = async (params: {
  email?: string;
  name?: string;
  username?: string;
  accountType?: string | null;
}) => {
  return ApiCall({
    route: 'auth/clerk/sync',
    verb: 'post',
    token: true,
    params: {
      email: params.email,
      name: params.name,
      username: params.username,
      accountType: params.accountType ?? undefined,
    },
  });
};
