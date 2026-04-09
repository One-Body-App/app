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

const getActiveNestedRouteNameFromState = (route: RouteLike | undefined): string | undefined => {
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

  return getActiveNestedRouteNameFromState(childRoute) ?? childRoute.name;
};

const getHomeTabFocusedRouteName = (route: RouteLike | undefined): string =>
  getActiveNestedRouteNameFromState(route) ??
  getScreenParam(route?.params) ??
  getNestedScreenParam(route?.params) ??
  'Home';

export default getHomeTabFocusedRouteName;
