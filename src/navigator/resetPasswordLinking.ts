type ResetPasswordLinkState =
  | {
      routes: [
        {
          name: 'ForgotPassword';
          params?: { email?: string };
        },
      ];
    }
  | {
      routes: [
        {
          name: 'Login';
          params: { resetPassword: true };
        },
      ];
    };

export const resolveResetPasswordLinkState = (path: string): ResetPasswordLinkState | null => {
  const routeInput = getResetPasswordRouteInput(path);
  const normalizedPath = routeInput.startsWith('/') ? routeInput : `/${routeInput}`;
  const [pathWithoutHash] = normalizedPath.split('#');
  const [pathWithoutQuery, rawQuery] = pathWithoutHash.split('?');
  const routePath = pathWithoutQuery.replace(/\/+$/, '').toLowerCase();
  const isApiResetPath = routePath === '/reset-password';
  const isLoginTaskPath =
    routePath === '/login/reset-password' || routePath === '/auth/reset-password';

  if (!isApiResetPath && !isLoginTaskPath) {
    return null;
  }

  const query = new URLSearchParams(rawQuery ?? '');
  if (isApiResetPath) {
    const email = query.get('email') ?? undefined;
    return {
      routes: [
        {
          name: 'ForgotPassword',
          params: email ? { email } : undefined,
        },
      ],
    };
  }

  return {
    routes: [
      {
        name: 'Login',
        params: { resetPassword: true },
      },
    ],
  };
};

const getResetPasswordRouteInput = (path: string) => {
  const trimmed = path.trim();
  try {
    const url = new URL(trimmed);
    if (url.protocol === 'onebodyapp:') {
      const appPath = url.pathname && url.pathname !== '/' ? url.pathname : `/${url.hostname}`;
      return `${appPath}${url.search}${url.hash}`;
    }

    if (url.protocol === 'https:' || url.protocol === 'http:') {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    // React Navigation often passes an already-normalized route path.
  }

  return trimmed;
};
