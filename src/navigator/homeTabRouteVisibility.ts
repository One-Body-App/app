export type HomeTabVisibilityState = {
  focusedRouteName: string;
  selectedTab?: string;
  shouldHideTabBar: boolean;
};

type RouteLike = {
  name?: string;
  params?: unknown;
  state?: {
    index?: number;
    routes?: RouteLike[];
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getScreenParam = (params: unknown): string | undefined => {
  if (!isRecord(params)) {
    return undefined;
  }

  const { screen } = params;
  return typeof screen === 'string' ? screen : undefined;
};

const getNestedScreenParam = (params: unknown): string | undefined => {
  if (!isRecord(params)) {
    return undefined;
  }

  return getScreenParam(params.params);
};

const getNestedParams = (params: unknown): unknown => {
  if (!isRecord(params)) {
    return undefined;
  }

  return params.params;
};

const getSelectedTabParam = (params: unknown): string | undefined => {
  if (!isRecord(params)) {
    return undefined;
  }

  const { selectedTab } = params;
  return typeof selectedTab === 'string' ? selectedTab : undefined;
};

const getActiveNestedRouteFromState = (route: RouteLike | undefined): RouteLike | undefined => {
  if (
    !route?.state ||
    !Array.isArray(route.state.routes) ||
    typeof route.state.index !== 'number'
  ) {
    return undefined;
  }

  const childRoute = route.state.routes[route.state.index];
  if (!childRoute) {
    return undefined;
  }

  return getActiveNestedRouteFromState(childRoute) ?? childRoute;
};

export const getHomeTabVisibilityState = (route: RouteLike | undefined): HomeTabVisibilityState => {
  const activeNestedRoute = getActiveNestedRouteFromState(route);
  const focusedRouteName =
    activeNestedRoute?.name ??
    getScreenParam(route?.params) ??
    getNestedScreenParam(route?.params) ??
    'Home';
  const selectedTab = activeNestedRoute
    ? getSelectedTabParam(activeNestedRoute.params)
    : getSelectedTabParam(getNestedParams(route?.params));

  return {
    focusedRouteName,
    selectedTab,
    shouldHideTabBar:
      focusedRouteName === 'Notifications' ||
      (focusedRouteName === 'Home' && selectedTab === 'pray'),
  };
};

const getHomeTabFocusedRouteName = (route: RouteLike | undefined): string =>
  getHomeTabVisibilityState(route).focusedRouteName;

export default getHomeTabFocusedRouteName;
