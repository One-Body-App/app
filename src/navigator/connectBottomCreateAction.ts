import type { ConnectTab } from '../screens/connectportal/data';

type ConnectCreateTarget = 'post' | 'go' | 'serve';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getScreenParam = (params: unknown): string | undefined => {
  if (!isRecord(params)) {
    return undefined;
  }

  const { screen } = params;
  return typeof screen === 'string' ? screen : undefined;
};

const getActiveNestedRoute = (route: unknown): Record<string, unknown> | null => {
  if (!isRecord(route)) {
    return null;
  }

  const { state } = route;
  if (!isRecord(state) || !Array.isArray(state.routes) || typeof state.index !== 'number') {
    return route;
  }

  const childRoute = state.routes[state.index];
  return getActiveNestedRoute(childRoute) ?? route;
};

const getConnectTabFromParams = (params: unknown): ConnectTab => {
  if (!isRecord(params)) {
    return 'Places';
  }

  const { initialTab } = params;
  if (initialTab === 'Go!' || initialTab === 'Serve' || initialTab === 'Places') {
    return initialTab;
  }

  return 'Places';
};

export const resolveBottomTabCreateTarget = (state: unknown): ConnectCreateTarget => {
  if (!isRecord(state) || !Array.isArray(state.routes) || typeof state.index !== 'number') {
    return 'post';
  }

  const currentRoute = state.routes[state.index];
  if (!isRecord(currentRoute) || currentRoute.name !== 'ConnectTab') {
    return 'post';
  }

  const activeConnectRoute = getActiveNestedRoute(currentRoute);
  const activeRouteName = activeConnectRoute?.name;

  if (activeRouteName === 'ConnectPortal' || activeRouteName === 'ConnectMap') {
    const connectTab = getConnectTabFromParams(activeConnectRoute.params);
    if (connectTab === 'Go!') {
      return 'go';
    }
    if (connectTab === 'Serve') {
      return 'serve';
    }
    return 'post';
  }

  if (activeRouteName === 'ConnectServeHome') {
    return 'serve';
  }

  const pendingScreen = getScreenParam(currentRoute.params);
  if (pendingScreen === 'ConnectPortal' || pendingScreen === 'ConnectMap') {
    const nestedParams = isRecord(currentRoute.params) ? currentRoute.params.params : undefined;
    const connectTab = getConnectTabFromParams(nestedParams);
    if (connectTab === 'Go!') {
      return 'go';
    }
    if (connectTab === 'Serve') {
      return 'serve';
    }
  }

  if (pendingScreen === 'ConnectServeHome') {
    return 'serve';
  }

  return 'post';
};

export type { ConnectCreateTarget };
